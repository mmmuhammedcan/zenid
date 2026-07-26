import { ImagePlus, Trash2 } from "lucide-react";

export default function MediaField({ label, description, imageUrl, onSelect, onRemove, compact = false }) {
  const handleChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onSelect(file);
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-4">
      <div className={`flex gap-4 ${compact ? "items-center" : "flex-col"}`}>
        <div className={`${compact ? "h-16 w-24" : "aspect-video w-full"} shrink-0 overflow-hidden rounded-lg border border-stone-800 bg-stone-950`}>
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-700"><ImagePlus size={22} /></div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-200">{label}</p>
          {description && <p className="mt-1 text-xs leading-5 text-stone-400">{description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-lg border border-stone-700 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-amber-600 hover:text-amber-400">
              {imageUrl ? "Replace image" : "Choose image"}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="sr-only" />
            </label>
            {imageUrl && (
              <button type="button" onClick={onRemove} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs text-red-400 hover:bg-red-500/10">
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
