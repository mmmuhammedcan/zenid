export const ZENID_DATABASE_NAME = "zenid-local-assets";
export const ZENID_DATABASE_VERSION = 2;
export const ASSET_STORE_NAME = "assets";
export const WORKSPACE_STORE_NAME = "workspace";
export const PRIVATE_DATA_STORE_NAME = "private-data";

export function openZenidDatabase() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not provide local workspace storage."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(ZENID_DATABASE_NAME, ZENID_DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error("ZenID could not open local workspace storage."));
    request.onblocked = () => reject(new Error("Another ZenID tab is blocking a local storage upgrade."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(ASSET_STORE_NAME)) {
        database.createObjectStore(ASSET_STORE_NAME, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(WORKSPACE_STORE_NAME)) {
        database.createObjectStore(WORKSPACE_STORE_NAME, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(PRIVATE_DATA_STORE_NAME)) {
        database.createObjectStore(PRIVATE_DATA_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

export async function runZenidTransaction(storeNames, mode, operation) {
  const names = Array.isArray(storeNames) ? storeNames : [storeNames];
  const database = await openZenidDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(names, mode);
      const stores = Object.fromEntries(names.map((name) => [name, transaction.objectStore(name)]));
      let result;
      let settled = false;
      const fail = (error) => {
        if (settled) return;
        settled = true;
        reject(error || new Error("Local workspace storage failed."));
      };
      transaction.onerror = () => fail(transaction.error);
      transaction.onabort = () => fail(transaction.error || new Error("Local workspace storage was interrupted."));
      transaction.oncomplete = () => {
        if (settled) return;
        settled = true;
        resolve(result);
      };
      try {
        result = operation(stores, transaction);
      } catch (error) {
        try {
          transaction.abort();
        } catch {
          // The original operation error is more useful than a late abort error.
        }
        fail(error);
      }
    });
  } finally {
    database.close();
  }
}

export async function getZenidRecord(storeName, id) {
  const database = await openZenidDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get(id);
      request.onerror = () => reject(request.error || new Error("Local workspace data could not be read."));
      request.onsuccess = () => resolve(request.result || null);
    });
  } finally {
    database.close();
  }
}

