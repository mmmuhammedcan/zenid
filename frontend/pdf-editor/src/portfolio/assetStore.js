import { createStableId } from "../resume/ids.js";
import { userFacingError } from "../resume/projectOpenRecovery.js";

const DATABASE_NAME = "zenid-local-assets";
const DATABASE_VERSION = 1;
const STORE_NAME = "assets";
export const MAX_MEDIA_FILE_BYTES = 8 * 1024 * 1024;
export const SUPPORTED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function openDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not provide local media storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error("ZenID could not open local media storage."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

async function runTransaction(mode, operation) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let result;
      transaction.onerror = () => reject(transaction.error || new Error("Local media storage failed."));
      transaction.onabort = () => reject(transaction.error || new Error("Local media storage was interrupted."));
      transaction.oncomplete = () => resolve(result);
      try {
        result = operation(store);
      } catch (error) {
        transaction.abort();
        reject(error);
      }
    });
  } finally {
    database.close();
  }
}

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

export async function saveMediaFile(file, kind) {
  await validateMedia(file);
  const record = {
    id: createStableId(),
    kind,
    name: file.name || "image",
    mimeType: file.type,
    blob: file,
    updatedAt: new Date().toISOString(),
  };
  await runTransaction("readwrite", (store) => store.put(record));
  return record;
}

export async function importMediaAssets(assets = []) {
  if (!assets.length) return;
  assets.forEach((asset) => {
    if (!asset?.id || !SUPPORTED_MEDIA_TYPES.has(asset.mimeType) || asset.bytes.byteLength > MAX_MEDIA_FILE_BYTES) {
      throw new Error("A project media asset is invalid or unsupported.");
    }
  });
  await runTransaction("readwrite", (store) => {
    assets.forEach((asset) => {
      store.put({
        id: asset.id,
        kind: asset.kind || "portfolio-media",
        name: asset.name || "image",
        mimeType: asset.mimeType,
        blob: new Blob([asset.bytes], { type: asset.mimeType }),
        updatedAt: new Date().toISOString(),
      });
    });
  });
}

export async function deleteMediaAsset(id) {
  if (!id) return;
  await runTransaction("readwrite", (store) => store.delete(id));
}

export async function getMediaAssets(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return [];
  const database = await openDatabase();
  try {
    return await Promise.all(
      uniqueIds.map(
        (id) =>
          new Promise((resolve, reject) => {
            const transaction = database.transaction(STORE_NAME, "readonly");
            const request = transaction.objectStore(STORE_NAME).get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error("A local media asset could not be read."));
          })
      )
    ).then((records) => records.filter(Boolean));
  } finally {
    database.close();
  }
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
    records.map(async (record) => ({
      id: record.id,
      kind: record.kind,
      name: record.name,
      mimeType: record.mimeType,
      bytes: new Uint8Array(await record.blob.arrayBuffer()),
    }))
  );
}
