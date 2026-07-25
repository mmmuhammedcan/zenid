const GROUPS = [
  {
    field: "experience",
    title: "Experience",
    label: (item, index) =>
      [item.role, item.company].filter(Boolean).join(" — ") || `Experience ${index + 1}`,
  },
  {
    field: "projects",
    title: "Projects",
    label: (item, index) => item.name || `Project ${index + 1}`,
  },
];

function hasOverride(contentOverrides, field, itemId) {
  return Object.prototype.hasOwnProperty.call(
    contentOverrides[field]?.[itemId] || {},
    "description"
  );
}

function isIncluded(selectedItems, field, itemId) {
  if (!Object.prototype.hasOwnProperty.call(selectedItems, field)) return true;
  return selectedItems[field].includes(itemId);
}

export default function TargetedWording({
  resumeData,
  selectedItems,
  contentOverrides,
  onSet,
  onReset,
}) {
  return (
    <div className="space-y-6">
      <p className="text-xs leading-5 text-stone-500">
        Shared wording remains part of your profile. Targeted wording changes only this resume version and must stay factual.
      </p>
      {GROUPS.map(({ field, title, label }) => (
        <section key={field} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-400">{title}</h3>
          {resumeData[field].map((item, index) => {
            const itemLabel = label(item, index);
            const customized = hasOverride(contentOverrides, field, item.id);
            const targeted = contentOverrides[field]?.[item.id]?.description;
            const included = isIncluded(selectedItems, field, item.id);

            return (
              <div key={item.id} className="space-y-3 rounded-lg border border-stone-800 bg-stone-900/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-stone-300">{itemLabel}</p>
                  {!included && (
                    <span className="rounded-full bg-stone-800 px-2 py-0.5 text-[10px] font-medium text-stone-500">
                      Excluded from this resume
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Shared description</p>
                  <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-stone-400">
                    {item.description || "No shared description yet."}
                  </p>
                </div>
                {customized ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-amber-400">
                      Wording for this resume
                      <textarea
                        value={targeted}
                        onChange={(event) => onSet(field, item.id, event.target.value)}
                        aria-label={`Targeted wording for ${itemLabel}`}
                        rows={4}
                        className="mt-1.5 w-full resize-y rounded-lg border border-amber-700/50 bg-stone-950 px-3 py-2 text-sm leading-5 text-stone-200 outline-none focus:border-amber-500"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => onReset(field, item.id)}
                      aria-label={`Use shared wording for ${itemLabel}`}
                      className="text-xs font-medium text-stone-400 underline decoration-stone-700 underline-offset-4 hover:text-stone-200"
                    >
                      Use shared wording
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSet(field, item.id, item.description || "")}
                    aria-label={`Customize wording for ${itemLabel}`}
                    className="rounded-lg border border-stone-700 px-3 py-2 text-xs font-medium text-stone-300 hover:border-amber-600 hover:text-amber-400"
                  >
                    Customize for this resume
                  </button>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
