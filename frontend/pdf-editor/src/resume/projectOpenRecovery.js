const UPDATE_REQUIRED = new Set(["NEWER_PROJECT"]);
const UNSUPPORTED_VERSION = new Set(["UNSUPPORTED_PROJECT"]);
const INCOMPLETE_OR_CORRUPT = new Set([
  "INVALID_FILE",
  "INVALID_PROJECT",
  "INVALID_ARCHIVE",
  "INVALID_PROJECT_JSON",
  "MISSING_MANIFEST",
  "INVALID_MANIFEST",
  "MISSING_RESUME",
  "INVALID_RESUME",
  "INVALID_PROFILE",
  "MISSING_PROJECT_FILE",
  "MISSING_MEDIA_ASSET",
  "INVALID_MEDIA_ASSET",
  "INVALID_GENERATED_PDF",
  "INVALID_CONTENT_OVERRIDE",
  "INVALID_LEGACY_DRAFT",
  "INCOMPATIBLE_PROJECT",
]);
const SAFETY_LIMIT = new Set([
  "PROJECT_TOO_LARGE",
  "PROJECT_EXPANDED_SIZE_LIMIT",
  "ARCHIVE_ENTRY_COUNT_LIMIT",
  "ARCHIVE_ENTRY_SIZE_LIMIT",
  "UNSAFE_ARCHIVE_PATH",
  "DUPLICATE_ARCHIVE_ENTRY",
  "UNSUPPORTED_ARCHIVE_CONTENT",
]);

const ASSURANCE = "Your current workspace was not changed. Nothing was uploaded.";

export const BROWSER_AUTOSAVE_UNAVAILABLE =
  "Browser autosave is unavailable — save a ZenID Project backup to keep your work.";
export const PROJECT_SAVE_FAILED = "The ZenID Project could not be saved.";
export const PORTFOLIO_EXPORT_FAILED = "The public portfolio ZIP could not be created.";
export const MEDIA_SAVE_FAILED = "This file could not be saved locally.";

export function userFacingError(message) {
  const error = new Error(message);
  error.userFacing = true;
  return error;
}

export function noticeTextForError(error, fallback) {
  return error?.userFacing && typeof error.message === "string" ? error.message : fallback;
}

export function classifyProjectOpenError(error) {
  const code = typeof error?.code === "string" ? error.code : undefined;

  if (UPDATE_REQUIRED.has(code)) {
    return {
      category: "update-required",
      code,
      title: "This project needs a newer ZenID",
      message: "This ZenID version cannot safely open the project.",
      guidance: "Use the latest ZenID version, then choose this local project again.",
      assurance: ASSURANCE,
    };
  }
  if (UNSUPPORTED_VERSION.has(code)) {
    return {
      category: "unsupported-version",
      code,
      title: "This project version is not supported",
      message: "ZenID cannot safely migrate this project version.",
      guidance: "Open and re-save it with a compatible ZenID version, or choose another backup.",
      assurance: ASSURANCE,
    };
  }
  if (INCOMPLETE_OR_CORRUPT.has(code)) {
    return {
      category: "incomplete-or-corrupt",
      code,
      title: "This project is damaged or incomplete",
      message: "ZenID could not validate every part of this project.",
      guidance: "Choose another backup, or re-export it from the device where the project still opens.",
      assurance: ASSURANCE,
    };
  }
  if (SAFETY_LIMIT.has(code)) {
    return {
      category: "safety-limit",
      code,
      title: "This project was blocked for safety",
      message: "The project exceeds a safety limit or contains an unsafe archive structure.",
      guidance: "Use a fresh trusted export. If it is too large, reduce its media on the original device and export again.",
      assurance: ASSURANCE,
    };
  }
  return {
    category: "local-browser",
    ...(code === "PROJECT_WORKER_FAILED" ? { code } : {}),
    title: "This project could not be opened locally",
    message: "The browser could not finish local project processing or storage.",
    guidance: "Check browser storage availability and free space, then choose the local project again.",
    assurance: ASSURANCE,
  };
}
