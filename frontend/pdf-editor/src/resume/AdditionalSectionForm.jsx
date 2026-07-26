import { Field } from "./Field";
import RichTextEditor from "./RichTextEditor";
import { useI18n } from "../I18nContext.jsx";

export default function AdditionalSectionForm({ data, onChange }) {
  const { t } = useI18n();
  const setTitle = (e) => onChange({ ...data, title: e.target.value });
  const setContent = (html) => onChange({ ...data, content: html });
  const setLink = (e) => onChange({ ...data, link: e.target.value });

  return (
    <div className="flex flex-col gap-4">
      <Field
        label="Section title"
        value={data.title}
        onChange={setTitle}
        placeholder="e.g., Languages, Publications, Achievements"
      />

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-stone-400">{t("Additional Information")}</label>
        <RichTextEditor
          value={data.content}
          onChange={setContent}
          placeholder="Enter your custom content here"
        />
      </div>

      <Field
        label="Link (optional)"
        value={data.link}
        onChange={setLink}
        placeholder="https://..."
      />
    </div>
  );
}
