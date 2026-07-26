import { Plus, Trash2 } from "lucide-react";
import { Field } from "./Field";
import { emptyDomain } from "./data";
import { useI18n } from "../I18nContext.jsx";

export default function DomainForm({ items, onChange }) {
  const { t } = useI18n();
  const updateItem = (id, text) => {
    onChange(items.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const addItem = () => onChange([...items, emptyDomain()]);
  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-end gap-2">
          <div className="flex-1">
            <Field
              label={i === 0 ? "Area" : ""}
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              placeholder="e.g., Artificial Intelligence & Machine Learning"
            />
          </div>
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
              title={t("Remove")}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-700 py-2.5 text-sm text-stone-500 transition-colors hover:border-amber-600 hover:text-amber-600"
      >
        <Plus size={14} /> {t("Add area")}
      </button>
    </div>
  );
}
