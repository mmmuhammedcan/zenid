import {
  PRIVATE_DATA_STORE_NAME,
  getZenidRecord,
  runZenidTransaction,
} from "./browserDatabase.js";

export const ZENPDF_SIGNATURE_ID = "zenpdf-signature";
export const ZENPDF_INITIALS_ID = "zenpdf-initials";
export const LEGACY_SIGNATURE_KEY = "pdfEditorSignature";
export const LEGACY_INITIALS_KEY = "pdfEditorInitials";

export async function savePrivateData(id, value) {
  await runZenidTransaction(PRIVATE_DATA_STORE_NAME, "readwrite", (stores) => {
    stores[PRIVATE_DATA_STORE_NAME].put({
      id,
      value,
      updatedAt: new Date().toISOString(),
    });
  });
  return value;
}

function removeLegacyPrivateData(storage, legacyKey) {
  try {
    storage?.removeItem(legacyKey);
  } catch (error) {
    console.warn("ZenID migrated private data but could not remove its legacy browser key.", error);
  }
}

export async function loadPrivateData(id, legacyKey, storage = globalThis.localStorage) {
  const existing = await getZenidRecord(PRIVATE_DATA_STORE_NAME, id);
  if (typeof existing?.value === "string" && existing.value) {
    removeLegacyPrivateData(storage, legacyKey);
    return existing.value;
  }

  let legacyValue = null;
  try {
    legacyValue = storage?.getItem(legacyKey) || null;
  } catch (error) {
    console.warn("ZenID could not read legacy private browser data.", error);
  }
  if (!legacyValue) return null;

  await savePrivateData(id, legacyValue);
  removeLegacyPrivateData(storage, legacyKey);
  return legacyValue;
}
