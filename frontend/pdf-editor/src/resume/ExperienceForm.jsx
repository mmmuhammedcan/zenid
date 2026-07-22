import { Plus, Trash2 } from "lucide-react";
import { Field, TextAreaField, DateField, CheckboxField } from "./Field";
import { emptyExperience } from "./data";

export default function ExperienceForm({ items, onChange }) {
  const updateItem = (id, key, value) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, emptyExperience()]);
  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Entry {i + 1}</span>
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <Field
            label="Company"
            value={item.company}
            onChange={(e) => updateItem(item.id, "company", e.target.value)}
            placeholder="Company name"
          />
          <Field
            label="Role"
            value={item.role}
            onChange={(e) => updateItem(item.id, "role", e.target.value)}
            placeholder="Job title"
          />
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label="Start date"
              value={item.startDate}
              onChange={(e) => updateItem(item.id, "startDate", e.target.value)}
            />
            {!item.isCurrentlyWorking && (
              <DateField
                label="End date"
                value={item.endDate}
                onChange={(e) => updateItem(item.id, "endDate", e.target.value)}
              />
            )}
          </div>
          <CheckboxField
            label="I currently work here"
            checked={item.isCurrentlyWorking}
            onChange={(e) => updateItem(item.id, "isCurrentlyWorking", e.target.checked)}
          />
          <Field
            label="Tools / technologies used"
            value={item.tools}
            onChange={(e) => updateItem(item.id, "tools", e.target.value)}
            placeholder="e.g., Python, Docker, Apache Airflow"
          />
          <TextAreaField
            label="Description"
            value={item.description}
            onChange={(e) => updateItem(item.id, "description", e.target.value)}
            placeholder="Key achievements and responsibilities"
            rows={3}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-700 py-2.5 text-sm text-stone-500 transition-colors hover:border-amber-600 hover:text-amber-600"
      >
        <Plus size={14} /> Add experience
      </button>
    </div>
  );
}
