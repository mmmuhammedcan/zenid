import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Canvas as FabricCanvas, FabricImage, IText, PencilBrush } from "fabric";
import { Download } from "lucide-react";
import Toolbar from "./Toolbar";
import TextSettingsPanel from "./TextSettingsPanel";
import SignaturePad from "./SignaturePad";
import Dropzone from "./Dropzone";
import DrawPopover from "./DrawPopover";
import FillToolsPopover from "./FillToolsPopover";
import BottomBar from "./BottomBar";
import useHistory from "./useHistory";
import { restoreCanvasSnapshot } from "./canvasRestore";
import { initialDocumentZoom } from "./responsiveZoom.js";
import {
  LEGACY_INITIALS_KEY,
  LEGACY_SIGNATURE_KEY,
  ZENPDF_INITIALS_ID,
  ZENPDF_SIGNATURE_ID,
  loadPrivateData,
  savePrivateData,
} from "./storage/privateDataStore.js";
import {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  applyOverlaysToOriginalPdf,
  buildPdfFromPages,
  flattenToDataUrl,
  overlayToPngDataUrl,
  renderSavedOverlayToPngDataUrl,
  renderSavedPageToDataUrl,
} from "./pdfExport";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const RENDER_SCALE = 1.5; // PDF.js render scale — independent of the CSS zoom applied on top
const MAX_SOURCE_FILE_BYTES = 50 * 1024 * 1024;

// The floating text toolbar renders *above* its anchor point (translateY of
// -100% - 12px), and the bottom nav/zoom bar is pinned near the bottom of the
// viewport — if an object gets dragged close to the bottom edge, the toolbar
// can dip down far enough to clip into the bottom bar. Reserve enough space
// (bottom bar's own height/offset + the toolbar's height + its gap) so the
// anchor is never placed low enough for that to happen.
const BOTTOM_UI_RESERVED_SPACE = 140;

// Where the object currently is, in real screen pixels — used to position the
// floating text toolbar directly above it. Reads the canvas's *rendered*
// (post CSS-transform/zoom) box via getBoundingClientRect, so this stays
// correct at any zoom level without extra zoom-specific math.
function computeToolbarPosition(fCanvas, obj) {
  const canvasEl = fCanvas.upperCanvasEl;
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = rect.width / fCanvas.getWidth();
  const scaleY = rect.height / fCanvas.getHeight();
  const objRect = obj.getBoundingRect(true);
  const top = rect.top + objRect.top * scaleY;
  const maxTop = window.innerHeight - BOTTOM_UI_RESERVED_SPACE;
  return {
    left: rect.left + (objRect.left + objRect.width / 2) * scaleX,
    top: Math.min(top, maxTop),
  };
}

