import { test, expect } from "@playwright/test";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  createEmptyProject,
  CURRENT_SCHEMA_VERSION,
  PROJECT_STORAGE_KEY,
} from "../src/resume/projectSchema.js";
import { serializeProjectArchive } from "../src/resume/projectFile.js";

const PNG_FIXTURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function projectFile(project, assets = []) {
  return {
    name: "Synthetic_ZenID_Project.zenid",
    mimeType: "application/vnd.zenid.project+zip",
    buffer: Buffer.from(serializeProjectArchive(project, { assets })),
  };
}

function futureSchemaProjectFile(project, assets = []) {
  const files = unzipSync(serializeProjectArchive(project, { assets }));
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.schemaVersion = CURRENT_SCHEMA_VERSION + 1;
  files["manifest.json"] = strToU8(`${JSON.stringify(manifest, null, 2)}\n`);

  return {
    name: "Synthetic_Future_ZenID_Project.zenid",
    mimeType: "application/vnd.zenid.project+zip",
    buffer: Buffer.from(zipSync(files)),
  };
}

async function chooseProject(page, file) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /open zenid project/i }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(file);
}

function observeImportRequests(page) {
  const requests = [];
  page.on("request", (request) => {
    requests.push({
      method: request.method(),
      url: request.url(),
    });
  });
  return requests;
}

function expectNoProjectUpload(requests, sensitiveMarkers = []) {
  for (const request of requests) {
    expect(request.method).toBe("GET");
    const url = new URL(request.url);
    expect(url.origin).toBe("http://127.0.0.1:4173");
    for (const marker of sensitiveMarkers) {
      expect(decodeURIComponent(url.href)).not.toContain(marker);
    }
  }
}

async function readAsset(page, id) {
  return page.evaluate(
    ({ databaseName, assetId }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("assets")) {
            request.result.createObjectStore("assets", { keyPath: "id" });
          }
          if (!request.result.objectStoreNames.contains("workspace")) {
            request.result.createObjectStore("workspace", { keyPath: "id" });
          }
          if (!request.result.objectStoreNames.contains("private-data")) {
            request.result.createObjectStore("private-data", { keyPath: "id" });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          try {
            const transaction = database.transaction("assets", "readonly");
            const getRequest = transaction.objectStore("assets").get(assetId);
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = async () => {
              const record = getRequest.result;
              if (!record) {
                resolve(null);
                return;
              }
              resolve({
                ...record,
                bytes: [...new Uint8Array(await record.blob.arrayBuffer())],
              });
            };
            transaction.oncomplete = () => database.close();
          } catch (error) {
            database.close();
            reject(error);
          }
        };
      }),
    { databaseName: "zenid-local-assets", assetId: id }
  );
}

async function seedAsset(page, asset) {
  await page.evaluate(
    ({ databaseName, record }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("assets")) {
            request.result.createObjectStore("assets", { keyPath: "id" });
          }
          if (!request.result.objectStoreNames.contains("workspace")) {
            request.result.createObjectStore("workspace", { keyPath: "id" });
          }
          if (!request.result.objectStoreNames.contains("private-data")) {
            request.result.createObjectStore("private-data", { keyPath: "id" });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          try {
            const transaction = database.transaction("assets", "readwrite");
            transaction.objectStore("assets").put({
              ...record,
              blob: new Blob([new Uint8Array(record.bytes)], { type: record.mimeType }),
            });
            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => {
              database.close();
              resolve();
            };
          } catch (error) {
            database.close();
            reject(error);
          }
        };
      }),
    { databaseName: "zenid-local-assets", record: asset }
  );
}

async function readWorkspaceProject(page) {
  return page.evaluate(
    ({ databaseName }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("workspace", "readonly");
          const getRequest = transaction.objectStore("workspace").get("current");
          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => resolve(getRequest.result?.project || null);
          transaction.oncomplete = () => database.close();
        };
      }),
    { databaseName: "zenid-local-assets" }
  );
}

test("opens a valid project locally without transmitting project data", async ({ page }) => {
  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Synthetic Incoming User";
  incoming.resumes[0].template = "minimal";

  await page.goto("/resume");
  await page.waitForLoadState("networkidle");
  const requestsAfterSelection = observeImportRequests(page);

  await chooseProject(page, projectFile(incoming));

  await expect(page.getByRole("status")).toContainText("Project opened locally");
  await expect(page.getByLabel("Full name")).toHaveValue("Synthetic Incoming User");
  expectNoProjectUpload(requestsAfterSelection, ["Synthetic Incoming User"]);
});

