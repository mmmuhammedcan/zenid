// jsPDF hardcodes the "%PDF-1.3" header and never calls its own internal
// setPdfVersion hook (dead code in the library — see node_modules/jspdf),
// so every jsPDF-generated file claims to be PDF 1.3 with no public API to
// change it. Some strict corporate upload validators (e.g. ASELSAN's
// application portal) reject that version outright even though the file is
// structurally valid. "1.3" and "1.7" are the same byte length, so patching
// the header in place is safe and doesn't shift any xref offset.
const OLD_HEADER = "%PDF-1.3";
const NEW_HEADER = "%PDF-1.7";

function patchPdfVersion(bytes) {
  const header = String.fromCharCode(...bytes.subarray(0, OLD_HEADER.length));
  if (header !== OLD_HEADER) return bytes;
  for (let i = 0; i < NEW_HEADER.length; i++) {
    bytes[i] = NEW_HEADER.charCodeAt(i);
  }
  return bytes;
}

export function saveJsPdf(doc, filename) {
  const bytes = patchPdfVersion(new Uint8Array(doc.output("arraybuffer")));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
