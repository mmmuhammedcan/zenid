import test from "node:test";
import assert from "node:assert/strict";
import { degrees, PDFDocument, StandardFonts } from "pdf-lib";
import { applyOverlaysToOriginalPdf } from "./pdfExport.js";

const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

test("overlay export preserves original PDF page count and dimensions", async () => {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  const first = source.addPage([400, 600]);
  first.drawText("Original selectable text", { x: 30, y: 550, font });
  const form = source.getForm();
  const nameField = form.createTextField("applicant.name");
  nameField.addToPage(first, { x: 30, y: 500, width: 180, height: 24, font });
  const second = source.addPage([612, 792]);
  second.setRotation(degrees(90));
  const sourceBytes = await source.save();

  const outputBytes = await applyOverlaysToOriginalPdf(sourceBytes, [TRANSPARENT_PIXEL, TRANSPARENT_PIXEL]);
  const output = await PDFDocument.load(outputBytes);
  const pages = output.getPages();

  assert.equal(pages.length, 2);
  assert.deepEqual(pages[0].getSize(), { width: 400, height: 600 });
  assert.deepEqual(pages[1].getSize(), { width: 612, height: 792 });
  assert.equal(pages[1].getRotation().angle, 90);
  assert.deepEqual(output.getForm().getFields().map((field) => field.getName()), ["applicant.name"]);
  assert.ok(outputBytes.length > sourceBytes.length);
});
