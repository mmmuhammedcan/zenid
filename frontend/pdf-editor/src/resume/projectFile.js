import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { migrateProject, normalizeProject, ProjectCompatibilityError } from "./projectSchema.js";

export const PROJECT_FILE_EXTENSION = ".zenid";
export const PROJECT_FILE_MIME = "application/vnd.zenid.project+zip";
export const MAX_PROJECT_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_UNCOMPRESSED_BYTES = 75 * 1024 * 1024;
export const MAX_MEDIA_ASSET_BYTES = 8 * 1024 * 1024;
// A valid project normally has only a handful of metadata files plus explicitly
// referenced resumes and assets. 256 leaves ample room for large workspaces
// while bounding central-directory parsing and per-entry decompressor setup.
export const MAX_ARCHIVE_ENTRIES = 256;
export const MAX_ARCHIVE_ENTRY_BYTES = 8 * 1024 * 1024;

const MEDIA_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function jsonBytes(value) {
  return strToU8(`${JSON.stringify(value, null, 2)}\n`);
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(strFromU8(bytes));
  } catch {
    throw new ProjectCompatibilityError(`${label} is not valid JSON.`, "INVALID_PROJECT_JSON");
  }
}

function isSafeArchivePath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.includes("\0") &&
    !path.split("/").includes("..")
  );
}

function safeResumePath(id) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "-");
  return `resumes/${safeId}.json`;
}

function safeAssetPath(id, mimeType) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "-");
  return `assets/${safeId}.${MEDIA_EXTENSIONS[mimeType]}`;
}

function hasPdfSignature(bytes) {
  return bytes?.byteLength >= 5 && strFromU8(bytes.subarray(0, 5)) === "%PDF-";
}

function hasMediaSignature(bytes, mimeType) {
  if (mimeType === "application/pdf") return hasPdfSignature(bytes);
  if (!bytes || bytes.byteLength < 12) return false;
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  if (mimeType === "image/webp") {
    return strFromU8(bytes.subarray(0, 4)) === "RIFF" && strFromU8(bytes.subarray(8, 12)) === "WEBP";
  }
  return false;
}

function referencedMediaAssetIds(project) {
  const media = project?.portfolio?.media || {};
  return [
    media.profileImageId,
    project?.portfolio?.resume?.uploadedAssetId,
    ...Object.values(media.projectImageIds || {}),
    ...Object.values(media.projectGalleryIds || {}).flatMap((ids) => (Array.isArray(ids) ? ids : [])),
    ...Object.values(media.certificateImageIds || {}),
  ].filter(Boolean);
}

function createArchiveResourceFilter() {
  let entryCount = 0;
  let expandedSize = 0;
  const entryNames = new Set();

  return (entry) => {
    entryCount += 1;
    if (entryCount > MAX_ARCHIVE_ENTRIES) {
      throw new ProjectCompatibilityError(
        `The ZenID project contains more than ${MAX_ARCHIVE_ENTRIES} entries. Remove unneeded files and try again.`,
        "ARCHIVE_ENTRY_COUNT_LIMIT"
      );
    }
    if (!isSafeArchivePath(entry.name)) {
      throw new ProjectCompatibilityError("The project contains an unsafe archive path.", "UNSAFE_ARCHIVE_PATH");
    }
    if (entryNames.has(entry.name)) {
      throw new ProjectCompatibilityError(
        "The project archive contains the same path more than once.",
        "DUPLICATE_ARCHIVE_ENTRY"
      );
    }
    entryNames.add(entry.name);

    // Stored entries materialize their compressed byte range directly. Requiring
    // matching sizes prevents forged metadata from understating that allocation.
    if (entry.compression === 0 && entry.size !== entry.originalSize) {
      throw new ProjectCompatibilityError(
        "The project archive contains inconsistent file-size metadata.",
        "INVALID_ARCHIVE"
      );
    }

    const materializedSize = entry.compression === 0 ? entry.size : entry.originalSize;
    if (materializedSize > MAX_ARCHIVE_ENTRY_BYTES) {
      throw new ProjectCompatibilityError(
        "A project archive entry exceeds the 8 MB safety limit. Remove or resize that file and try again.",
        "ARCHIVE_ENTRY_SIZE_LIMIT"
      );
    }
    expandedSize += materializedSize;
    if (expandedSize > MAX_UNCOMPRESSED_BYTES) {
      throw new ProjectCompatibilityError(
        "The project's expanded data exceeds 75 MB. Remove or resize files and try again.",
        "PROJECT_EXPANDED_SIZE_LIMIT"
      );
    }
    return true;
  };
}

