import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

// A minimal styled listbox to replace native <select> elements — click to
// open, click an option (or outside) to close. Pure presentation; the caller
// still owns the actual value/onChange logic.
export default function Dropdown({ value, options, onChange, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-neutral-100 transition-colors hover:border-neutral-600"
      >
        <span className="truncate">{current?.label ?? "—"}</span>
        <ChevronDown size={14} className={`shrink-0 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 max-h-60 w-full min-w-max overflow-auto rounded-lg border border-neutral-700 bg-neutral-800 shadow-xl">
          {options.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`block w-full whitespace-nowrap px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-700 ${
                opt.value === value ? "bg-neutral-700 text-white" : "text-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
