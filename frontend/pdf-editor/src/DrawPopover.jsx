import { Eraser, Pencil } from "lucide-react";
import useDelayedUnmount from "./useDelayedUnmount";

const STROKE_WIDTHS = [2, 4, 8, 16];

export default function DrawPopover({
  visible,
  eraseMode,
  onToggleErase,
  strokeWidth,
  strokeColor,
  onChangeWidth,
  onChangeColor,
}) {
  const shouldRender = useDelayedUnmount(visible, 200);
  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-40 left-1/2 z-30 flex -translate-x-1/2 flex-col gap-3 rounded-2xl border border-white/10 bg-neutral-900/90 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 md:bottom-auto md:left-24 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 ${
        visible ? "opacity-100" : "translate-y-2 opacity-0 md:-translate-x-2 md:translate-y-0"
      }`}
    >
      <div className="flex items-center gap-1.5 rounded-lg bg-white/5 p-1">
        <button
          type="button"
          onClick={() => onToggleErase(false)}
          title="Brush"
          aria-pressed={!eraseMode}
          className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs transition-all ${
            !eraseMode ? "bg-amber-600 text-white" : "text-neutral-300 hover:bg-white/10"
          }`}
        >
          <Pencil size={14} /> Brush
        </button>
        <button
          type="button"
          onClick={() => onToggleErase(true)}
          title="Eraser — click or drag over a stroke to remove it"
          aria-pressed={eraseMode}
          className={`flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs transition-all ${
            eraseMode ? "bg-amber-600 text-white" : "text-neutral-300 hover:bg-white/10"
          }`}
        >
          <Eraser size={14} /> Eraser
        </button>
      </div>

      {/* Width/color only apply to the brush — hide them in eraser mode to
          keep the popover from showing irrelevant controls */}
      {!eraseMode && (
        <>
          <div>
            <p className="mb-1.5 text-xs text-neutral-400">Stroke width</p>
            <div className="flex items-center gap-1.5">
              {STROKE_WIDTHS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChangeWidth(w)}
                  title={`${w}px`}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                    strokeWidth === w ? "bg-amber-600" : "bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <span
                    className="rounded-full bg-white"
                    style={{ width: Math.min(w, 16), height: Math.min(w, 16) }}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-neutral-400">Stroke color</p>
            <label
              className="relative block h-8 w-8 cursor-pointer overflow-hidden rounded-full border border-white/20"
              style={{ backgroundColor: strokeColor }}
            >
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => onChangeColor(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </>
      )}
    </div>
  );
}