test("reuses byte-identical media when reopening a project with stable identifiers", async ({ page }) => {
  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Reopened Local User";
  incoming.resumes[0].template = "minimal";
  incoming.portfolio.media.profileImageId = "stable-profile";
  const stableProfile = {
    id: "stable-profile",
    kind: "profile-image",
    name: "profile.png",
    mimeType: "image/png",
    bytes: [...PNG_FIXTURE],
  };

  await page.goto("/resume");
  await seedAsset(page, stableProfile);
  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, projectFile(incoming, [{
    ...stableProfile,
    bytes: new Uint8Array(stableProfile.bytes),
  }]));

  await expect(page.getByRole("status")).toContainText("Project opened locally");
  await expect(page.getByLabel("Full name")).toHaveValue("Reopened Local User");
  const stored = await readAsset(page, "stable-profile");
  expect(stored.name).toBe("profile.png");
  expect(stored.bytes).toEqual(stableProfile.bytes);
});

test("guides recovery from a corrupt project and can open another local backup", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Local User";
  current.resumes[0].template = "minimal";
  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );
  await page.goto("/resume");

  const requests = observeImportRequests(page);
  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, {
    name: "Corrupt_Project.zenid",
    mimeType: "application/vnd.zenid.project+zip",
    buffer: Buffer.from("not a ZenID archive"),
  });

  const alert = page.getByRole("alert");
  await expect(alert).toBeFocused();
  await expect(alert).toContainText("damaged or incomplete");
  await expect(alert).toContainText("Your current workspace was not changed. Nothing was uploaded.");
  await expect(alert).toHaveAccessibleDescription(/Your current workspace was not changed\. Nothing was uploaded\./);
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
  expectNoProjectUpload(requests, ["Current Local User"]);

  const replacement = createEmptyProject();
  replacement.profile.personalInfo.fullName = "Recovered From Backup";
  replacement.resumes[0].template = "minimal";
  const chooserPromise = page.waitForEvent("filechooser");
  await alert.getByRole("button", { name: /open another project/i }).click();
  const chooser = await chooserPromise;
  page.once("dialog", (dialog) => dialog.accept());
  await chooser.setFiles(projectFile(replacement));

  await expect(page.getByRole("status")).toContainText("Project opened locally");
  await expect(page.getByLabel("Full name")).toHaveValue("Recovered From Backup");
});

test("rejects a newer project with update guidance and keeps the current workspace", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Local User";
  current.resumes[0].template = "minimal";
  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );

  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Future Schema User";
  incoming.resumes[0].template = "minimal";
  incoming.portfolio.media.profileImageId = "future-profile";
  const futureProfile = {
    id: "future-profile",
    kind: "profile-image",
    name: "future-profile.png",
    mimeType: "image/png",
    bytes: PNG_FIXTURE,
  };

  await page.goto("/resume");
  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, futureSchemaProjectFile(incoming, [futureProfile]));

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("needs a newer ZenID");
  await expect(alert).toContainText("Your current workspace was not changed. Nothing was uploaded.");
  await expect(alert.getByRole("button", { name: /open another project/i })).toBeVisible();
  await expect(alert.getByRole("button", { name: /continue with current workspace/i })).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
  expect(await readAsset(page, "future-profile")).toBeNull();
  await alert.getByRole("button", { name: /continue with current workspace/i }).click();
  await expect(page.getByRole("button", { name: /open zenid project/i })).toBeFocused();
});

test("rolls back media and keeps the current project when IndexedDB persistence fails", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Local User";
  current.resumes[0].template = "minimal";
  current.portfolio.media.profileImageId = "current-profile";

  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );
  await page.addInitScript(() => {
    const originalAdd = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function injectedFailure(...args) {
      if (args[0]?.id === "incoming-project") {
        throw new DOMException("Injected media write failure", "QuotaExceededError");
      }
      return originalAdd.apply(this, args);
    };
  });

  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Incoming User";
  incoming.resumes[0].template = "minimal";
  incoming.portfolio.media.profileImageId = "incoming-profile";
  incoming.portfolio.media.projectImageIds[incoming.profile.projects[0].id] = "incoming-project";
  const assets = [
    {
      id: "incoming-profile",
      kind: "profile-image",
      name: "profile.png",
      mimeType: "image/png",
      bytes: PNG_FIXTURE,
    },
    {
      id: "incoming-project",
      kind: "project-image",
      name: "project.png",
      mimeType: "image/png",
      bytes: PNG_FIXTURE,
    },
  ];

  await page.goto("/resume");
  await seedAsset(page, {
    id: "current-profile",
    kind: "profile-image",
    name: "current.png",
    mimeType: "image/png",
    bytes: [...PNG_FIXTURE],
  });
  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, projectFile(incoming, assets));

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("could not be opened locally");
  await expect(alert).toContainText("Check browser storage availability and free space");
  await expect(alert).not.toContainText("Injected media write failure");
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
  expect((await readAsset(page, "current-profile"))?.name).toBe("current.png");
  expect(await readAsset(page, "incoming-profile")).toBeNull();
});

