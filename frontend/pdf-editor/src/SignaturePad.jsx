import { useEffect, useRef, useState } from "react";

// A simple draw-your-signature canvas. Mouse + touch supported.
export default function SignaturePad({ mode = "signature", onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);
  const label = mode === "initials" ? "initials" : "signature";

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onCancel]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e) => {
    setDrawing(true);
    setHasInk(true);
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stop = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  const save = () => {
    if (hasInk) onSave(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signature-pad-title"
        className="max-w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl"
      >
        <p id="signature-pad-title" className="mb-1 text-sm text-neutral-300">Draw your {label}</p>
        <p className="mb-3 max-w-md text-xs leading-relaxed text-neutral-500">
          This creates a visual mark for filling forms. It is not a certificate-backed secure digital signature.
        </p>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="h-auto max-w-full cursor-crosshair rounded-lg border border-neutral-700 bg-white"
          style={{ touchAction: "none", aspectRatio: "5 / 2" }}
          aria-label={`Draw ${label}`}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={stop}
        />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!hasInk}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save {label}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
