import { ImagePlus, Trash2 } from "lucide-react";

const MAX_GALLERY_IMAGES = 4;

export default function ProjectGalleryField({ label, assetIds, assetUrls, captions = {}, onAdd, onRemove, onCaptionChange }) {
  const ids = Array.isArray(assetIds) ? assetIds : [];
  const handleChange = (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_GALLERY_IMAGES - ids.length);
    event.target.value = "";
    if (files.length) onAdd(files);
  };

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-stone-200">{label}</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">Add up to four screenshots for the project detail gallery.</p>
        </div>
        <span className="text-xs text-stone-600">{ids.length}/{MAX_GALLERY_IMAGES}</span>
      </div>
      {ids.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {ids.map((id) => (
            <div key={id} className="overflow-hidden rounded-lg border border-stone-800 bg-stone-950">
              <div className="group relative aspect-video overflow-hidden">
                {assetUrls[id] && <img src={assetUrls[id]} alt="" className="h-full w-full object-cover" />}
                <button type="button" onClick={() => onRemove(id)} aria-label="Remove gallery image" className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/75 text-red-300 opacity-100 backdrop-blur transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 size={13} />
                </button>
              </div>
              <label className="block p-2">
                <span className="sr-only">Screenshot description</span>
                <textarea
                  rows={3}
                  maxLength={255}
                  value={captions[id] || ""}
                  onChange={(event) => onCaptionChange(id, event.target.value)}
                  placeholder="Explain what this screenshot demonstrates…"
                  className="w-full resize-none rounded-md border border-stone-800 bg-stone-900 px-2.5 py-2 text-xs leading-5 text-stone-200 outline-none focus:border-amber-600"
                />
                <span className="mt-1 block text-right text-[10px] text-stone-600">{String(captions[id] || "").length}/255</span>
              </label>
            </div>
          ))}
        </div>
      )}
      {ids.length < MAX_GALLERY_IMAGES && (
        <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-700 px-3 py-3 text-xs font-medium text-stone-400 transition-colors hover:border-amber-600 hover:text-amber-400">
          <ImagePlus size={15} /> Add gallery images
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleChange} className="sr-only" />
        </label>
      )}
    </div>
  );
}
