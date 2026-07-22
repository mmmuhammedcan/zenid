import jsPDF from "jspdf";
import { StaticCanvas } from "fabric";

export const A4_WIDTH_PT = 595;
export const A4_HEIGHT_PT = 842;

// Merge the PDF.js raster layer (if any — image-sourced pages have none) with
// a fabric canvas's rendered content (background image + added objects) into
// one flattened image. fCanvas.toDataURL() alone can't be used for the PDF
// case because the PDF raster lives on a separate, non-fabric <canvas>.
export function flattenToDataUrl(rasterCanvasEl, fCanvas) {
  const width = fCanvas.getWidth();
  const height = fCanvas.getHeight();
  const merged = document.createElement("canvas");
  merged.width = width;
  merged.height = height;
  const ctx = merged.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  if (rasterCanvasEl) ctx.drawImage(rasterCanvasEl, 0, 0, width, height);
  ctx.drawImage(fCanvas.lowerCanvasEl, 0, 0, width, height);
  return merged.toDataURL("image/jpeg", 0.92);
}

// Re-render a saved (non-current) PDF page + its saved annotations JSON
// entirely offscreen, purely for export — never touches the live UI canvases.
export async function renderSavedPageToDataUrl(pdfDoc, pageNum, savedJson, renderScale) {
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: renderScale });

  const rasterCanvas = document.createElement("canvas");
  rasterCanvas.width = viewport.width;
  rasterCanvas.height = viewport.height;
  await page.render({ canvasContext: rasterCanvas.getContext("2d"), viewport }).promise;

  const staticCanvas = new StaticCanvas(document.createElement("canvas"), {
    width: viewport.width,
    height: viewport.height,
  });
  if (savedJson) {
    // loadFromJSON is Promise-based — its 2nd argument is a per-object
    // reviver (called once per restored object), not a completion callback.
    // Passing `resolve` there would resolve after the FIRST object on a
    // multi-object page, not all of them — silently dropping objects from
    // the export. Await the returned promise instead.
    await staticCanvas.loadFromJSON(savedJson);
  }
  staticCanvas.renderAll();

  const dataUrl = flattenToDataUrl(rasterCanvas, staticCanvas);
  staticCanvas.dispose();
  return dataUrl;
}

export function overlayToPngDataUrl(fCanvas) {
  return fCanvas.getObjects().length > 0 ? fCanvas.toDataURL({ format: "png", multiplier: 1 }) : null;
}

export async function renderSavedOverlayToPngDataUrl(pdfDoc, pageNum, savedJson, renderScale) {
  if (!savedJson?.objects?.length) return null;

  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: renderScale });
  const staticCanvas = new StaticCanvas(document.createElement("canvas"), {
    width: viewport.width,
    height: viewport.height,
  });
  await staticCanvas.loadFromJSON(savedJson);
  staticCanvas.renderAll();
  const dataUrl = overlayToPngDataUrl(staticCanvas);
  staticCanvas.dispose();
  return dataUrl;
}

// Keep the original PDF as the document and draw only ZenPDF's transparent
// overlay on each page. Unlike the legacy JPEG-flattening path, this retains
// the source page dimensions, selectable text, links, and existing form data.
export async function applyOverlaysToOriginalPdf(originalPdfBytes, overlayDataUrls) {
  const { PDFDocument, degrees } = await import("pdf-lib");
  const pdfDoc = await PDFDocument.load(originalPdfBytes);
  const pages = pdfDoc.getPages();

  for (let index = 0; index < pages.length; index += 1) {
    const overlayDataUrl = overlayDataUrls[index];
    if (!overlayDataUrl) continue;
    const overlay = await pdfDoc.embedPng(overlayDataUrl);
    const page = pages[index];
    const { x, y, width, height } = page.getCropBox();
    const rotation = ((page.getRotation().angle % 360) + 360) % 360;

    if (rotation === 90) {
      page.drawImage(overlay, { x, y: y + height, width: height, height: width, rotate: degrees(-90) });
    } else if (rotation === 180) {
      page.drawImage(overlay, { x: x + width, y: y + height, width, height, rotate: degrees(180) });
    } else if (rotation === 270) {
      page.drawImage(overlay, { x: x + width, y, width: height, height: width, rotate: degrees(90) });
    } else {
      page.drawImage(overlay, { x, y, width, height });
    }
  }

  return pdfDoc.save();
}

export function buildPdfFromPages(pageDataUrls) {
  const doc = new jsPDF({ unit: "pt", format: [A4_WIDTH_PT, A4_HEIGHT_PT] });
  pageDataUrls.forEach((dataUrl, i) => {
    if (i > 0) doc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
    doc.addImage(dataUrl, "JPEG", 0, 0, A4_WIDTH_PT, A4_HEIGHT_PT);
  });
  return doc;
}
