import { Plus, Trash2 } from "lucide-react";
import { Field } from "./Field";
import { emptySkill } from "./data";
import { useI18n } from "../I18nContext.jsx";

export default function SkillsForm({ items, onChange }) {
  const { t } = useI18n();
  const updateItem = (id, key, value) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, emptySkill()]);
  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">{t("Skill Category")} {i + 1}</span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                title={t("Remove")}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <Field
            label="Category"
            value={item.category}
            onChange={(e) => updateItem(item.id, "category", e.target.value)}
            placeholder="e.g., Programming Languages, Tools & Technologies"
          />
          <Field
            label="Skills (comma-separated)"
            value={item.items}
            onChange={(e) => updateItem(item.id, "items", e.target.value)}
            placeholder="e.g., Python, Go, C++"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-700 py-2.5 text-sm text-stone-500 transition-colors hover:border-amber-600 hover:text-amber-600"
      >
        <Plus size={14} /> {t("Add skill category")}
      </button>
    </div>
  );
}
