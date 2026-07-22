// Shared by both PDF export paths (ZenPDF's raster export in pdfExport.js
// and Resume Builder's native-text export in resume/resumePdfExport.js) so
// the logo geometry and loading logic can't drift between the two.
const LOGO_PATH = "/assets/zenid-wordmark.png";
const LOGO_INTRINSIC_WIDTH = 1244;
const LOGO_INTRINSIC_HEIGHT = 332;
const MM_TO_PT = 2.8346;

export const LOGO_WIDTH_PT = 34 * MM_TO_PT; // ~34mm, within the requested 32-38mm range
export const LOGO_HEIGHT_PT = LOGO_WIDTH_PT * (LOGO_INTRINSIC_HEIGHT / LOGO_INTRINSIC_WIDTH);

const TOP_MARGIN_PT = 24;
const DIVIDER_GAP_PT = 10;
const CONTENT_GAP_PT = 14; // spacing between the divider and whatever comes next

// Total vertical space the letterhead reserves at the top of a page.
export const LETTERHEAD_HEIGHT_PT = TOP_MARGIN_PT + LOGO_HEIGHT_PT + DIVIDER_GAP_PT + CONTENT_GAP_PT;

let cachedLogoDataUrl = null;

// Fetches the PNG once and caches it as a data URL — jsPDF's addImage()
// needs a data URL/Uint8Array in a browser context, not a bare file path.
export async function loadLetterheadLogo() {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const res = await fetch(LOGO_PATH);
  const blob = await res.blob();
  cachedLogoDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return cachedLogoDataUrl;
}

// Draws the logo + divider on the CURRENT page of `doc` at the top-left,
// using amber (#d97706 — the app's own accent) for the divider by default.
export function drawLetterhead(doc, logoDataUrl, pageWidthPt, marginPt, dividerRgb = [217, 119, 6]) {
  const x = marginPt;
  const y = TOP_MARGIN_PT;
  doc.addImage(logoDataUrl, "PNG", x, y, LOGO_WIDTH_PT, LOGO_HEIGHT_PT, undefined, "FAST");

  const dividerY = y + LOGO_HEIGHT_PT + DIVIDER_GAP_PT;
  doc.setDrawColor(...dividerRgb);
  doc.setLineWidth(0.75);
  doc.line(marginPt, dividerY, pageWidthPt - marginPt, dividerY);
}
