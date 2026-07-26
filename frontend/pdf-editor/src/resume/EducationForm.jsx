import { Plus, Trash2 } from "lucide-react";
import { Field, DateField, CheckboxField } from "./Field";
import { emptyEducation } from "./data";
import { useI18n } from "../I18nContext.jsx";

export default function EducationForm({ items, onChange }) {
  const { t } = useI18n();
  const updateItem = (id, key, value) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, emptyEducation()]);
  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">{t("Entry")} {i + 1}</span>
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
            label="Institution"
            value={item.institution}
            onChange={(e) => updateItem(item.id, "institution", e.target.value)}
            placeholder="University or college name"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Degree"
              value={item.degree}
              onChange={(e) => updateItem(item.id, "degree", e.target.value)}
              placeholder="B.S., M.A., Ph.D., etc."
            />
            <Field
              label="Field of study"
              value={item.field}
              onChange={(e) => updateItem(item.id, "field", e.target.value)}
              placeholder="Major or field"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label="Start date"
              value={item.startDate}
              onChange={(e) => updateItem(item.id, "startDate", e.target.value)}
            />
            {!item.isCurrentlyStudying && (
              <DateField
                label="End date"
                value={item.endDate}
                onChange={(e) => updateItem(item.id, "endDate", e.target.value)}
              />
            )}
          </div>
          <CheckboxField
            label="I currently study here"
            checked={item.isCurrentlyStudying}
            onChange={(e) => updateItem(item.id, "isCurrentlyStudying", e.target.checked)}
          />
          <Field
            label="GPA (optional)"
            value={item.gpa}
            onChange={(e) => updateItem(item.id, "gpa", e.target.value)}
            placeholder="e.g., 3.8 or 3.8/4.0"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-700 py-2.5 text-sm text-stone-500 transition-colors hover:border-amber-600 hover:text-amber-600"
      >
        <Plus size={14} /> {t("Add education")}
      </button>
    </div>
  );
}
