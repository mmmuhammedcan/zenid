export function Field({ label, type, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-400">{label}</span>
      <input
        type={type || "text"}
        {...props}
        className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none transition-colors focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20"
      />
    </label>
  );
}

export function DateField({ label, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-400">{label}</span>
      <input
        type="month"
        {...props}
        style={{ colorScheme: 'dark' }}
        className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none transition-colors focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20"
      />
    </label>
  );
}

export function TextAreaField({ label, rows = 4, ...props }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-stone-400">{label}</span>
      <textarea
        rows={rows}
        {...props}
        className="resize-none rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none transition-colors focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20"
      />
    </label>
  );
}

export function CheckboxField({ label, ...props }) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        {...props}
        className="h-4 w-4 rounded border-stone-800 bg-stone-900 text-amber-600 accent-amber-600"
      />
      <span className="text-sm text-stone-400">{label}</span>
    </label>
  );
}