test("shows the shared recovery panel in Portfolio when referenced media is missing", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Portfolio User";
  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );

  const incomplete = createEmptyProject();
  incomplete.profile.personalInfo.fullName = "Incomplete Incoming User";
  incomplete.portfolio.media.profileImageId = "missing-profile";

  await page.goto("/portfolio");
  page.once("dialog", (dialog) => dialog.accept());
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /open project/i }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(projectFile(incomplete));

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("damaged or incomplete");
  await expect(alert).toContainText("Your current workspace was not changed. Nothing was uploaded.");
  await expect(alert.getByRole("button", { name: /open another project/i })).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveValue("Current Portfolio User");
  expect((await readWorkspaceProject(page)).profile.personalInfo.fullName).toBe("Current Portfolio User");
  expect(await page.evaluate((storageKey) => localStorage.getItem(storageKey), PROJECT_STORAGE_KEY)).toBeNull();

  const valid = createEmptyProject();
  valid.profile.personalInfo.fullName = "Valid Portfolio Backup";
  const replacementChooserPromise = page.waitForEvent("filechooser");
  await alert.getByRole("button", { name: /open another project/i }).click();
  const replacementChooser = await replacementChooserPromise;
  page.once("dialog", (dialog) => dialog.accept());
  await replacementChooser.setFiles(projectFile(valid));

  await expect(page.getByRole("status")).toContainText("ZenID Project opened locally");
  await expect(page.getByLabel("Full name")).toHaveValue("Valid Portfolio Backup");
});

test("reports a blocked browser store instead of a false success", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Local User";
  current.resumes[0].template = "minimal";
  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );
  await page.addInitScript(() => {
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function injectedFailure(value, ...args) {
      if (this.name === "workspace" && value?.project?.profile?.personalInfo?.fullName === "Storage Blocked Incoming") {
        throw new DOMException("Injected IndexedDB quota failure", "QuotaExceededError");
      }
      return originalPut.call(this, value, ...args);
    };
  });

  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Storage Blocked Incoming";
  incoming.resumes[0].template = "minimal";

  await page.goto("/resume");
  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, projectFile(incoming));

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("could not be opened locally");
  await expect(alert).toContainText("Your current workspace was not changed. Nothing was uploaded.");
  await expect(alert).not.toContainText("Injected IndexedDB quota failure");
  await expect(page.getByText("Project opened locally")).toHaveCount(0);
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
  expect((await readWorkspaceProject(page)).profile.personalInfo.fullName).toBe("Current Local User");
});

test("a rejected import cannot overwrite current media through an identifier collision", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Local User";
  current.resumes[0].template = "minimal";
  current.portfolio.media.profileImageId = "shared-profile";
  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );
  const currentBytes = [...PNG_FIXTURE, 1];
  const incomingBytes = new Uint8Array([...PNG_FIXTURE, 2]);
  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Conflicting Incoming User";
  incoming.resumes[0].template = "minimal";
  incoming.portfolio.media.profileImageId = "shared-profile";

  await page.goto("/resume");
  await seedAsset(page, {
    id: "shared-profile",
    kind: "profile-image",
    name: "current.png",
    mimeType: "image/png",
    bytes: currentBytes,
  });
  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, projectFile(incoming, [{
    id: "shared-profile",
    kind: "profile-image",
    name: "incoming.png",
    mimeType: "image/png",
    bytes: incomingBytes,
  }]));

  const alert = page.getByRole("alert");
  const stored = await readAsset(page, "shared-profile");
  expect(stored.name).toBe("current.png");
  expect(stored.bytes).toEqual(currentBytes);
  await expect(alert).toContainText("damaged or incomplete");
  await expect(alert).toContainText("Your current workspace was not changed. Nothing was uploaded.");
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
});

test("clears an abandoned recovery panel when the user navigates the resume surfaces", async ({ page }) => {
  const current = createEmptyProject();
  current.profile.personalInfo.fullName = "Current Local User";
  current.resumes[0].template = "minimal";
  await page.addInitScript(
    ({ storageKey, project }) => localStorage.setItem(storageKey, JSON.stringify(project)),
    { storageKey: PROJECT_STORAGE_KEY, project: current }
  );
  await page.goto("/resume");

  page.once("dialog", (dialog) => dialog.accept());
  await chooseProject(page, {
    name: "Corrupt_Project.zenid",
    mimeType: "application/vnd.zenid.project+zip",
    buffer: Buffer.from("not a ZenID archive"),
  });

  const alert = page.getByRole("alert");
  await expect(alert).toBeFocused();

  await page.getByRole("button", { name: /^templates$/i }).click();
  await expect(page.getByRole("heading", { name: /choose a starting point/i })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.getByRole("button", { name: /minimal/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("warns about an unavailable browser store without stealing focus", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: /choose a starting point/i })).toBeVisible();
  await page.evaluate(() => {
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function injectedFailure(value, ...args) {
      if (this.name === "workspace") {
        throw new DOMException("Injected autosave failure", "QuotaExceededError");
      }
      return originalPut.call(this, value, ...args);
    };
  });
  await page.getByRole("button", { name: /minimal/i }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText("Browser autosave is unavailable");
  await expect(alert).not.toContainText("Injected autosave failure");
  await expect(alert).not.toBeFocused();
  await expect(alert.getByRole("button", { name: /open another project/i })).toHaveCount(0);

  await alert.getByRole("button", { name: /^dismiss$/i }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
