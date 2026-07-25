import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  createEmptyProject,
  PROJECT_STORAGE_KEY,
} from "../src/resume/projectSchema.js";

async function extractPdfText(bytes) {
  const document = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  await document.destroy();
  return pages.join("\n");
}

test("keeps resume item selections isolated and restores them from a ZenID project", async ({ page }) => {
  const project = createEmptyProject();
  project.resumes[0].template = "minimal";
  project.resumes[0].pendingTemplate = "minimal";
  project.resumes[0].name = "General Resume";
  project.profile.personalInfo.fullName = "Synthetic Variant User";
  project.profile.experience = [
    {
      id: "backend",
      company: "ZenID",
      role: "Backend Engineer",
      description: "Shared backend description",
    },
    {
      id: "retail",
      company: "Store",
      role: "Retail Associate",
      description: "Shared retail description",
    },
  ];
  project.profile.projects = [
    { id: "api", name: "API Project", description: "Shared API description" },
    { id: "landing", name: "Landing Page", description: "Shared landing description" },
  ];

  await page.addInitScript(
    ({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)),
    { storageKey: PROJECT_STORAGE_KEY, value: project }
  );
  await page.goto("/resume");

  await page.getByRole("button", { name: /add resume variant/i }).click();
  await page.getByLabel("Resume version name").fill("Backend Resume");
  await page.getByLabel("Include Retail Associate — Store in this resume").uncheck();
  await page.getByLabel("Include Landing Page in this resume").uncheck();
  await page.getByRole("button", { name: "Targeted wording", exact: true }).click();
  await page.getByLabel("Customize wording for Backend Engineer — ZenID").click();
  await page.getByLabel("Targeted wording for Backend Engineer — ZenID").fill(
    "Targeted backend description"
  );
  await page.getByLabel("Customize wording for API Project").click();
  await page.getByLabel("Targeted wording for API Project").fill("Targeted API description");
  await expect(page.getByText("Shared backend description", { exact: true })).toBeVisible();

  const preview = page.getByLabel("Resume design preview");
  await expect(preview).toContainText("Backend Engineer");
  await expect(preview).toContainText("API Project");
  await expect(preview).not.toContainText("Retail Associate");
  await expect(preview).not.toContainText("Landing Page");
  await expect(preview).toContainText("Targeted backend description");
  await expect(preview).toContainText("Targeted API description");
  await expect(preview).not.toContainText("Shared backend description");

  await page.getByLabel("Use shared wording for API Project").click();
  await expect(preview).toContainText("Shared API description");
  await page.getByLabel("Customize wording for API Project").click();
  await page.getByLabel("Targeted wording for API Project").fill("Targeted API description");

  await page.getByRole("button", { name: "PDF export", exact: true }).click();
  await expect(page.getByAltText(/Resume PDF page 1 of/)).toBeVisible();
  await page.getByRole("button", { name: "Design", exact: true }).click();

  const pdfDownloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export PDF", exact: true }).click();
  const pdfDownload = await pdfDownloadPromise;
  const directPdfText = await extractPdfText(await readFile(await pdfDownload.path()));
  expect(directPdfText).toContain("Backend Engineer");
  expect(directPdfText).toContain("API Project");
  expect(directPdfText).toContain("Targeted backend description");
  expect(directPdfText).toContain("Targeted API description");
  expect(directPdfText).not.toContain("Retail Associate");
  expect(directPdfText).not.toContain("Landing Page");

  await page.getByLabel("Active resume version").selectOption({ label: "General Resume" });
  await expect(preview).toContainText("Retail Associate");
  await expect(preview).toContainText("Landing Page");
  await expect(preview).toContainText("Shared backend description");
  await expect(preview).toContainText("Shared API description");
  await expect(preview).not.toContainText("Targeted backend description");

  await page.getByLabel("Active resume version").selectOption({ label: "Backend Resume" });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /save zenid project/i }).click();
  const download = await downloadPromise;
  const projectPath = await download.path();
  const projectFiles = unzipSync(new Uint8Array(await readFile(projectPath)));
  const manifest = JSON.parse(strFromU8(projectFiles["manifest.json"]));
  const backendResume = manifest.resumes
    .map((entry) => JSON.parse(strFromU8(projectFiles[entry.path])))
    .find((resume) => resume.name === "Backend Resume");
  const backendPdfEntry = manifest.generatedPdfs.find(
    (entry) => entry.resumeId === backendResume.id
  );
  const savedPdfText = await extractPdfText(projectFiles[backendPdfEntry.path]);
  expect(savedPdfText).toContain("Backend Engineer");
  expect(savedPdfText).toContain("Targeted backend description");
  expect(savedPdfText).toContain("Targeted API description");
  expect(savedPdfText).not.toContain("Retail Associate");
  expect(savedPdfText).not.toContain("Landing Page");

  page.once("dialog", (dialog) => dialog.accept());
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /open zenid project/i }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(projectPath);

  await expect(page.getByRole("status")).toContainText("Project opened locally");
  await page.getByLabel("Active resume version").selectOption({ label: "Backend Resume" });
  await expect(page.getByLabel("Include Retail Associate — Store in this resume")).not.toBeChecked();
  await expect(page.getByLabel("Include Landing Page in this resume")).not.toBeChecked();
  const backendWording = page.getByLabel("Targeted wording for Backend Engineer — ZenID");
  if (!(await backendWording.isVisible())) {
    await page.getByRole("button", { name: "Targeted wording", exact: true }).click();
  }
  await expect(backendWording).toHaveValue(
    "Targeted backend description"
  );
  await expect(page.getByLabel("Targeted wording for API Project")).toHaveValue(
    "Targeted API description"
  );
  await expect(preview).not.toContainText("Retail Associate");
  await expect(preview).not.toContainText("Landing Page");
});
