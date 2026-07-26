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

function includesItem(selectedItems, field, itemId) {
  if (!Object.prototype.hasOwnProperty.call(selectedItems, field)) return true;
  return selectedItems[field].includes(itemId);
}

export default function ResumeItemSelection({ resumeData, selectedItems, onChange }) {
  const { t } = useI18n();
  return (
    <div className="space-y-5">
      <p className="text-xs leading-5 text-stone-500">
        {t("Choose what appears in this resume version. Your profile and other resume versions stay unchanged.")}
      </p>
      {GROUPS.map(({ field, title, label }) => (
        <fieldset key={field} className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-stone-400">{t(title)}</legend>
          {resumeData[field].map((item, index) => {
            const itemLabel = label(item, index);
            return (
              <label
                key={item.id}
                className="flex items-start gap-3 rounded-lg border border-stone-800 bg-stone-900/40 px-3 py-2.5 text-sm text-stone-300"
              >
                <input
                  type="checkbox"
                  checked={includesItem(selectedItems, field, item.id)}
                  onChange={(event) => onChange(field, item.id, event.target.checked)}
                  aria-label={`Include ${itemLabel} in this resume`}
                  className="mt-0.5 h-4 w-4 rounded border-stone-700 bg-stone-900 accent-amber-600"
                />
                <span>{itemLabel}</span>
              </label>
            );
          })}
        </fieldset>
      ))}
    </div>
  );
}
import { useI18n } from "../I18nContext.jsx";
