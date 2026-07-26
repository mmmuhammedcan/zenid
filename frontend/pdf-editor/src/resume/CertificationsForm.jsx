import { Plus, Trash2 } from "lucide-react";
import { Field, TextAreaField } from "./Field";
import { emptyCertification } from "./data";
import { useI18n } from "../I18nContext.jsx";

export default function CertificationsForm({ items, onChange }) {
  const { t } = useI18n();
  const updateItem = (id, key, value) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, emptyCertification()]);
  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">{t("Certification")} {i + 1}</span>
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
            label="Certification title"
            value={item.title}
            onChange={(e) => updateItem(item.id, "title", e.target.value)}
            placeholder="e.g., AWS Cloud Practitioner"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Issuer"
              value={item.issuer}
              onChange={(e) => updateItem(item.id, "issuer", e.target.value)}
              placeholder="e.g., AWS, Google, Coursera"
            />
            <Field
              label="Date issued"
              value={item.date}
              onChange={(e) => updateItem(item.id, "date", e.target.value)}
              placeholder="e.g., Mar 2026 or YYYY-MM"
            />
          </div>
          <Field
            label="Certificate link"
            value={item.link || ""}
            onChange={(e) => updateItem(item.id, "link", e.target.value)}
            placeholder="https://..."
          />
          <Field
            label="Credential ID"
            value={item.credentialId || ""}
            onChange={(e) => updateItem(item.id, "credentialId", e.target.value)}
            placeholder="Optional verification ID"
          />
          <TextAreaField
            label="What this credential demonstrates"
            value={item.description || ""}
            onChange={(e) => updateItem(item.id, "description", e.target.value)}
            placeholder="A short description of the skills or work covered."
            rows={3}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-700 py-2.5 text-sm text-stone-500 transition-colors hover:border-amber-600 hover:text-amber-600"
      >
        <Plus size={14} /> {t("Add certification")}
      </button>
    </div>
  );
}
