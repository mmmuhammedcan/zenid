import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

async function syntheticTwoPagePdf() {
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]);
  pdf.addPage([595, 842]);
  return Buffer.from(await pdf.save());
}

test("loads, navigates, and exports a synthetic two-page PDF locally", async ({ page }) => {
  const requests = [];
  await page.goto("/editor");
  await expect(page.getByRole("heading", { name: /fill and sign application forms privately/i })).toBeVisible();
  await page.waitForLoadState("networkidle");
  page.on("request", (request) => requests.push({ method: request.method(), url: request.url() }));

  await page.locator('input[type="file"][accept*="application/pdf"]').setInputFiles({
    name: "Synthetic_Two_Page_Form.pdf",
    mimeType: "application/pdf",
    buffer: await syntheticTwoPagePdf(),
  });

  await expect(page.getByRole("status")).toHaveText("Document ready.");
  await expect(page.getByText("Page 1 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page.getByRole("button", { name: "Previous page" }).click();
  await expect(page.getByText("Page 1 of 2")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /export pdf/i }).click();
  const download = await downloadPromise;
  const exported = await PDFDocument.load(await readFile(await download.path()));
  expect(exported.getPageCount()).toBe(2);

  for (const request of requests) {
    expect(request.method).toBe("GET");
    expect(new URL(request.url).origin).toBe("http://127.0.0.1:4173");
  }
});
