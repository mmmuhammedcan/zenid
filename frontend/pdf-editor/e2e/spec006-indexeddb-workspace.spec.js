import { test, expect } from "@playwright/test";
import { createEmptyProject, PROJECT_STORAGE_KEY } from "../src/resume/projectSchema.js";

const DATABASE_NAME = "zenid-local-assets";

async function readRecord(page, storeName, id) {
  return page.evaluate(
    ({ databaseName, targetStore, recordId }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(targetStore, "readonly");
          const getRequest = transaction.objectStore(targetStore).get(recordId);
          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => resolve(getRequest.result || null);
          transaction.oncomplete = () => database.close();
        };
      }),
    { databaseName: DATABASE_NAME, targetStore: storeName, recordId: id }
  );
}

test("migrates ZenPDF signature data to IndexedDB and removes legacy keys", async ({ page }) => {
  const requests = [];
  page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));
  await page.addInitScript(() => {
    localStorage.setItem("pdfEditorSignature", "data:image/png;base64,synthetic-signature");
    localStorage.setItem("pdfEditorInitials", "data:image/png;base64,synthetic-initials");
  });

  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: /fill and sign application forms privately/i })).toBeVisible();

  await expect.poll(async () => (await readRecord(page, "private-data", "zenpdf-signature"))?.value)
    .toBe("data:image/png;base64,synthetic-signature");
  expect((await readRecord(page, "private-data", "zenpdf-initials"))?.value)
    .toBe("data:image/png;base64,synthetic-initials");
  expect(await page.evaluate(() => ({
    signature: localStorage.getItem("pdfEditorSignature"),
    initials: localStorage.getItem("pdfEditorInitials"),
  }))).toEqual({ signature: null, initials: null });
  for (const request of requests) {
    expect(request.method).toBe("GET");
    expect(new URL(request.url).origin).toBe("http://127.0.0.1:4173");
    expect(decodeURIComponent(request.url)).not.toContain("synthetic-signature");
  }
});

test("keeps legacy project data when its IndexedDB migration fails", async ({ page }) => {
  const legacyProject = createEmptyProject();
  legacyProject.profile.personalInfo.fullName = "Retryable Migration User";
  await page.addInitScript(
    ({ storageKey, project }) => {
      localStorage.setItem(storageKey, JSON.stringify(project));
      const originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function injectedFailure(value, ...args) {
        if (this.name === "workspace" && value?.project?.profile?.personalInfo?.fullName === "Retryable Migration User") {
          throw new DOMException("Injected migration failure", "QuotaExceededError");
        }
        return originalPut.call(this, value, ...args);
      };
    },
    { storageKey: PROJECT_STORAGE_KEY, project: legacyProject }
  );

  await page.goto("/resume");
  await expect(page.getByRole("alert")).toContainText("could not open its private local workspace");
  expect(await page.evaluate(
    (storageKey) => JSON.parse(localStorage.getItem(storageKey)).profile.personalInfo.fullName,
    PROJECT_STORAGE_KEY
  )).toBe("Retryable Migration User");
  expect(await readRecord(page, "workspace", "current")).toBeNull();
});

test("upgrades the existing media database without losing version-one assets", async ({ page }, testInfo) => {
  await page.route("**/seed-db", (route) => route.fulfill({
    contentType: "text/html",
    body: "<!doctype html><title>seed</title>",
  }));
  await page.goto("/seed-db");
  await page.evaluate(
    ({ databaseName, useByteRecord }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 1);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = () => {
          request.result.createObjectStore("assets", { keyPath: "id" });
        };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction("assets", "readwrite");
          const record = {
            id: "legacy-v1-image",
            kind: "profile-image",
            name: "legacy.png",
            mimeType: "image/png",
          };
          if (useByteRecord) record.bytes = new Uint8Array([137, 80, 78, 71]);
          else record.blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" });
          const addRequest = transaction.objectStore("assets").add(record);
          addRequest.onerror = () => reject(addRequest.error || new Error("Version-one asset seed failed."));
          transaction.onerror = () => reject(transaction.error);
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
        };
      }),
    { databaseName: DATABASE_NAME, useByteRecord: testInfo.project.name === "webkit-release" }
  );
  await page.unroute("**/seed-db");

  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: /choose a starting point/i })).toBeVisible();

  const asset = await readRecord(page, "assets", "legacy-v1-image");
  expect(asset.name).toBe("legacy.png");
  expect(await page.evaluate(
    ({ databaseName }) =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(databaseName, 2);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          resolve([...request.result.objectStoreNames]);
          request.result.close();
        };
      }),
    { databaseName: DATABASE_NAME }
  )).toEqual(["assets", "private-data", "workspace"]);
});

