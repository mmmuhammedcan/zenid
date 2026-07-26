import {
  LEGACY_RESUME_STORAGE_KEY,
  PROJECT_STORAGE_KEY,
  loadProjectFromBrowserStorage,
  migrateProject,
  normalizeProject,
} from "../resume/projectSchema.js";
import {
  archiveAssetToRecord,
  prepareImportedMediaAssets,
} from "../portfolio/assetStore.js";
import {
  ASSET_STORE_NAME,
  WORKSPACE_STORE_NAME,
  getZenidRecord,
  runZenidTransaction,
} from "./browserDatabase.js";

export const CURRENT_WORKSPACE_ID = "current";

function workspaceRecord(project) {
  return {
    id: CURRENT_WORKSPACE_ID,
    project: normalizeProject(project),
    updatedAt: new Date().toISOString(),
  };
}

function removeMigratedProjectKeys(storage) {
  if (!storage) return;
  try {
    storage.removeItem(PROJECT_STORAGE_KEY);
    storage.removeItem(LEGACY_RESUME_STORAGE_KEY);
  } catch (error) {
    console.warn("ZenID migrated the workspace but could not remove legacy browser keys.", error);
  }
}

export async function saveWorkspaceProject(project) {
  const record = workspaceRecord(project);
  await runZenidTransaction(WORKSPACE_STORE_NAME, "readwrite", (stores) => {
    stores[WORKSPACE_STORE_NAME].put(record);
  });
  return record.project;
}

export async function loadWorkspaceProject(storage = globalThis.localStorage) {
  const existing = await getZenidRecord(WORKSPACE_STORE_NAME, CURRENT_WORKSPACE_ID);
  if (existing?.project) {
    removeMigratedProjectKeys(storage);
    return migrateProject(existing.project);
  }

  const migrated = loadProjectFromBrowserStorage(storage);
  await saveWorkspaceProject(migrated);
  removeMigratedProjectKeys(storage);
  return migrated;
}

export async function commitProjectBundle(project, assets = []) {
  const normalized = normalizeProject(project);
  const newAssets = await prepareImportedMediaAssets(assets);
  await runZenidTransaction(
    [ASSET_STORE_NAME, WORKSPACE_STORE_NAME],
    "readwrite",
    (stores) => {
      newAssets.forEach((asset) => stores[ASSET_STORE_NAME].add(archiveAssetToRecord(asset)));
      stores[WORKSPACE_STORE_NAME].put(workspaceRecord(normalized));
    }
  );
  return normalized;
}

export async function commitProjectMediaChange(
  project,
  { addRecords = [], deleteIds = [] } = {}
) {
  const normalized = normalizeProject(project);
  const deleteSet = new Set(deleteIds.filter(Boolean));
  addRecords.forEach((record) => deleteSet.delete(record.id));
  await runZenidTransaction(
    [ASSET_STORE_NAME, WORKSPACE_STORE_NAME],
    "readwrite",
    (stores) => {
      addRecords.forEach((record) => stores[ASSET_STORE_NAME].add(record));
      deleteSet.forEach((id) => stores[ASSET_STORE_NAME].delete(id));
      stores[WORKSPACE_STORE_NAME].put(workspaceRecord(normalized));
    }
  );
  return normalized;
}
