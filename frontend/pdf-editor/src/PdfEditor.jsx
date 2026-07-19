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
import BottomBar from "./BottomBar";
import useHistory from "./useHistory";
import { A4_HEIGHT_PT, A4_WIDTH_PT, buildPdfFromPages, flattenToDataUrl, renderSavedPageToDataUrl } from "./pdfExport";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const SIGNATURE_STORAGE_KEY = "pdfEditorSignature";
const RENDER_SCALE = 1.5; // PDF.js render scale — independent of the CSS zoom applied on top

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

  const pdfCanvasRef = useRef(null); // the read-only canvas PDF.js renders into
  const fabricCanvasElRef = useRef(null); // the <canvas> element Fabric mounts on
  const fabricRef = useRef(null); // the fabric.Canvas instance
  const pdfDocRef = useRef(null); // the pdf.js document proxy (all pages)
  const pagesDataRef = useRef({}); // pageNumber -> fabric.toJSON(), so annotations survive page switches

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
    if (file.type === "application/pdf") {
      await loadPdfFile(file);
    } else if (file.type.startsWith("image/")) {
      await loadImageFile(file);
    } else {
      setStatus("Please choose a PDF, JPG, or PNG file.");
    }
  };

  const loadPdfFile = async (file) => {
    setStatus("Loading...");
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfDocRef.current = pdf;
      pagesDataRef.current = {};
      setSourceType("pdf");
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      await renderPage(1);
      setStatus("Document ready.");
      setPdfLoaded(true);
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  const loadImageFile = async (file) => {
    setStatus("Loading...");
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read the image file"));
        reader.readAsDataURL(file);
      });

      pdfDocRef.current = null;
      pagesDataRef.current = {};
      setSourceType("image");
      setNumPages(1);
      setCurrentPage(1);

      const width = A4_WIDTH_PT * RENDER_SCALE;
      const height = A4_HEIGHT_PT * RENDER_SCALE;

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

      setupFabricOverlay(width, height, 1);

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
      setPdfLoaded(true);
    } catch (err) {
      setStatus("Error: " + err.message);
    }
  };

  const handleChangePdf = () => {
    fabricRef.current?.dispose();
    fabricRef.current = null;
    pdfDocRef.current = null;
    pagesDataRef.current = {};
    setActiveText(null);
    setShowTextToolbar(false);
    setDrawMode(false);
    setCurrentPage(1);
    setNumPages(1);
    setZoom(100);
    setSourceType(null);
    setPdfLoaded(false);
    setStatus("Choose a PDF or image.");
  };

  // --- Export — flattens every page (PDF raster + fabric objects, or just
  // the fabric layer for an image-sourced document) into one PDF via jsPDF.
  // The current page is flattened live; other pages are rebuilt offscreen
  // from their saved JSON (see pagesDataRef) so nothing on screen is disturbed. ---
  const handleExportPdf = async () => {
    if (!pdfLoaded || !fabricRef.current) return;
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

      const pageDataUrls = [];
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
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

      buildPdfFromPages(pageDataUrls).save("document.pdf");
      setStatus("Document ready.");
    } catch (err) {
      setStatus("Export failed: " + err.message);
    }
  };

  // --- Render a given page number with PDF.js, then mount a fresh Fabric
  // overlay on top of it (restoring that page's saved annotations, if any) ---
  const renderPage = async (pageNum) => {
    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const pdfCanvas = pdfCanvasRef.current;
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;

    const ctx = pdfCanvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;

    setupFabricOverlay(viewport.width, viewport.height, pageNum);
  };

  const setupFabricOverlay = (width, height, pageNum) => {
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
    const pushHistory = () => {
      if (history.isRestoringRef.current) return;
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
    fCanvas.on("mouse:down", eraseIfPath);
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
      history.isRestoringRef.current = true;
      fCanvas.loadFromJSON(saved).then(() => {
        fCanvas.requestRenderAll();
        history.isRestoringRef.current = false;
        history.reset(fCanvas.toJSON());
      });
    } else {
      history.reset(fCanvas.toJSON());
    }
  };

  // --- Page navigation — snapshot the outgoing page's objects before
  // switching, so they're restored if the user comes back to it ---
  const goToPage = async (pageNum) => {
    const fCanvas = fabricRef.current;
    if (fCanvas) {
      pagesDataRef.current[currentPage] = fCanvas.toJSON();
    }
    setStatus("Loading...");
    try {
      await renderPage(pageNum);
      setCurrentPage(pageNum);
      setStatus("Document ready.");
    } catch (err) {
      setStatus("Error: " + err.message);
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
  const restoreSnapshot = (state) => {
    const fCanvas = fabricRef.current;
    if (!fCanvas || !state) return;
    history.isRestoringRef.current = true;
    fCanvas.loadFromJSON(state).then(() => {
      fCanvas.renderAll();
      history.isRestoringRef.current = false;
    });
    // The restored objects are new instances — any reference to the old
    // active object (and its floating toolbar) is now stale.
    setActiveText(null);
    setShowTextToolbar(false);
  };

  const handleUndo = () => restoreSnapshot(history.undo());
  const handleRedo = () => restoreSnapshot(history.redo());

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

  // --- "Add Text" — spawn a new IText object in the center ---
  const handleAddText = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) {
      setStatus("Load a PDF first.");
      return;
    }
    exitDrawMode();

    const text = new IText("Double-click to edit", {
      left: fCanvas.getWidth() / 2,
      top: fCanvas.getHeight() / 2,
      originX: "center",
      originY: "center",
      fontSize: 24,
      fontFamily: "Arial, Helvetica, sans-serif",
      fill: "#000000",
    });

    fCanvas.add(text);
    fCanvas.setActiveObject(text);
    fCanvas.requestRenderAll();
  };

  const handleDeleteText = () => {
    const fCanvas = fabricRef.current;
    if (!fCanvas || !activeText) return;
    fCanvas.remove(activeText);
    fCanvas.requestRenderAll();
    setShowTextToolbar(false);
  };

  // Shared by "Add Signature" and "Add Image" — both are just a picture
  // dropped centered onto the canvas, draggable/resizable like everything else.
  const placeImageOnCanvas = async (dataUrl, targetWidth) => {
    const fCanvas = fabricRef.current;
    if (!fCanvas) return;
    exitDrawMode();

    const img = await FabricImage.fromURL(dataUrl);
    img.set({
      left: fCanvas.getWidth() / 2,
      top: fCanvas.getHeight() / 2,
      originX: "center",
      originY: "center",
    });
    img.scaleToWidth(targetWidth);

    fCanvas.add(img);
    fCanvas.setActiveObject(img);
    fCanvas.requestRenderAll();
  };

  // --- "Add Signature" — draw once, place (and reuse) many times ---
  const handleAddSignature = () => {
    if (!fabricRef.current) {
      setStatus("Load a PDF first.");
      return;
    }
    const saved = localStorage.getItem(SIGNATURE_STORAGE_KEY);
    if (saved) {
      placeImageOnCanvas(saved, 160);
    } else {
      setShowSignaturePad(true);
    }
  };

  const handleSignatureSave = (dataUrl) => {
    localStorage.setItem(SIGNATURE_STORAGE_KEY, dataUrl);
    setShowSignaturePad(false);
    placeImageOnCanvas(dataUrl, 160);
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
    reader.onload = () => placeImageOnCanvas(reader.result, 200);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 px-6 py-4 backdrop-blur">
        <h1 className="text-lg font-semibold tracking-tight">ZenPDF</h1>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!pdfLoaded}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
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
        />
      )}

      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-16">
        {!pdfLoaded && (
          <>
            <Dropzone onFileSelected={loadFile} />
            {status !== "Choose a PDF or image." && <p className="text-sm text-neutral-400">{status}</p>}
          </>
        )}

        {pdfLoaded && (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleChangePdf}
              className="text-sm text-neutral-400 underline decoration-neutral-600 underline-offset-2 transition-all hover:text-neutral-200"
            >
              Change file
            </button>
            <span className="text-sm text-neutral-400">{status}</span>

            {localStorage.getItem(SIGNATURE_STORAGE_KEY) && (
              <button
                onClick={() => setShowSignaturePad(true)}
                className="text-sm text-neutral-400 underline decoration-neutral-600 underline-offset-2 transition-all hover:text-neutral-200"
              >
                Redraw signature
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
          className={`relative overflow-hidden rounded-xl border border-neutral-800 bg-gray-50 shadow-2xl shadow-black/60 ${
            pdfLoaded ? "inline-block" : "hidden"
          }`}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          <canvas ref={pdfCanvasRef} className="block" />
          <canvas ref={fabricCanvasElRef} className="absolute left-0 top-0" />
        </div>
      </div>

      {showSignaturePad && (
        <SignaturePad onSave={handleSignatureSave} onCancel={() => setShowSignaturePad(false)} />
      )}
      </div>
    </div>
  );
}
