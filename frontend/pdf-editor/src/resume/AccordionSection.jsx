import { useState } from "react";
import { ChevronDown, ChevronUp, Check } from "lucide-react";

export default function AccordionSection({
  title,
  defaultOpen = false,
  complete = false,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reorderable = !!(onMoveUp || onMoveDown);

  return (
    <div className="border-b border-stone-800/50">
      <div className="flex w-full items-center justify-between py-4">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium text-stone-300 transition-colors hover:text-stone-100"
        >
          {title}
          {complete && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-600/20 text-amber-500">
              <Check size={11} strokeWidth={3} />
            </span>
          )}
        </button>

        {reorderable && (
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              disabled={!canMoveUp}
              title="Move section up"
              className="flex h-6 w-6 items-center justify-center rounded text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-200 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              disabled={!canMoveDown}
              title="Move section down"
              className="flex h-6 w-6 items-center justify-center rounded text-stone-500 transition-colors hover:bg-stone-800 hover:text-stone-200 disabled:pointer-events-none disabled:opacity-30"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-6 w-6 items-center justify-center text-stone-500"
          aria-label={open ? "Collapse section" : "Expand section"}
        >
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="pb-6">
          {children}
          <div className="mt-5 flex justify-end gap-2 border-t border-stone-800/50 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
            >
              <Check size={14} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