export default function PdfEditor() {
  const [status, setStatus] = useState("Choose a PDF or image.");
  const [pdfLoaded, setPdfLoaded] = useState(false); // controls Dropzone vs. Canvas view
  const [sourceType, setSourceType] = useState(null); // 'pdf' | 'image' — which export path to use
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [sourceFileName, setSourceFileName] = useState("document.pdf");
  const [fillToolsOpen, setFillToolsOpen] = useState(false);
  const [placementTool, setPlacementTool] = useState(null);
  const [signatureMode, setSignatureMode] = useState("signature");
  const [interactiveFieldCount, setInteractiveFieldCount] = useState(0);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [documentReady, setDocumentReady] = useState(false);
  const [savedSignature, setSavedSignature] = useState(null);
  const [savedInitials, setSavedInitials] = useState(null);
  const hasSavedSignature = Boolean(savedSignature);
  const hasSavedInitials = Boolean(savedInitials);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadPrivateData(ZENPDF_SIGNATURE_ID, LEGACY_SIGNATURE_KEY),
      loadPrivateData(ZENPDF_INITIALS_ID, LEGACY_INITIALS_KEY),
    ])
      .then(([signature, initials]) => {
        if (!active) return;
        setSavedSignature(signature);
        setSavedInitials(initials);
      })
      .catch((error) => {
        console.warn("ZenPDF could not restore private local drawing data.", error);
        if (active) setStatus("Saved signature data could not be restored.");
      });
    return () => {
      active = false;
    };
  }, []);

  // Floating text toolbar
  const [activeText, setActiveText] = useState(null);
  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState(null);

  // Freehand drawing
  const [drawMode, setDrawMode] = useState(false);
  const [eraseMode, setEraseMode] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [strokeColor, setStrokeColor] = useState("#000000");
  // Mirror drawMode/eraseMode into refs for the fabric event handlers below,
  // which are wired once per canvas instance (in setupFabricOverlay) and
  // would otherwise close over a stale value from whatever render they were
  // created in.
  const drawModeRef = useRef(false);
  const eraseModeRef = useRef(false);
  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);
  useEffect(() => {
    eraseModeRef.current = eraseMode;
  }, [eraseMode]);

  const history = useHistory();

  // Pages + zoom
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [pageDimensions, setPageDimensions] = useState({ width: 0, height: 0 });

  const pdfCanvasRef = useRef(null); // the read-only canvas PDF.js renders into
  const fabricCanvasElRef = useRef(null); // the <canvas> element Fabric mounts on
  const fabricRef = useRef(null); // the fabric.Canvas instance
  const pdfDocRef = useRef(null); // the pdf.js document proxy (all pages)
  const originalPdfBytesRef = useRef(null); // source bytes retained for non-destructive export
  const pagesDataRef = useRef({}); // pageNumber -> fabric.toJSON(), so annotations survive page switches
  const placementToolRef = useRef(null);
  const documentOperationRef = useRef(false);

  // Clean up the fabric instance on unmount
  useEffect(() => {
    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  // Delete/Backspace removes the selected object — but not while actively
  // editing text (Backspace should delete a character there instead).
  // Also: Ctrl+Z / Ctrl+Shift+Z (undo/redo), Escape (deselect), Ctrl+D
  // (duplicate) — all skip while a text object is mid-edit for the same
  // reason (don't hijack normal typing/text-editing keys).
  useEffect(() => {
    const handleKeyDown = (e) => {
      const fCanvas = fabricRef.current;
      if (!fCanvas) return;
      const obj = fCanvas.getActiveObject();

      if (e.key === "Escape" && placementToolRef.current) {
        placementToolRef.current = null;
        setPlacementTool(null);
        setStatus("Placement cancelled.");
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && obj && !obj.isEditing) {
        fCanvas.remove(obj);
        fCanvas.requestRenderAll();
        setShowTextToolbar(false);
        return;
      }

      if (obj?.isEditing) return; // let every shortcut below fall through to normal typing

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (ctrlOrCmd && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      } else if (ctrlOrCmd && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (ctrlOrCmd && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicate();
      } else if (e.key === "Escape") {
        fCanvas.discardActiveObject();
        fCanvas.requestRenderAll();
        setShowTextToolbar(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Keep the free-drawing brush in sync with the popover controls
  useEffect(() => {
    const fCanvas = fabricRef.current;
    if (fCanvas?.freeDrawingBrush) {
      fCanvas.freeDrawingBrush.width = strokeWidth;
      fCanvas.freeDrawingBrush.color = strokeColor;
    }
  }, [strokeWidth, strokeColor]);

  // Re-anchor the floating text toolbar if the zoom level changes under it
  useEffect(() => {
    const fCanvas = fabricRef.current;
    const obj = fCanvas?.getActiveObject();
    if (obj && obj.type === "i-text") {
      setToolbarPosition(computeToolbarPosition(fCanvas, obj));
    }
  }, [zoom]);

  // Shared by the Dropzone's click-to-browse input AND its drag-and-drop —
  // both just end up with a File. Branches on type: a real PDF goes through
  // PDF.js as before; an image bypasses PDF.js entirely and becomes the
  // background of a single new A4-proportioned fabric canvas.
  const loadFile = async (file) => {
    if (!file) return;
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      setStatus("This file is larger than ZenPDF's current 50 MB safety limit.");
      return;
    }
    if (file.type === "application/pdf") {
      await loadPdfFile(file);
    } else if (file.type.startsWith("image/")) {
      await loadImageFile(file);
    } else {
      setStatus("Please choose a PDF, JPG, or PNG file.");
    }
  };

  const loadPdfFile = async (file) => {
    setDocumentReady(false);
    setStatus("Loading...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalBytes = new Uint8Array(arrayBuffer.slice(0));
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      pdfDocRef.current = pdf;
      originalPdfBytesRef.current = originalBytes;
      pagesDataRef.current = {};
      setSourceType("pdf");
      setSourceFileName(file.name || "document.pdf");
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      await renderPage(1, { fitToViewport: true });
      const annotationsByPage = await Promise.all(
        Array.from({ length: pdf.numPages }, async (_unused, index) => {
          const page = await pdf.getPage(index + 1);
          return page.getAnnotations({ intent: "display" });
        })
      );
      const fieldCount = annotationsByPage
        .flat()
        .filter((annotation) => annotation.subtype === "Widget" || annotation.fieldType).length;
      setInteractiveFieldCount(fieldCount);
      setStatus(
        fieldCount > 0
          ? `${fieldCount} interactive form field${fieldCount === 1 ? "" : "s"} detected. Quick Fill can place content over any field.`
          : "Document ready."
      );
      setDocumentReady(true);
      setPdfLoaded(true);
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  const loadImageFile = async (file) => {
    setDocumentReady(false);
    setStatus("Loading...");
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read the image file"));
        reader.readAsDataURL(file);
      });

      pdfDocRef.current = null;
      originalPdfBytesRef.current = null;
      pagesDataRef.current = {};
      setSourceType("image");
      setSourceFileName(file.name ? file.name.replace(/\.[^.]+$/, ".pdf") : "document.pdf");
      setNumPages(1);
      setInteractiveFieldCount(0);
      setCurrentPage(1);

      const width = A4_WIDTH_PT * RENDER_SCALE;
      const height = A4_HEIGHT_PT * RENDER_SCALE;
      setPageDimensions({ width, height });
      setZoom(initialDocumentZoom({ viewportWidth: window.innerWidth, documentWidth: width }));

      // Blank white "paper" backing, kept for visual/export consistency with
      // the PDF flow — the real content lives on the fabric layer as a
      // background image, but flattenToDataUrl still expects a raster to
      // composite under it.
      const pdfCanvas = pdfCanvasRef.current;
      pdfCanvas.width = width;
      pdfCanvas.height = height;
      const bgCtx = pdfCanvas.getContext("2d");
      bgCtx.fillStyle = "#ffffff";
      bgCtx.fillRect(0, 0, width, height);

      await setupFabricOverlay(width, height, 1);

      const fCanvas = fabricRef.current;
      const img = await FabricImage.fromURL(dataUrl);
      // Contain-fit within the page with a small margin, never upscale
      const scale = Math.min((width * 0.92) / img.width, (height * 0.92) / img.height, 1);
      img.set({
        left: width / 2,
        top: height / 2,
        originX: "center",
        originY: "center",
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
      });
      fCanvas.backgroundImage = img;
      fCanvas.requestRenderAll();

      setStatus("Document ready.");
      setDocumentReady(true);
      setPdfLoaded(true);
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  const handleChangePdf = () => {
    if (documentOperationRef.current) return;
    const currentHasObjects = (fabricRef.current?.getObjects().length || 0) > 0;
    const anotherPageHasObjects = Object.values(pagesDataRef.current).some((page) => page?.objects?.length);
    if (
      (currentHasObjects || anotherPageHasObjects) &&
      !window.confirm("Change the file? Unsaved text, marks, drawings, and signatures in this document will be lost.")
    ) {
      return;
    }
    fabricRef.current?.dispose();
    fabricRef.current = null;
    pdfDocRef.current = null;
    originalPdfBytesRef.current = null;
    pagesDataRef.current = {};
    setActiveText(null);
    setShowTextToolbar(false);
    setDrawMode(false);
    placementToolRef.current = null;
    setPlacementTool(null);
    setFillToolsOpen(false);
    setCurrentPage(1);
    setNumPages(1);
    setInteractiveFieldCount(0);
    setZoom(100);
    setPageDimensions({ width: 0, height: 0 });
    setSourceType(null);
    setDocumentReady(false);
    setPdfLoaded(false);
    setStatus("Choose a PDF or image.");
  };

  // --- Export — normal PDF files keep their original page content and receive
  // transparent ZenPDF overlays. Image sources use the A4 raster composition
  // path because they intentionally create a new document layout. ---
  const handleExportPdf = async () => {
    if (!pdfLoaded || !documentReady || !fabricRef.current || documentOperationRef.current) return;
    documentOperationRef.current = true;
    setDocumentBusy(true);
    setStatus("Exporting...");
    try {
      // Selection handles/borders render onto the same canvas layer we flatten
      // for export — deselect first or they end up baked into the PDF. Must
      // be renderAll() (synchronous), not requestRenderAll() — the latter
      // only schedules a render on the next animation frame, so the canvas
      // pixels we read immediately after would still show the old, selected
      // frame.
      fabricRef.current.discardActiveObject();
      fabricRef.current.renderAll();
      setShowTextToolbar(false);

      pagesDataRef.current[currentPage] = fabricRef.current.toJSON();

      const outputName = `${sourceFileName.replace(/\.pdf$/i, "")}_filled.pdf`;
      if (sourceType === "pdf" && originalPdfBytesRef.current) {
        const overlayDataUrls = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
          overlayDataUrls.push(
            pageNum === currentPage
              ? overlayToPngDataUrl(fabricRef.current)
              : await renderSavedOverlayToPngDataUrl(
                  pdfDocRef.current,
                  pageNum,
                  pagesDataRef.current[pageNum],
                  RENDER_SCALE
                )
          );
        }
        const bytes = await applyOverlaysToOriginalPdf(originalPdfBytesRef.current, overlayDataUrls);
        const blobUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = outputName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(blobUrl);
      } else {
        const pageDataUrls = [];
        for (let pageNum = 1; pageNum <= numPages; pageNum += 1) {
          if (pageNum === currentPage) {
            pageDataUrls.push(
              flattenToDataUrl(sourceType === "pdf" ? pdfCanvasRef.current : null, fabricRef.current)
            );
          } else {
            pageDataUrls.push(
              await renderSavedPageToDataUrl(pdfDocRef.current, pageNum, pagesDataRef.current[pageNum], RENDER_SCALE)
            );
          }
        }
        buildPdfFromPages(pageDataUrls).save(outputName);
      }
      setStatus("Document ready.");
    } catch (err) {
      setStatus("Export failed: " + err.message);
    } finally {
      documentOperationRef.current = false;
      setDocumentBusy(false);
    }
  };

  const clearPlacementTool = () => {
    placementToolRef.current = null;
    setPlacementTool(null);
  };

  const placeArmedTool = async (fCanvas, tool, point) => {
    clearPlacementTool();
    setFillToolsOpen(false);

    if (tool.kind === "image") {
      const image = await FabricImage.fromURL(tool.dataUrl);
      image.set({ left: point.x, top: point.y, originX: "center", originY: "center" });
      image.scaleToWidth(tool.targetWidth);
      fCanvas.add(image);
      fCanvas.setActiveObject(image);
      fCanvas.requestRenderAll();
      setStatus("Placed. Drag or resize it if needed.");
      return;
    }

    const text = new IText(tool.content, {
      left: point.x,
      top: point.y,
      originX: "center",
      originY: "center",
      fontSize: tool.fontSize || 24,
      fontFamily: "Arial, Helvetica, sans-serif",
      fill: "#000000",
    });
    fCanvas.add(text);
    fCanvas.setActiveObject(text);
    fCanvas.requestRenderAll();
    setStatus("Placed. Drag, resize, or double-click to edit.");

    if (tool.editImmediately) {
      text.enterEditing();
      text.selectAll();
      fCanvas.requestRenderAll();
    }
  };

  // --- Render a given page number with PDF.js, then mount a fresh Fabric
  // overlay on top of it (restoring that page's saved annotations, if any) ---
  const renderPage = async (pageNum, { fitToViewport = false } = {}) => {
    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    setPageDimensions({ width: viewport.width, height: viewport.height });
    if (fitToViewport) {
      setZoom(initialDocumentZoom({
        viewportWidth: window.innerWidth,
        documentWidth: viewport.width,
      }));
    }

    const pdfCanvas = pdfCanvasRef.current;
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    const ctx = pdfCanvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    await setupFabricOverlay(viewport.width, viewport.height, pageNum);
  };

  const setupFabricOverlay = async (width, height, pageNum) => {
    // Dispose the previous fabric instance when a new page/PDF is loaded
    fabricRef.current?.dispose();

    const fabricCanvasEl = fabricCanvasElRef.current;
    const fCanvas = new FabricCanvas(fabricCanvasEl, {
      selection: true,
    });
    fCanvas.setDimensions({ width, height });

    // Fabric doesn't auto-create a free-drawing brush — without this,
    // isDrawingMode is a no-op (mouse events silently do nothing).
    fCanvas.freeDrawingBrush = new PencilBrush(fCanvas);

    // Fabric wraps the given <canvas> in its own .canvas-container div and
    // moves it out of its original DOM position — so the "sit on top" style
    // needs to go on that wrapper, not on the canvas element itself.
    Object.assign(fCanvas.wrapperEl.style, { position: "absolute", top: "0", left: "0" });

    // Contextual floating toolbar: follow the selected text object around
    const syncActiveText = () => {
      const obj = fCanvas.getActiveObject();
      if (obj && obj.type === "i-text") {
        setActiveText(obj);
        setShowTextToolbar(true);
        setToolbarPosition(computeToolbarPosition(fCanvas, obj));
      } else {
        setShowTextToolbar(false);
      }
    };
    fCanvas.on("selection:created", syncActiveText);
    fCanvas.on("selection:updated", syncActiveText);
    fCanvas.on("selection:cleared", () => setShowTextToolbar(false));
    fCanvas.on("object:moving", (e) => {
      if (e.target?.type === "i-text") setToolbarPosition(computeToolbarPosition(fCanvas, e.target));
    });
    fCanvas.on("object:scaling", (e) => {
      if (e.target?.type === "i-text") setToolbarPosition(computeToolbarPosition(fCanvas, e.target));
    });

    // Undo/redo: snapshot the whole canvas after any meaningful mutation.
    // object:modified covers move/resize/rotate end and finished text edits;
    // path:created covers a freshly finished freehand stroke. Guarded by
    // isRestoringRef so undo/redo/page-restore don't record themselves.
    let isLoadingPageSnapshot = false;
    const pushHistory = () => {
      if (history.isRestoringRef.current || isLoadingPageSnapshot) return;
      history.push(fCanvas.toJSON());
    };
    fCanvas.on("object:added", pushHistory);
    fCanvas.on("object:removed", pushHistory);
    fCanvas.on("object:modified", pushHistory);
    fCanvas.on("path:created", pushHistory);

    // Eraser sub-tool (Draw mode): click or drag over a hand-drawn stroke to
    // remove it. Reads eraseModeRef (not the eraseMode closure) since these
    // handlers are attached once per canvas instance and eraseMode can
    // change afterwards without the canvas being recreated.
    const eraseIfPath = (opt) => {
      if (!eraseModeRef.current) return;
      if (opt.target?.type === "path") {
        fCanvas.remove(opt.target);
        fCanvas.requestRenderAll();
      }
    };
    fCanvas.on("mouse:down", (opt) => {
      const tool = placementToolRef.current;
      if (tool) {
        const point = fCanvas.getScenePoint(opt.e);
        placeArmedTool(fCanvas, tool, point).catch((error) => setStatus(`Placement failed: ${error.message}`));
        return;
      }
      eraseIfPath(opt);
    });
    fCanvas.on("mouse:move", (opt) => {
      if (opt.e.buttons) eraseIfPath(opt); // only while a button is held (dragging)
    });

    fCanvas.isDrawingMode = drawMode && !eraseMode;
    if (fCanvas.freeDrawingBrush) {
      fCanvas.freeDrawingBrush.width = strokeWidth;
      fCanvas.freeDrawingBrush.color = strokeColor;
    }

    fabricRef.current = fCanvas;

    const saved = pagesDataRef.current[pageNum];
    if (saved) {
      // loadFromJSON is Promise-based here — its 2nd argument is a per-object
      // "reviver" called once for EACH restored object, not a completion
      // callback. Using it as one (as an earlier version of this code did)
      // meant renderAll() ran mid-restore instead of after, so the canvas
      // never actually showed the restored objects despite them being added.
      const restoredState = await restoreCanvasSnapshot(fCanvas, saved, {
        onBeforeLoad: () => {
          isLoadingPageSnapshot = true;
        },
        onAfterLoad: () => {
          isLoadingPageSnapshot = false;
        },
      });
      history.reset(restoredState);
    } else {
      history.reset(fCanvas.toJSON());
    }
  };

  // --- Page navigation — snapshot the outgoing page's objects before
  // switching, so they're restored if the user comes back to it ---
  const goToPage = async (pageNum) => {
    if (documentOperationRef.current || pageNum === currentPage) return;
    documentOperationRef.current = true;
    setDocumentBusy(true);
    setDocumentReady(false);
    const fCanvas = fabricRef.current;
    if (fCanvas) {
      pagesDataRef.current[currentPage] = fCanvas.toJSON();
    }
    setStatus("Loading...");
    try {
      await renderPage(pageNum);
      setCurrentPage(pageNum);
      setStatus("Document ready.");
      setDocumentReady(true);
    } catch (err) {
      setStatus("Error: " + err.message);
    } finally {
      documentOperationRef.current = false;
      setDocumentBusy(false);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };
  const handleNextPage = () => {
    if (currentPage < numPages) goToPage(currentPage + 1);
  };

  // --- Zoom — a CSS transform on the canvas wrapper, not a re-render at a
  // different resolution. Toolbar position tracking (above) stays correct
  // because it reads the canvas's actual rendered box, post-transform. ---
  const handleZoomIn = () => setZoom((z) => Math.min(400, z + 25));
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25));

  // Drawing and object-placement are mutually exclusive — Fabric ignores
  // selection/placement clicks while isDrawingMode is on, so leaving it on
  // would make a freshly added text/signature/image effectively inert.
  const exitDrawMode = () => {
    if (!drawModeRef.current) return;
    const fCanvas = fabricRef.current;
    if (fCanvas) fCanvas.isDrawingMode = false;
    setDrawMode(false);
    setEraseMode(false);
  };

  const armPlacementTool = (tool, instruction) => {
    exitDrawMode();
    placementToolRef.current = tool;
    setPlacementTool(tool);
    setFillToolsOpen(false);
    setStatus(`${instruction} Press Esc to cancel.`);
  };

  const handleToggleDraw = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) {
      setStatus("Load a PDF first.");
      return;
    }
    // Read the toggle off the drawModeRef (kept in sync with live state via
    // effect above), not `drawMode` directly inside this closure — same
    // class of bug as the Bold/Italic drift: computing "next" from a stale
    // closure instead of ground truth can desync after enough rapid clicks.
    const next = !drawModeRef.current;
    clearPlacementTool();
    setFillToolsOpen(false);
    setDrawMode(next);
    if (!next) setEraseMode(false); // leaving draw mode always resets the eraser sub-tool
    fCanvas.isDrawingMode = next && !eraseModeRef.current;
    if (next) {
      fCanvas.discardActiveObject();
      setShowTextToolbar(false);
      if (fCanvas.freeDrawingBrush) {
        fCanvas.freeDrawingBrush.width = strokeWidth;
        fCanvas.freeDrawingBrush.color = strokeColor;
      }
    }
    fCanvas.requestRenderAll();
  };

  // Brush vs. eraser sub-tool, only meaningful while Draw mode is on.
  const handleToggleErase = (next) => {
    const fCanvas = fabricRef.current;
    setEraseMode(next);
    if (fCanvas) {
      fCanvas.isDrawingMode = drawModeRef.current && !next;
      fCanvas.discardActiveObject();
      fCanvas.requestRenderAll();
    }
  };

  // --- Undo/Redo — restore a previous canvas snapshot. isRestoringRef stops
  // the resulting object:added/removed events from being recorded as new
  // history entries (which would otherwise make undo un-doable). ---
  const restoreSnapshot = async (state) => {
    const fCanvas = fabricRef.current;
    if (!fCanvas || !state || documentOperationRef.current) return;
    documentOperationRef.current = true;
    setDocumentBusy(true);
    history.isRestoringRef.current = true;
    try {
      await restoreCanvasSnapshot(fCanvas, state);
    } catch (error) {
      setStatus(`Undo/redo failed: ${error.message}`);
      setDocumentReady(false);
    } finally {
      history.isRestoringRef.current = false;
      documentOperationRef.current = false;
      setDocumentBusy(false);
    }
    // The restored objects are new instances — any reference to the old
    // active object (and its floating toolbar) is now stale.
    setActiveText(null);
    setShowTextToolbar(false);
  };

  const handleUndo = () => {
    if (!documentOperationRef.current) void restoreSnapshot(history.undo());
  };
  const handleRedo = () => {
    if (!documentOperationRef.current) void restoreSnapshot(history.redo());
  };

  // --- Duplicate the selected object (any type — text, signature, image) ---
  const handleDuplicate = async () => {
    const fCanvas = fabricRef.current;
    const obj = fCanvas?.getActiveObject();
    if (!fCanvas || !obj || obj.isEditing) return;

    const cloned = await obj.clone();
    cloned.set({ left: (obj.left ?? 0) + 20, top: (obj.top ?? 0) + 20 });
    fCanvas.add(cloned);
    fCanvas.setActiveObject(cloned);
    fCanvas.requestRenderAll();

    if (cloned.type === "i-text") {
      setActiveText(cloned);
      setShowTextToolbar(true);
      setToolbarPosition(computeToolbarPosition(fCanvas, cloned));
    }
  };

  // --- Clear page — wipes every object but keeps the background image
  // (relevant for image-sourced documents). Low-stakes now that it's
  // trivially undo-able, so no confirmation prompt.
  //
  // clear() internally removes objects one at a time, which would otherwise
  // record one history entry per object (so undoing a 5-object clear would
  // take 5 presses of Ctrl+Z, not one). Suppress those and push a single
  // atomic "cleared" snapshot instead. ---
  const handleClearPage = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) return;
    const bg = fCanvas.backgroundImage;
    history.isRestoringRef.current = true;
    fCanvas.clear();
    if (bg) fCanvas.backgroundImage = bg;
    fCanvas.renderAll();
    history.isRestoringRef.current = false;
    history.push(fCanvas.toJSON());
    setActiveText(null);
    setShowTextToolbar(false);
  };

  // --- Form items are armed first, then placed exactly where the user clicks. ---
  const handleAddText = () => {
    if (!fabricRef.current) {
      setStatus("Load a PDF first.");
      return;
    }
    armPlacementTool(
      { kind: "text", source: "text", content: "Type here", fontSize: 24, editImmediately: true },
      "Click where you want to type."
    );
  };

  const handleDeleteText = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas || !activeText) return;
    fCanvas.remove(activeText);
    fCanvas.requestRenderAll();
    setShowTextToolbar(false);
  };

  const armImagePlacement = (dataUrl, targetWidth, label, source = label) => {
    armPlacementTool({ kind: "image", source, dataUrl, targetWidth }, `Click where you want to place the ${label}.`);
  };

  // --- "Add Signature" — draw once, place (and reuse) many times ---
  const handleAddSignature = () => {
    if (!fabricRef.current) {
      setStatus("Load a PDF first.");
      return;
    }
    if (savedSignature) {
      armImagePlacement(savedSignature, 160, "signature", "signature");
    } else {
      setSignatureMode("signature");
      setShowSignaturePad(true);
    }
  };

  const handleAddInitials = () => {
    if (!fabricRef.current) {
      setStatus("Load a PDF first.");
      return;
    }
    setFillToolsOpen(false);
    if (savedInitials) {
      armImagePlacement(savedInitials, 90, "initials", "initials");
    } else {
      setSignatureMode("initials");
      setShowSignaturePad(true);
    }
  };

  const handleEditInitials = () => {
    setFillToolsOpen(false);
    clearPlacementTool();
    setSignatureMode("initials");
    setShowSignaturePad(true);
  };

  const handleSignatureSave = async (dataUrl) => {
    const isInitials = signatureMode === "initials";
    try {
      await savePrivateData(isInitials ? ZENPDF_INITIALS_ID : ZENPDF_SIGNATURE_ID, dataUrl);
      if (isInitials) {
        setSavedInitials(dataUrl);
      } else {
        setSavedSignature(dataUrl);
      }
    } catch (error) {
      console.warn("ZenPDF could not save private drawing data.", error);
      setStatus("Signature could not be saved in this browser.");
      return;
    }
    setShowSignaturePad(false);
    armImagePlacement(
      dataUrl,
      isInitials ? 90 : 160,
      isInitials ? "initials" : "signature",
      isInitials ? "initials" : "signature"
    );
  };

  const handleToggleFillTools = () => {
    if (!fabricRef.current) {
      setStatus("Load a PDF first.");
      return;
    }
    exitDrawMode();
    clearPlacementTool();
    setFillToolsOpen((open) => !open);
  };

  const handleSelectMark = (content) => {
    const isSymbol = ["✓", "✕", "●"].includes(content);
    armPlacementTool(
      {
        kind: "text",
        source: isSymbol ? "mark" : "date",
        content,
        fontSize: isSymbol ? 28 : 20,
        editImmediately: false,
      },
      `Click where you want to place ${isSymbol ? "the mark" : "the date"}.`
    );
  };

  // --- "Add Image" — pick any picture from disk, place it once ---
  const imageInputRef = useRef(null);

  const handleAddImageClick = () => {
    if (!fabricRef.current) {
      setStatus("Load a PDF first.");
      return;
    }
    imageInputRef.current.click();
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file next time
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => armImagePlacement(reader.result, 200, "image", "image");
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col text-stone-100">
      <header className="flex items-center justify-end gap-4 border-b border-stone-800/50 bg-stone-900/40 px-6 py-4 backdrop-blur-sm">
        {interactiveFieldCount > 0 && (
          <span
            className="mr-auto rounded-full border border-sky-900/60 bg-sky-950/40 px-3 py-1.5 text-xs text-sky-300"
            title="Interactive fields are preserved in the exported PDF; use Quick Fill to place visible answers over them."
          >
            {interactiveFieldCount} form field{interactiveFieldCount === 1 ? "" : "s"} detected
          </span>
        )}
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!pdfLoaded || !documentReady || documentBusy}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-amber-600/20 transition-all hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={16} />
          Export PDF
        </button>
      </header>

      <div className="relative flex-1 overflow-auto">
      <Toolbar
        onAddText={handleAddText}
        onAddSignature={handleAddSignature}
        onAddImage={handleAddImageClick}
        fillToolsOpen={fillToolsOpen}
        onToggleFillTools={handleToggleFillTools}
        placementSource={placementTool?.source}
        drawMode={drawMode}
        onToggleDraw={handleToggleDraw}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onClearPage={handleClearPage}
      />

      <DrawPopover
        visible={drawMode}
        eraseMode={eraseMode}
        onToggleErase={handleToggleErase}
        strokeWidth={strokeWidth}
        strokeColor={strokeColor}
        onChangeWidth={setStrokeWidth}
        onChangeColor={setStrokeColor}
      />

      <FillToolsPopover
        visible={fillToolsOpen}
        onSelectMark={handleSelectMark}
        onAddInitials={handleAddInitials}
        onEditInitials={handleEditInitials}
        hasSavedInitials={hasSavedInitials}
      />

      <TextSettingsPanel
        visible={showTextToolbar}
        textObject={activeText}
        position={toolbarPosition}
        fabricCanvas={fabricRef.current}
        onDelete={handleDeleteText}
        onDuplicate={handleDuplicate}
      />

      {pdfLoaded && (
        <BottomBar
          currentPage={currentPage}
          numPages={numPages}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          zoom={zoom}
          onZoomOut={handleZoomOut}
          onZoomIn={handleZoomIn}
          navigationDisabled={documentBusy}
        />
      )}

      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16">
        {!pdfLoaded && (
          <>
            <div className="max-w-2xl text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-stone-100">Fill and sign application forms privately</h1>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                Add text, dates, checkmarks, initials, and a visual signature. Your document stays in this browser.
              </p>
            </div>
            <Dropzone onFileSelected={loadFile} />
            {status !== "Choose a PDF or image." && <p className="text-sm text-stone-400">{status}</p>}
          </>
        )}

        {pdfLoaded && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleChangePdf}
              disabled={documentBusy}
              className="text-sm text-stone-400 underline decoration-zinc-600 underline-offset-2 transition-all hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Change file
            </button>
            <span className="text-sm text-stone-400" role="status" aria-live="polite">{status}</span>

            {hasSavedSignature && (
              <button
                onClick={() => {
                  setSignatureMode("signature");
                  setShowSignaturePad(true);
                }}
                className="text-sm text-stone-400 underline decoration-zinc-600 underline-offset-2 transition-all hover:text-stone-200"
              >
                Redraw signature
              </button>
            )}
            {hasSavedInitials && (
              <button
                onClick={handleEditInitials}
                className="text-sm text-stone-400 underline decoration-zinc-600 underline-offset-2 transition-all hover:text-stone-200"
              >
                Redraw initials
              </button>
            )}
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          className="hidden"
          onChange={handleImageFileChange}
        />

        {/* PDF canvas (bottom) + Fabric canvas (top, transparent, same size) — a "sheet of paper"
            resting on the dark desk. Kept mounted at all times (just visually hidden pre-load) so
            the refs are always valid when a file is dropped/selected — no mount-timing races. */}
        <div
          data-testid="pdf-page-stage"
          className={`relative shrink-0 ${
            pdfLoaded ? "inline-block" : "hidden"
          }`}
          style={{
            width: pageDimensions.width * (zoom / 100),
            height: pageDimensions.height * (zoom / 100),
          }}
        >
          <div
            className="relative overflow-hidden rounded-xl border border-stone-800 bg-gray-50 shadow-2xl shadow-black/60"
            style={{
              width: pageDimensions.width,
              height: pageDimensions.height,
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top left",
            }}
          >
            <canvas ref={pdfCanvasRef} className="block" />
            <canvas ref={fabricCanvasElRef} className="absolute left-0 top-0" />
          </div>
        </div>
      </div>

      {showSignaturePad && (
        <SignaturePad
          mode={signatureMode}
          onSave={handleSignatureSave}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
      </div>
    </div>
  );
}