function assertSerializableArchiveLimits(files) {
  const entries = Object.values(files);
  if (entries.length > MAX_ARCHIVE_ENTRIES) {
    throw new ProjectCompatibilityError(
      `The ZenID project contains more than ${MAX_ARCHIVE_ENTRIES} entries. Remove unneeded files before saving it.`,
      "ARCHIVE_ENTRY_COUNT_LIMIT"
    );
  }
  if (entries.some((bytes) => bytes.byteLength > MAX_ARCHIVE_ENTRY_BYTES)) {
    throw new ProjectCompatibilityError(
      "A project file exceeds the 8 MB archive-entry limit. Remove or resize it before saving.",
      "ARCHIVE_ENTRY_SIZE_LIMIT"
    );
  }
  const expandedSize = entries.reduce((total, bytes) => total + bytes.byteLength, 0);
  if (expandedSize > MAX_UNCOMPRESSED_BYTES) {
    throw new ProjectCompatibilityError(
      "The project's expanded data exceeds 75 MB. Remove or resize files before saving.",
      "PROJECT_EXPANDED_SIZE_LIMIT"
    );
  }
}

export function serializeProjectArchive(project, options = {}) {
  const normalized = normalizeProject(project);
  const resumeFiles = normalized.resumes.map((resume) => ({
    id: resume.id,
    path: safeResumePath(resume.id),
  }));
  const generatedPdfs = Array.isArray(options.generatedPdfs)
    ? options.generatedPdfs.map((entry) => {
        const safeId = String(entry.resumeId).replace(/[^a-zA-Z0-9_-]/g, "-");
        const bytes = entry.bytes instanceof Uint8Array ? entry.bytes : new Uint8Array(entry.bytes);
        if (!hasPdfSignature(bytes)) {
          throw new ProjectCompatibilityError("A generated resume is not a valid PDF.", "INVALID_GENERATED_PDF");
        }
        return {
          resumeId: entry.resumeId,
          path: `generated/${safeId}.pdf`,
          bytes,
        };
      })
    : [];
  const seenAssetIds = new Set();
  const assets = Array.isArray(options.assets)
    ? options.assets.map((entry) => {
        const id = String(entry.id || "").trim();
        const mimeType = entry.mimeType;
        const bytes = entry.bytes instanceof Uint8Array ? entry.bytes : new Uint8Array(entry.bytes || []);
        if (!id || seenAssetIds.has(id)) {
          throw new ProjectCompatibilityError("A project media asset has a missing or duplicate ID.", "INVALID_MEDIA_ASSET");
        }
        if (!MEDIA_EXTENSIONS[mimeType] || bytes.byteLength > MAX_MEDIA_ASSET_BYTES || !hasMediaSignature(bytes, mimeType)) {
          throw new ProjectCompatibilityError("A project media asset is invalid or unsupported.", "INVALID_MEDIA_ASSET");
        }
        seenAssetIds.add(id);
        return {
          id,
          kind: typeof entry.kind === "string" ? entry.kind : "portfolio-media",
          name: typeof entry.name === "string" ? entry.name : `image.${MEDIA_EXTENSIONS[mimeType]}`,
          mimeType,
          path: safeAssetPath(id, mimeType),
          bytes,
        };
      })
    : [];
  const manifest = {
    format: "zenid-project",
    schemaVersion: normalized.schemaVersion,
    exportedAt: options.exportedAt || new Date().toISOString(),
    profile: "profile.json",
    resumes: resumeFiles,
    portfolio: "portfolio/configuration.json",
    generatedPdfs: generatedPdfs.map(({ resumeId, path }) => ({ resumeId, path })),
    assets: assets.map(({ id, kind, name, mimeType, path }) => ({ id, kind, name, mimeType, path })),
  };

  const files = {
    "manifest.json": jsonBytes(manifest),
    "profile.json": jsonBytes(normalized.profile),
    "portfolio/configuration.json": jsonBytes(normalized.portfolio),
  };
  resumeFiles.forEach(({ id, path }) => {
    files[path] = jsonBytes(normalized.resumes.find((resume) => resume.id === id));
  });
  generatedPdfs.forEach(({ path, bytes }) => {
    files[path] = bytes;
  });
  assets.forEach(({ path, bytes }) => {
    files[path] = bytes;
  });

  assertSerializableArchiveLimits(files);
  const archive = zipSync(files, { level: 6 });
  if (archive.byteLength > MAX_PROJECT_FILE_BYTES) {
    throw new ProjectCompatibilityError(
      "The ZenID Project is larger than 25 MB. Remove or resize some portfolio images before saving it.",
      "PROJECT_TOO_LARGE"
    );
  }
  return archive;
}

