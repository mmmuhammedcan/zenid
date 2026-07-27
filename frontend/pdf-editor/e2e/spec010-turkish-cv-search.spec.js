import { test, expect } from "@playwright/test";

const pages = [
  {
    path: "/tr/cv-hazirlama/",
    locale: "tr",
    title: /Ücretsiz CV Hazırlama.*ZenID/,
    heading: /Ücretsiz CV Hazırlama/,
    canonical: "https://getzenid.com/tr/cv-hazirlama/",
    privacy: /verileriniz cihazınızda kalır/i,
    cta: /CV oluşturmaya başla/i,
    toolPath: "/resume",
  },
  {
    path: "/en/resume-builder/",
    locale: "en",
    title: /Free ATS-Friendly Resume Builder.*ZenID/,
    heading: /Free ATS-Friendly Resume Builder/,
    canonical: "https://getzenid.com/en/resume-builder/",
    privacy: /data stays on your device/i,
    cta: /Build your resume/i,
    toolPath: "/resume",
  },
  {
    path: "/tr/portfolyo-hazirlama/",
    locale: "tr",
    title: /Ücretsiz Portfolyo Hazırlama.*ZenID/,
    heading: /Ücretsiz Portfolyo Hazırlama/,
    canonical: "https://getzenid.com/tr/portfolyo-hazirlama/",
    privacy: /yalnızca seçtiğiniz bilgileri/i,
    cta: /Portfolyo oluşturmaya başla/i,
    toolPath: "/portfolio",
  },
  {
    path: "/en/portfolio-builder/",
    locale: "en",
    title: /Free Private Portfolio Builder.*ZenID/,
    heading: /Free Private Portfolio Builder/,
    canonical: "https://getzenid.com/en/portfolio-builder/",
    privacy: /only the information you select/i,
    cta: /Build your portfolio/i,
    toolPath: "/portfolio",
  },
  {
    path: "/tr/pdf-duzenleme/",
    locale: "tr",
    title: /Tarayıcıda Ücretsiz PDF Düzenleme.*ZenID/,
    heading: /Tarayıcıda Ücretsiz PDF Düzenleme/,
    canonical: "https://getzenid.com/tr/pdf-duzenleme/",
    privacy: /belgeniz tarayıcınızda kalır/i,
    cta: /PDF düzenlemeye başla/i,
    toolPath: "/editor",
  },
  {
    path: "/en/private-pdf-editor/",
    locale: "en",
    title: /Free Private PDF Editor.*ZenID/,
    heading: /Free Private PDF Editor/,
    canonical: "https://getzenid.com/en/private-pdf-editor/",
    privacy: /document stays in your browser/i,
    cta: /Edit a PDF/i,
    toolPath: "/editor",
  },
];

for (const discoveryPage of pages) {
  test(`serves ${discoveryPage.path} with accurate metadata and a tool CTA`, async ({ page }) => {
    await page.goto(discoveryPage.path);

    await expect(page.locator("html")).toHaveAttribute("lang", discoveryPage.locale);
    await expect(
      page.getByRole("link", { name: discoveryPage.locale.toUpperCase(), exact: true })
    ).toHaveAttribute("aria-current", "page");
    await expect(page).toHaveTitle(discoveryPage.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      discoveryPage.canonical
    );
    await expect(
      page.getByRole("heading", { level: 1, name: discoveryPage.heading })
    ).toBeVisible();
    await expect(page.getByText(discoveryPage.privacy)).toBeVisible();

    const toolLink = page.getByRole("link", { name: discoveryPage.cta });
    await expect(toolLink).toHaveAttribute("href", discoveryPage.toolPath);
    await toolLink.click();
    await expect(page).toHaveURL(new RegExp(`${discoveryPage.toolPath}$`));
    await expect(page).toHaveTitle("ZenID — Your local identity workspace.");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://getzenid.com/"
    );
    await expect(page.locator('link[rel="alternate"]')).toHaveCount(0);
    await expect(page.locator("script[data-zenid-search-structured]")).toHaveCount(0);
  });
}
