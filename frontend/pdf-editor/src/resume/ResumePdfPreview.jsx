import { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { buildResumePdf } from "./resumePdfExport.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PREVIEW_SCALE = 1.5;
const PREVIEW_DEBOUNCE_MS = 350;

export default function ResumePdfPreview({ resumeData, accentColor, language = "en" }) {
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let pdfDocument = null;

    setStatus("loading");
    setError("");

    const timeoutId = window.setTimeout(async () => {
      try {
        const resumePdf = await buildResumePdf({ resumeData, accentColor, language });
        if (cancelled) return;

        const bytes = new Uint8Array(resumePdf.output("arraybuffer"));
        pdfDocument = await pdfjsLib.getDocument({ data: bytes }).promise;
        const renderedPages = [];

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (cancelled) return;
          const page = await pdfDocument.getPage(pageNumber);
          const viewport = page.getViewport({ scale: PREVIEW_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const context = canvas.getContext("2d", { alpha: false });
          await page.render({ canvasContext: context, viewport }).promise;
          renderedPages.push({
            pageNumber,
            imageUrl: canvas.toDataURL("image/png"),
            width: viewport.width,
            height: viewport.height,
          });
        }

        if (!cancelled) {
          setPages(renderedPages);
          setStatus("ready");
        }
      } catch (previewError) {
        console.error("Resume PDF preview failed", previewError);
        if (!cancelled) {
          setError("The PDF preview could not be generated. PDF export is still available from the header.");
          setStatus("error");
        }
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      pdfDocument?.destroy();
    };
  }, [resumeData, accentColor, language]);

  if (status === "loading") {
    return (
      <div
        role="status"
        className="flex h-64 w-[595px] items-center justify-center rounded-md border border-stone-800 bg-stone-900/50 text-sm text-stone-400"
      >
        Generating the private local PDF preview…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className="w-[595px] rounded-md border border-red-900/60 bg-red-950/50 p-5 text-sm text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" aria-label={`${pages.length}-page PDF export preview`}>
      {pages.map((page) => (
        <figure key={page.pageNumber} className="m-0">
          <img
            src={page.imageUrl}
            alt={`Resume PDF page ${page.pageNumber} of ${pages.length}`}
            className="block w-[595px] rounded-md bg-white ring-1 ring-stone-900/10"
            style={{ boxShadow: "0 0 60px -15px rgba(0, 0, 0, 0.7)" }}
          />
          <figcaption className="mt-2 text-center text-xs text-stone-500">
            Page {page.pageNumber} of {pages.length}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