test("commits portfolio media references and bytes atomically", async ({ page }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: /choose a starting point/i })).toBeVisible();

  await page.evaluate(async () => {
    const { commitProjectMediaChange } = await import("/src/storage/workspaceStore.js");
    const { getZenidRecord } = await import("/src/storage/browserDatabase.js");
    const current = (await getZenidRecord("workspace", "current")).project;
    const next = structuredClone(current);
    next.portfolio.media.profileImageId = "atomic-image";
    await commitProjectMediaChange(next, {
      addRecords: [{
        id: "atomic-image",
        kind: "profile-image",
        name: "atomic.png",
        mimeType: "image/png",
        bytes: new Uint8Array([137, 80, 78, 71]),
      }],
    });
  });

  expect((await readRecord(page, "workspace", "current")).project.portfolio.media.profileImageId)
    .toBe("atomic-image");
  expect((await readRecord(page, "assets", "atomic-image")).name).toBe("atomic.png");

  const failure = await page.evaluate(async () => {
    const { commitProjectMediaChange } = await import("/src/storage/workspaceStore.js");
    const { getZenidRecord } = await import("/src/storage/browserDatabase.js");
    const current = (await getZenidRecord("workspace", "current")).project;
    const next = structuredClone(current);
    next.portfolio.media.profileImageId = "rolled-back-image";
    const originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function injectedFailure(value, ...args) {
      if (this.name === "workspace" && value?.project?.portfolio?.media?.profileImageId === "rolled-back-image") {
        throw new DOMException("Injected atomic media failure", "QuotaExceededError");
      }
      return originalPut.call(this, value, ...args);
    };
    try {
      await commitProjectMediaChange(next, {
        addRecords: [{
          id: "rolled-back-image",
          kind: "profile-image",
          name: "rollback.png",
          mimeType: "image/png",
          bytes: new Uint8Array([137, 80, 78, 71]),
        }],
        deleteIds: ["atomic-image"],
      });
      return null;
    } catch (error) {
      return error.name;
    } finally {
      IDBObjectStore.prototype.put = originalPut;
    }
  });

  expect(failure).toBe("QuotaExceededError");
  expect((await readRecord(page, "workspace", "current")).project.portfolio.media.profileImageId)
    .toBe("atomic-image");
  expect(await readRecord(page, "assets", "rolled-back-image")).toBeNull();
  expect((await readRecord(page, "assets", "atomic-image")).name).toBe("atomic.png");

  await page.evaluate(async () => {
    const { commitProjectMediaChange } = await import("/src/storage/workspaceStore.js");
    const { getZenidRecord } = await import("/src/storage/browserDatabase.js");
    const current = (await getZenidRecord("workspace", "current")).project;
    const next = structuredClone(current);
    next.portfolio.media.profileImageId = null;
    await commitProjectMediaChange(next, { deleteIds: ["atomic-image"] });
  });
  expect((await readRecord(page, "workspace", "current")).project.portfolio.media.profileImageId)
    .toBeNull();
  expect(await readRecord(page, "assets", "atomic-image")).toBeNull();
});

test("shares one hydrated project across Resume and Portfolio routes", async ({ page }) => {
  await page.goto("/resume");
  await page.getByRole("button", { name: /minimal/i }).click();
  await page.getByRole("button", { name: /^continue$/i }).click();
  await page.getByLabel("Full name").fill("Shared Route User");

  await page.getByRole("link", { name: /zenid home/i }).click();
  await page.getByRole("link", { name: /build portfolio/i }).click();
  await expect(page.getByLabel("Full name")).toHaveValue("Shared Route User");

  await expect.poll(async () => (
    await readRecord(page, "workspace", "current")
  )?.project?.profile?.personalInfo?.fullName).toBe("Shared Route User");
});

test("allows only one writable ZenID tab and transfers ownership after close", async ({ context, page }) => {
  await page.goto("/resume");
  await expect(page.getByRole("heading", { name: /choose a starting point/i })).toBeVisible();

  const waitingPage = await context.newPage();
  await waitingPage.goto("/portfolio");
  const waitingAlert = waitingPage.getByRole("alert");
  await expect(waitingAlert).toContainText("already open in another tab");
  await expect(waitingPage.getByRole("heading", { name: /portfolio builder/i })).toHaveCount(0);

  await page.close();
  await expect(waitingPage.getByRole("heading", { name: /portfolio builder/i })).toBeVisible();
  await expect(waitingAlert).toHaveCount(0);
});

test("fails closed when the browser cannot provide workspace locks", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, "locks", {
      configurable: true,
      get: () => undefined,
    });
  });

  await page.goto("/resume");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("cannot safely lock the private ZenID workspace");
  await expect(alert).toContainText("Update to a current browser");
  await expect(page.getByRole("heading", { name: /choose a starting point/i })).toHaveCount(0);
});
