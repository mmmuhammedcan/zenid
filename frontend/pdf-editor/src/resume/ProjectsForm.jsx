import { Plus, Trash2 } from "lucide-react";
import { Field, TextAreaField, DateField, CheckboxField } from "./Field";
import { emptyProject } from "./data";

export default function ProjectsForm({ items, onChange }) {
  const updateItem = (id, key, value) => {
    onChange(items.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const addItem = () => onChange([...items, emptyProject()]);
  const removeItem = (id) => onChange(items.filter((item) => item.id !== id));

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-lg border border-stone-800 bg-stone-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-stone-400">Project {i + 1}</span>
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
            label="Project name"
            value={item.name}
            onChange={(e) => updateItem(item.id, "name", e.target.value)}
            placeholder="Project title"
          />
          <Field
            label="Tech stack"
            value={item.techStack || ""}
            onChange={(e) => updateItem(item.id, "techStack", e.target.value)}
            placeholder="Technologies used"
          />
          <Field
            label="Domain / function"
            value={item.domain || ""}
            onChange={(e) => updateItem(item.id, "domain", e.target.value)}
            placeholder="e.g., Finance, Healthcare, Computer Vision"
          />
          <div className="grid grid-cols-2 gap-3">
            <DateField
              label="Start date"
              value={item.startDate}
              onChange={(e) => updateItem(item.id, "startDate", e.target.value)}
            />
            {!item.isCurrentProject && (
              <DateField
                label="End date"
                value={item.endDate}
                onChange={(e) => updateItem(item.id, "endDate", e.target.value)}
              />
            )}
          </div>
          <CheckboxField
            label="This is a current project"
            checked={item.isCurrentProject}
            onChange={(e) => updateItem(item.id, "isCurrentProject", e.target.checked)}
          />
          <Field
            label="GitHub repository"
            value={item.githubUrl || ""}
            onChange={(e) => updateItem(item.id, "githubUrl", e.target.value)}
            placeholder="https://github.com/..."
          />
          <Field
            label="Live demo (Streamlit or website)"
            value={item.liveUrl || ""}
            onChange={(e) => updateItem(item.id, "liveUrl", e.target.value)}
            placeholder="https://your-project.streamlit.app"
          />
          <Field
            label="Other project link"
            value={item.link || ""}
            onChange={(e) => updateItem(item.id, "link", e.target.value)}
            placeholder="https://..."
          />
          <TextAreaField
            label="Description"
            value={item.description}
            onChange={(e) => updateItem(item.id, "description", e.target.value)}
            placeholder="Key features and accomplishments"
            rows={3}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-stone-700 py-2.5 text-sm text-stone-500 transition-colors hover:border-amber-600 hover:text-amber-600"
      >
        <Plus size={14} /> Add project
      </button>
    </div>
  );
}