function parseArchiveBundle(bytes) {
  let files;
  try {
    // fflate invokes this filter from central-directory metadata before it
    // allocates output for an entry, so every materialized entry and the total
    // output budget are bounded before decompression begins.
    files = unzipSync(bytes, { filter: createArchiveResourceFilter() });
  } catch (error) {
    if (error instanceof ProjectCompatibilityError) throw error;
    throw new ProjectCompatibilityError("The selected file is not a readable ZenID project archive.", "INVALID_ARCHIVE");
  }

  const paths = Object.keys(files);
  if (paths.some((path) => !isSafeArchivePath(path))) {
    throw new ProjectCompatibilityError("The project contains an unsafe archive path.", "UNSAFE_ARCHIVE_PATH");
  }

  if (!files["manifest.json"]) {
    throw new ProjectCompatibilityError("The project manifest is missing.", "MISSING_MANIFEST");
  }

  const manifest = parseJson(files["manifest.json"], "manifest.json");
  if (manifest.format !== "zenid-project") {
    throw new ProjectCompatibilityError("The archive is not a ZenID project.", "INVALID_MANIFEST");
  }
  if (!Array.isArray(manifest.resumes) || manifest.resumes.length === 0) {
    throw new ProjectCompatibilityError("The project manifest does not list any resumes.", "MISSING_RESUME");
  }

  const generatedPdfEntries = Array.isArray(manifest.generatedPdfs) ? manifest.generatedPdfs : [];
  if (
    generatedPdfEntries.some(
      (entry) =>
        !isSafeArchivePath(entry.path) ||
        !entry.path.startsWith("generated/") ||
        !entry.path.endsWith(".pdf") ||
        !files[entry.path] ||
        !hasPdfSignature(files[entry.path])
    )
  ) {
    throw new ProjectCompatibilityError("A generated resume PDF is missing or invalid.", "INVALID_GENERATED_PDF");
  }
  const assetEntries = Array.isArray(manifest.assets) ? manifest.assets : [];
  const seenAssetIds = new Set();
  const seenAssetPaths = new Set();
  if (
    assetEntries.some((entry) => {
      const valid =
        entry &&
        typeof entry.id === "string" &&
        entry.id.length > 0 &&
        !seenAssetIds.has(entry.id) &&
        !seenAssetPaths.has(entry.path) &&
        MEDIA_EXTENSIONS[entry.mimeType] &&
        isSafeArchivePath(entry.path) &&
        entry.path.startsWith("assets/") &&
        files[entry.path] &&
        files[entry.path].byteLength <= MAX_MEDIA_ASSET_BYTES &&
        hasMediaSignature(files[entry.path], entry.mimeType);
      if (entry?.id) seenAssetIds.add(entry.id);
      if (entry?.path) seenAssetPaths.add(entry.path);
      return !valid;
    })
  ) {
    throw new ProjectCompatibilityError("A project media asset is missing, duplicated, or invalid.", "INVALID_MEDIA_ASSET");
  }
  const requiredPaths = [
    manifest.profile,
    manifest.portfolio,
    ...manifest.resumes.map((entry) => entry.path),
    ...generatedPdfEntries.map((entry) => entry.path),
    ...assetEntries.map((entry) => entry.path),
  ];
  if (requiredPaths.some((path) => !isSafeArchivePath(path) || !files[path])) {
    throw new ProjectCompatibilityError("A file referenced by the project manifest is missing or unsafe.", "MISSING_PROJECT_FILE");
  }

  const allowedPaths = new Set(["manifest.json", ...requiredPaths]);
  const unknownPaths = paths.filter((path) => !allowedPaths.has(path) && !path.endsWith("/"));
  if (unknownPaths.length > 0) {
    throw new ProjectCompatibilityError(
      `This project contains unsupported files (${unknownPaths.slice(0, 3).join(", ")}).`,
      "UNSUPPORTED_ARCHIVE_CONTENT"
    );
  }

  const project = migrateProject({
    schemaVersion: manifest.schemaVersion,
    profile: parseJson(files[manifest.profile], manifest.profile),
    resumes: manifest.resumes.map((entry) => parseJson(files[entry.path], entry.path)),
    portfolio: parseJson(files[manifest.portfolio], manifest.portfolio),
  });
  const importedAssetIds = new Set(assetEntries.map((entry) => entry.id));
  const missingReferencedAsset = referencedMediaAssetIds(project).find((id) => !importedAssetIds.has(id));
  if (missingReferencedAsset) {
    throw new ProjectCompatibilityError(
      "The project references a media asset that is missing from the archive.",
      "MISSING_MEDIA_ASSET"
    );
  }

  return {
    project,
    assets: assetEntries.map((entry) => ({
      id: entry.id,
      kind: typeof entry.kind === "string" ? entry.kind : "portfolio-media",
      name: typeof entry.name === "string" ? entry.name : "image",
      mimeType: entry.mimeType,
      bytes: files[entry.path],
    })),
  };
}

