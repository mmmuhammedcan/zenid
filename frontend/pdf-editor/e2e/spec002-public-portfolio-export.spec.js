import { test, expect } from "@playwright/test";
import {
  createEmptyProject,
  PROJECT_STORAGE_KEY,
} from "../src/resume/projectSchema.js";

test("reviews only public portfolio data and Keep editing creates no download", async ({ page }) => {
  const project = createEmptyProject();
  project.profile.personalInfo = {
    ...project.profile.personalInfo,
    fullName: "Synthetic Portfolio User",
    title: "Engineer",
    email: "public@example.test",
    phone: "+90 private phone",
    github: "https://github.com/synthetic-user",
  };
  project.portfolio.contactPrivacy.email = true;
  project.portfolio.contactPrivacy.phone = false;
  project.portfolio.contactPrivacy.github = true;
  project.portfolio.resume = {
    ...project.portfolio.resume,
    enabled: true,
    source: "generated",
    resumeId: project.resumes[0].id,
  };

  await page.addInitScript(
    ({ storageKey, value }) => localStorage.setItem(storageKey, JSON.stringify(value)),
    { storageKey: PROJECT_STORAGE_KEY, value: project }
  );
  await page.goto("/portfolio");
  await page.evaluate(() => {
    window.__zenidDownloadClicks = 0;
    const originalClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function trackDownloads(...args) {
      if (this.download) window.__zenidDownloadClicks += 1;
      return originalClick.apply(this, args);
    };
  });

  await page.getByRole("button", { name: /export website/i }).click();
  const dialog = page.getByRole("dialog", {
    name: /review everything that will become public/i,
  });

  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("public@example.test");
  await expect(dialog).toContainText("github.com/synthetic-user");
  await expect(dialog).not.toContainText("+90 private phone");
  await expect(dialog).toContainText("index.html");
  await expect(dialog).toContainText("Generated résumé PDF");

  await dialog.getByRole("button", { name: /keep editing/i }).click();

  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => window.__zenidDownloadClicks)).toBe(0);
});
