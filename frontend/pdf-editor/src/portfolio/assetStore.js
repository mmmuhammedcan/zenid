import { createStableId } from "../resume/ids.js";
import { ProjectCompatibilityError } from "../resume/projectSchema.js";
import { userFacingError } from "../resume/projectOpenRecovery.js";
import {
  ASSET_STORE_NAME,
  getZenidRecord,
} from "../storage/browserDatabase.js";

export const MAX_MEDIA_FILE_BYTES = 8 * 1024 * 1024;
export const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

async function validateMedia(file) {
  if (!file || !SUPPORTED_MEDIA_TYPES.has(file.type)) {
    throw userFacingError("Choose a JPEG, PNG, WebP, or PDF file.");
  }
  if (file.size > MAX_MEDIA_FILE_BYTES) {
    throw userFacingError("Local portfolio files must be 8 MB or smaller.");
  }
  if (file.type === "application/pdf" && await file.slice(0, 5).text() !== "%PDF-") {
    throw userFacingError("The selected résumé is not a valid PDF.");
  }
}

export async function createMediaRecord(file, kind) {
  await validateMedia(file);
  return {
    id: createStableId(),
    kind,
    name: file.name || "image",
    mimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
    updatedAt: new Date().toISOString(),
  };
}

async function storedRecordBytes(record) {
  if (record?.bytes instanceof Uint8Array) return record.bytes;
  if (record?.bytes instanceof ArrayBuffer) return new Uint8Array(record.bytes);
  if (record?.blob?.arrayBuffer) return new Uint8Array(await record.blob.arrayBuffer());
  return null;
}

async function requireStoredRecordBytes(record) {
  const bytes = await storedRecordBytes(record);
  if (!bytes) {
    throw userFacingError("A local portfolio file is damaged or unreadable. Replace it before continuing.");
  }
  return bytes;
}

export async function mediaRecordMatchesArchiveAsset(record, asset) {
  if (!record || !asset) return false;
  const kind = asset.kind || "portfolio-media";
  const name = asset.name || "image";
  const storedBytes = await storedRecordBytes(record);
  if (
    record.id !== asset.id ||
    record.kind !== kind ||
    record.name !== name ||
    record.mimeType !== asset.mimeType ||
    storedBytes?.byteLength !== asset.bytes.byteLength
  ) {
    return false;
  }

  return storedBytes.every((byte, index) => byte === asset.bytes[index]);
}

export function archiveAssetToRecord(asset) {
  return {
    id: asset.id,
    kind: asset.kind || "portfolio-media",
    name: asset.name || "image",
    mimeType: asset.mimeType,
    bytes: new Uint8Array(asset.bytes),
    updatedAt: new Date().toISOString(),
  };
}

export async function prepareImportedMediaAssets(assets = []) {
  if (!assets.length) return [];
  assets.forEach((asset) => {
    if (!asset?.id || !SUPPORTED_MEDIA_TYPES.has(asset.mimeType) || asset.bytes.byteLength > MAX_MEDIA_FILE_BYTES) {
      throw new Error("A project media asset is invalid or unsupported.");
    }
  });

  const existingRecords = await getMediaAssets(assets.map((asset) => asset.id));
  const existingById = new Map(existingRecords.map((record) => [record.id, record]));
  for (const asset of assets) {
    const existing = existingById.get(asset.id);
    if (existing && !await mediaRecordMatchesArchiveAsset(existing, asset)) {
      throw new ProjectCompatibilityError(
        "A project media identifier conflicts with media already stored in this browser.",
        "MEDIA_ID_CONFLICT"
      );
    }
  }

  return assets.filter((asset) => !existingById.has(asset.id));
}

export async function getMediaAssets(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return [];
  const records = await Promise.all(uniqueIds.map((id) => getZenidRecord(ASSET_STORE_NAME, id)));
  return Promise.all(records.filter(Boolean).map(async (record) => {
    if (record.blob?.arrayBuffer) return record;
    const bytes = await requireStoredRecordBytes(record);
    return {
      ...record,
      blob: new Blob([bytes], { type: record.mimeType }),
    };
  }));
}

export function referencedAssetIds(project) {
  const media = project?.portfolio?.media || {};
  return [
    media.profileImageId,
    project?.portfolio?.resume?.uploadedAssetId,
    ...Object.values(media.projectImageIds || {}),
    ...Object.values(media.projectGalleryIds || {}).flatMap((ids) => (Array.isArray(ids) ? ids : [])),
    ...Object.values(media.certificateImageIds || {}),
  ].filter(Boolean);
}

export async function getProjectMediaAssets(project) {
  const ids = [...new Set(referencedAssetIds(project))];
  const records = await getMediaAssets(ids);
  if (records.length !== ids.length) {
    throw userFacingError("One or more portfolio files are missing from this browser. Replace or remove them before saving the project.");
  }
  return records;
}

export async function mediaRecordsToArchiveAssets(records) {
  return Promise.all(
    records.map(async (record) => {
      const bytes = await requireStoredRecordBytes(record);
      return {
        id: record.id,
        kind: record.kind,
        name: record.name,
        mimeType: record.mimeType,
        bytes: new Uint8Array(bytes),
      };
    })
  );
}
