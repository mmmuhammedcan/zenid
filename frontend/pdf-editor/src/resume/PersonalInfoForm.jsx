import { Field, TextAreaField } from "./Field";

export default function PersonalInfoForm({ data, onChange }) {
  const set = (key) => (e) => onChange({ ...data, [key]: e.target.value });

  return (
    <div className="flex flex-col gap-4">
      <Field label="Full name" value={data.fullName} onChange={set("fullName")} placeholder="Jane Doe" />
      <Field label="Title" value={data.title} onChange={set("title")} placeholder="Product Designer" />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" type="email" value={data.email} onChange={set("email")} placeholder="jane@email.com" />
        <Field label="Phone" value={data.phone} onChange={set("phone")} placeholder="+1 555 000 0000" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" value={data.city} onChange={set("city")} placeholder="Ankara" />
        <Field label="State" value={data.state} onChange={set("state")} placeholder="Ankara Province" />
      </div>
      <Field label="Portfolio" value={data.portfolio} onChange={set("portfolio")} placeholder="https://yourportfolio.com" />
      <Field label="LinkedIn" value={data.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." />
      <Field label="Github" value={data.github} onChange={set("github")} placeholder="https://github.com/..." />
      <TextAreaField
        label="Summary"
        value={data.summary}
        onChange={set("summary")}
        placeholder="A short, sharp summary of who you are."
      />
    </div>
  );
}
