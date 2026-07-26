import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createEmptyProject, PROJECT_STORAGE_KEY } from "../src/resume/projectSchema.js";

async function extractPdfText(bytes) {
  const document = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) }).promise;
  const page = await document.getPage(1);
  const content = await page.getTextContent();
  await document.destroy();
  return content.items.map((item) => item.str).join(" ");
}

test("remembers the accessible Turkish interface preference across core routes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "TR", exact: true }).click();

  await expect(page.locator("html")).toHaveAttribute("lang", "tr");
  await expect(page.getByRole("heading", { name: "ZenID’ye Hoş Geldiniz" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "ZenID’ye Hoş Geldiniz" })).toBeVisible();

  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: "Başvuru formlarını gizlilikle doldurun ve imzalayın" })).toBeVisible();
  await expect(page.getByText("PDF veya görseli buraya sürükleyip bırakın")).toBeVisible();

  await page.goto("/portfolio");
  await expect(page.getByRole("heading", { name: "Portfolio Hazırlayıcı" })).toBeVisible();
  await page.getByLabel("Çıktı dili").selectOption("tr");
  await expect(page.locator('article[lang="tr"]')).toBeVisible();
  await expect(page.getByRole("link", { name: "Hakkımda" })).toBeVisible();
});

test("exports a Turkish résumé without rewriting authored profile content", async ({ page }) => {
  const project = createEmptyProject();
  project.resumes[0].template = "minimal";
  project.resumes[0].pendingTemplate = "minimal";
  project.profile.personalInfo.fullName = "Şule Işık";
  project.profile.personalInfo.summary = "Kullanıcının özgün metni.";
  project.profile.experience = [{
    id: "experience",
    company: "ZenID",
    role: "Yazılım Geliştirici",
    startDate: "2026-07",
    isCurrentlyWorking: true,
    description: "Yerel belge araçları geliştirdim.",
  }];

  await page.addInitScript(
    ({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)),
    { storageKey: PROJECT_STORAGE_KEY, value: project }
  );
  await page.goto("/resume");
  await page.getByRole("button", { name: "TR", exact: true }).click();
  await page.getByLabel("Çıktı dili").selectOption("tr");

  const preview = page.getByLabel("Resume design preview");
  await expect(preview).toContainText("Profesyonel Deneyim");
  await expect(preview).toContainText("Tem 2026");
  await expect(preview).toContainText("Devam ediyor");
  await expect(preview).toContainText("Kullanıcının özgün metni.");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PDF’yi Dışa Aktar" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("Şule_Işık_CV.pdf");
  const pdfText = await extractPdfText(await readFile(await download.path()));
  expect(pdfText).toContain("PROFESYONEL DENEYİM");
  expect(pdfText).toContain("Tem 2026");
  expect(pdfText).toContain("Devam ediyor");
  expect(pdfText).toContain("Kullanıcının özgün metni.");
});