export function parseProjectBundleBytes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.byteLength > MAX_PROJECT_FILE_BYTES) {
    throw new ProjectCompatibilityError("The ZenID project is too large to open safely.", "PROJECT_TOO_LARGE");
  }

  // The earliest portable prototype was plain JSON. Continue accepting it so
  // users are not stranded while the public format moves to ZIP-based .zenid.
  const firstNonWhitespace = strFromU8(bytes.subarray(0, Math.min(bytes.length, 256))).trimStart()[0];
  if (firstNonWhitespace === "{") {
    return { project: migrateProject(parseJson(bytes, "ZenID project")), assets: [] };
  }

  return parseArchiveBundle(bytes);
}

export function parseProjectFileBytes(input) {
  return parseProjectBundleBytes(input).project;
}

export async function readProjectFile(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new ProjectCompatibilityError("Choose a valid ZenID project file.", "INVALID_FILE");
  }
  if (file.size > MAX_PROJECT_FILE_BYTES) {
    throw new ProjectCompatibilityError("The ZenID project is too large to open safely.", "PROJECT_TOO_LARGE");
  }
  return parseProjectFileBytes(await file.arrayBuffer());
}

export async function readProjectBundleFile(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new ProjectCompatibilityError("Choose a valid ZenID project file.", "INVALID_FILE");
  }
  if (file.size > MAX_PROJECT_FILE_BYTES) {
    throw new ProjectCompatibilityError("The ZenID project is too large to open safely.", "PROJECT_TOO_LARGE");
  }
  return parseProjectBundleBytes(await file.arrayBuffer());
}

export function getProjectFileName(fullName) {
  const safeName = (fullName || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/^\.+|\.+$/g, "");
  return `${safeName || "My"}_ZenID_Project${PROJECT_FILE_EXTENSION}`;
}

export function downloadProjectFile(project, options = {}) {
  const bytes = serializeProjectArchive(project, options);
  const blob = new Blob([bytes], { type: PROJECT_FILE_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getProjectFileName(project.profile?.personalInfo?.fullName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
