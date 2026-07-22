import { useState } from "react";
import { CalendarDays, Check, CircleDot, PencilLine, Signature, X } from "lucide-react";
import useDelayedUnmount from "./useDelayedUnmount";

function todayForInput() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export default function FillToolsPopover({
  visible,
  onSelectMark,
  onAddInitials,
  onEditInitials,
  hasSavedInitials,
}) {
  const shouldRender = useDelayedUnmount(visible, 200);
  const [date, setDate] = useState(todayForInput);
  if (!shouldRender) return null;

  const buttonClass =
    "flex h-9 items-center gap-2 rounded-lg px-3 text-left text-xs text-neutral-300 transition-colors hover:bg-white/10 hover:text-white";

  return (
    <div
      className={`fixed bottom-40 left-1/2 z-30 flex w-56 -translate-x-1/2 flex-col gap-1 rounded-2xl border border-white/10 bg-neutral-900/90 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 md:bottom-auto md:left-24 md:top-1/2 md:translate-x-0 md:-translate-y-1/2 ${
        visible ? "opacity-100" : "translate-y-2 opacity-0 md:-translate-x-2"
      }`}
      aria-label="Quick form fields"
    >
      <p className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wider text-neutral-500">Quick fill</p>
      <button type="button" onClick={() => onSelectMark("✓")} className={buttonClass}>
        <Check size={15} /> Checkmark
      </button>
      <button type="button" onClick={() => onSelectMark("✕")} className={buttonClass}>
        <X size={15} /> Crossmark
      </button>
      <button type="button" onClick={() => onSelectMark("●")} className={buttonClass}>
        <CircleDot size={15} /> Filled dot
      </button>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onAddInitials} className={`${buttonClass} min-w-0 flex-1`}>
          <Signature size={15} className="shrink-0" />
          {hasSavedInitials ? "Place initials" : "Create initials"}
        </button>
        {hasSavedInitials && (
          <button
            type="button"
            onClick={onEditInitials}
            title="Edit saved initials"
            aria-label="Edit saved initials"
            className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-xs text-amber-400 transition-colors hover:bg-amber-500/10 hover:text-amber-300"
          >
            <PencilLine size={14} /> Edit
          </button>
        )}
      </div>
      <div className="mt-1 border-t border-white/10 px-2 pt-2">
        <label className="text-xs text-neutral-400" htmlFor="zenpdf-quick-date">Date</label>
        <div className="mt-1 flex gap-1.5">
          <input
            id="zenpdf-quick-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="min-w-0 flex-1 rounded-md border border-neutral-700 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-200"
          />
          <button
            type="button"
            onClick={() => date && onSelectMark(date)}
            disabled={!date}
            title="Place date"
            aria-label="Place selected date"
            className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-40"
          >
            <CalendarDays size={14} />
          </button>
        </div>
      </div>
      <p className="px-3 pb-2 pt-1 text-[11px] leading-relaxed text-neutral-500">Choose an item, then click its position on the page.</p>
    </div>
  );
}
