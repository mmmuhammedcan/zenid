import { test, expect } from "@playwright/test";
import { createEmptyProject, PROJECT_STORAGE_KEY } from "../src/resume/projectSchema.js";
import { serializeProjectArchive } from "../src/resume/projectFile.js";

const PNG_FIXTURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

function projectFile(project, assets = []) {
  return {
    name: "Synthetic_ZenID_Project.zenid",
    mimeType: "application/vnd.zenid.project+zip",
    buffer: Buffer.from(serializeProjectArchive(project, { assets })),
  };
}

async function chooseProject(page, file) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /open zenid project/i }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(file);
}

async function readAsset(page, id) {
  return page.evaluate(
    ({ databaseName, assetId }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("assets")) {
            request.result.createObjectStore("assets", { keyPath: "id" });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          try {
            const transaction = database.transaction("assets", "readonly");
            const getRequest = transaction.objectStore("assets").get(assetId);
            getRequest.onerror = () => reject(getRequest.error);
            getRequest.onsuccess = () => resolve(getRequest.result || null);
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
        const request = indexedDB.open(databaseName, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains("assets")) {
            request.result.createObjectStore("assets", { keyPath: "id" });
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

test("opens a valid project locally without transmitting project data", async ({ page }) => {
  const incoming = createEmptyProject();
  incoming.profile.personalInfo.fullName = "Synthetic Incoming User";
  incoming.resumes[0].template = "minimal";

  await page.goto("/resume");
  const requestBodiesAfterSelection = [];
  page.on("request", (request) => {
    const body = request.postDataBuffer();
    if (body?.byteLength) requestBodiesAfterSelection.push(body.toString("utf8"));
  });

  await chooseProject(page, projectFile(incoming));

  await expect(page.getByRole("status")).toContainText("Project opened locally");
  await expect(page.getByLabel("Full name")).toHaveValue("Synthetic Incoming User");
  expect(requestBodiesAfterSelection).toEqual([]);
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
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function injectedFailure(...args) {
      if (args[0]?.id === "incoming-project") {
        throw new DOMException("Injected media write failure", "QuotaExceededError");
      }
      return originalPut.apply(this, args);
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

  await expect(page.getByRole("alert")).toContainText("Injected media write failure");
  await expect(page.getByLabel("Full name")).toHaveValue("Current Local User");
  expect((await readAsset(page, "current-profile"))?.name).toBe("current.png");
  expect(await readAsset(page, "incoming-profile")).toBeNull();
});
