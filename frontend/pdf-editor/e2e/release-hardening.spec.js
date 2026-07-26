import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTES = [
  { path: "/", heading: /welcome to zenid/i },
  { path: "/resume", heading: /choose a starting point/i },
  { path: "/portfolio", heading: /portfolio builder/i },
  { path: "/editor", heading: /fill and sign application forms privately/i },
];

for (const { path, heading } of ROUTES) {
  test(`renders the critical ${path} route`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  });
}

test("core routes have no serious or critical automated WCAG violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The primary accessibility gate runs once in desktop Chromium.");

  for (const { path, heading } of ROUTES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22a", "wcag22aa"])
      .analyze();
    const blocking = result.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical"
    );
    expect(blocking, `${path} accessibility violations:\n${JSON.stringify(blocking, null, 2)}`)
      .toEqual([]);
  }
});

test("core routes do not overflow the mobile document viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium-release", "The overflow gate targets the supported mobile viewport.");

  for (const { path, heading } of ROUTES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});
