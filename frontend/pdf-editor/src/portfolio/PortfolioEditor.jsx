import { ArrowDown, ArrowUp, Eye, EyeOff, FileUp, GripVertical, LockKeyhole, Trash2 } from "lucide-react";
import { CheckboxField, Field, TextAreaField } from "../resume/Field";
import SkillsForm from "../resume/SkillsForm";
import ExperienceForm from "../resume/ExperienceForm";
import CertificationsForm from "../resume/CertificationsForm";
import MediaField from "./MediaField";
import PortfolioProjectsEditor from "./PortfolioProjectsEditor";

const ACCENTS = ["#d97706", "#2563eb", "#059669", "#7c3aed", "#e11d48"];
const ORDERABLE_SECTIONS = [
  { id: "about", label: "About & skills", description: "Introduction, location, and skill tags" },
  { id: "experience", label: "Experience", description: "Professional timeline" },
  { id: "projects", label: "Projects", description: "Selected work and case studies" },
  { id: "certifications", label: "Certificates", description: "Credentials and verification links" },
  { id: "contact", label: "Contact", description: "Enabled public contact details" },
];

function EditorSection({ title, description, children }) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-stone-100">{title}</h2>
        {description && <p className="mt-1 text-sm leading-6 text-stone-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function VisibilityRow({ label, description, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-800 bg-stone-900/50 p-4">
      <span>
        <span className="block text-sm font-medium text-stone-200">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-stone-400">{description}</span>
      </span>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${checked ? "bg-amber-600/15 text-amber-500" : "bg-stone-800 text-stone-500"}`}>
        {checked ? <Eye size={16} /> : <EyeOff size={16} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}

function SectionOrderEditor({ sectionOrder = [], onChange }) {
  const knownIds = new Set(ORDERABLE_SECTIONS.map(({ id }) => id));
  const knownOrder = [
    ...sectionOrder.filter((id) => knownIds.has(id)),
    ...ORDERABLE_SECTIONS.map(({ id }) => id).filter((id) => !sectionOrder.includes(id)),
  ];
  const futureSections = sectionOrder.filter((id) => !knownIds.has(id));

  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= knownOrder.length) return;
    const next = [...knownOrder];
    [next[index], next[target]] = [next[target], next[index]];
    onChange([...next, ...futureSections]);
  };

  return (
    <div className="grid gap-2">
      {knownOrder.map((id, index) => {
        const section = ORDERABLE_SECTIONS.find((item) => item.id === id);
        return (
          <div key={id} className="flex items-center gap-3 rounded-xl border border-stone-800 bg-stone-900/50 p-3">
            <GripVertical size={16} className="shrink-0 text-stone-600" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-stone-200">{section.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-stone-400">{section.description}</span>
            </span>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${section.label} up`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-800 text-stone-400 transition-colors hover:border-stone-700 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === knownOrder.length - 1}
                aria-label={`Move ${section.label} down`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-800 text-stone-400 transition-colors hover:border-stone-700 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PublishControls({ label, field, items, portfolio, onPortfolioChange }) {
  const namedItems = items.filter((item) => String(item.name || item.title || item.role || item.company || "").trim());
  if (!namedItems.length) return null;
  const hidden = new Set(portfolio.hiddenItems[field] || []);
  const toggle = (id, published) => {
    const next = new Set(hidden);
    if (published) next.delete(id);
    else next.add(id);
    onPortfolioChange({ hiddenItems: { ...portfolio.hiddenItems, [field]: [...next] } });
  };
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-900/30 p-4">
      <p className="text-sm font-semibold text-stone-300">Publish {label}</p>
      <p className="mt-1 text-xs text-stone-400">Hidden items remain safely stored in your private profile.</p>
      <div className="mt-3 grid gap-2">
        {namedItems.map((item) => {
          const name = item.name || item.title || [item.role, item.company].filter(Boolean).join(" — ");
          return <CheckboxField key={item.id} label={name} checked={!hidden.has(item.id)} onChange={(event) => toggle(item.id, event.target.checked)} />;
        })}
      </div>
    </div>
  );
}

export default function PortfolioEditor({
  activeStep,
  project,
  assetUrls,
  onProfileChange,
  onPortfolioChange,
  onMediaSelect,
  onMediaRemove,
}) {
  const { profile, portfolio } = project;
  const info = profile.personalInfo;
  const setInfo = (key) => (event) => onProfileChange({ personalInfo: { ...info, [key]: event.target.value } });
  const setPortfolio = (key) => (event) => onPortfolioChange({ [key]: event.target.value });
  const setVisible = (key) => (event) => onPortfolioChange({
    visibleSections: { ...portfolio.visibleSections, [key]: event.target.checked },
  });
  const setContact = (key) => (event) => onPortfolioChange({
    contactPrivacy: { ...portfolio.contactPrivacy, [key]: event.target.checked },
  });

  if (activeStep === "profile") {
    return (
      <EditorSection title="Profile" description="Shared facts update your canonical ZenID profile. The longer About text belongs only to this portfolio.">
        <div className="grid gap-4">
          <MediaField
            label="Profile photo"
            description="Stored only in this browser and included when you save a private ZenID Project. JPEG, PNG, or WebP; maximum 8 MB."
            imageUrl={assetUrls[portfolio.media.profileImageId]}
            onSelect={(file) => onMediaSelect({ kind: "profile-image", file })}
            onRemove={() => onMediaRemove({ kind: "profile-image" })}
          />
          <Field label="Full name" value={info.fullName} onChange={setInfo("fullName")} placeholder="Jane Doe" />
          <Field label="Professional title" value={info.title} onChange={setInfo("title")} placeholder="Product designer and researcher" />
          <Field label="Availability" value={portfolio.availability} onChange={setPortfolio("availability")} placeholder="Open to opportunities" />
          <TextAreaField label="About" rows={7} value={portfolio.about} onChange={setPortfolio("about")} placeholder="Tell visitors what you do, what you care about, and the kind of problems you solve." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" value={info.city} onChange={setInfo("city")} placeholder="Ankara" />
            <Field label="Region" value={info.state} onChange={setInfo("state")} placeholder="Ankara Province" />
          </div>
        </div>
      </EditorSection>
    );
  }

  if (activeStep === "skills") {
    return (
      <div className="space-y-10">
        <EditorSection title="Skills" description="Use categories to keep the shared résumé data structured; the portfolio turns them into concise skill tags.">
          <SkillsForm items={profile.skills} onChange={(skills) => onProfileChange({ skills })} />
        </EditorSection>
        <EditorSection title="Experience" description="These entries remain shared with Resume Builder and update both tools.">
          <div className="space-y-6">
            <ExperienceForm items={profile.experience} onChange={(experience) => onProfileChange({ experience })} />
            <PublishControls label="experience" field="experience" items={profile.experience} portfolio={portfolio} onPortfolioChange={onPortfolioChange} />
          </div>
        </EditorSection>
      </div>
    );
  }

  if (activeStep === "projects") {
    return (
      <EditorSection title="Projects" description="Everything for a project is edited in one place: content, thumbnail, screenshots, descriptions, links, and visibility.">
        <PortfolioProjectsEditor
          projects={profile.projects}
          portfolio={portfolio}
          assetUrls={assetUrls}
          onProjectsChange={(projects) => onProfileChange({ projects })}
          onPortfolioChange={onPortfolioChange}
          onMediaSelect={onMediaSelect}
          onMediaRemove={onMediaRemove}
        />
      </EditorSection>
    );
  }

  if (activeStep === "certificates") {
    return (
      <EditorSection title="Certificates" description="Add verifiable credentials now. Certificate images will use local `.zenid` asset storage rather than browser text storage.">
        <div className="space-y-8">
          <CertificationsForm items={profile.certifications} onChange={(certifications) => onProfileChange({ certifications })} />
          <PublishControls label="certificates" field="certifications" items={profile.certifications} portfolio={portfolio} onPortfolioChange={onPortfolioChange} />
          <div>
            <h3 className="mb-3 text-sm font-semibold text-stone-300">Certificate images</h3>
            <div className="grid gap-3">
              {profile.certifications.filter((item) => String(item.title || "").trim()).map((item) => {
                const assetId = portfolio.media.certificateImageIds[item.id];
                return (
                  <MediaField
                    key={item.id}
                    compact
                    label={item.title}
                    description="Use a clear certificate image without unrelated private details."
                    imageUrl={assetUrls[assetId]}
                    onSelect={(file) => onMediaSelect({ kind: "certificate-image", itemId: item.id, file })}
                    onRemove={() => onMediaRemove({ kind: "certificate-image", itemId: item.id })}
                  />
                );
              })}
              {!profile.certifications.some((item) => String(item.title || "").trim()) && <p className="text-xs text-stone-500">Name a certificate above to attach its image.</p>}
            </div>
          </div>
        </div>
      </EditorSection>
    );
  }

  return (
    <div className="space-y-9">
      <EditorSection title="Style" description="One polished template first. Theme and accent choices change presentation without touching your professional facts.">
        <div className="grid grid-cols-2 gap-3">
          {["dark", "light"].map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => onPortfolioChange({ theme })}
              className={`rounded-xl border p-4 text-left text-sm capitalize transition-colors ${portfolio.theme === theme ? "border-amber-600 bg-amber-600/10 text-amber-400" : "border-stone-800 bg-stone-900/50 text-stone-400 hover:border-stone-700"}`}
            >
              <span className={`mb-3 block h-12 rounded-lg ${theme === "dark" ? "bg-stone-950" : "bg-stone-100"}`} />
              {theme} theme
            </button>
          ))}
        </div>
        <div className="mt-5">
          <p className="mb-3 text-sm font-medium text-stone-400">Accent color</p>
          <div className="flex flex-wrap gap-3">
            {ACCENTS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onPortfolioChange({ accentColor: color })}
                aria-label={`Use ${color} as portfolio accent`}
                aria-pressed={portfolio.accentColor === color}
                className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${portfolio.accentColor === color ? "border-white" : "border-transparent"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </EditorSection>

      <EditorSection title="Résumé and introduction" description="Choose whether the portfolio offers a locally generated résumé and an optional introduction video.">
        <div className="grid gap-4">
          <CheckboxField
            label="Show résumé download"
            checked={portfolio.resume.enabled}
            onChange={(event) => onPortfolioChange({ resume: { ...portfolio.resume, enabled: event.target.checked } })}
          />
          {portfolio.resume.enabled && (
            <>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-stone-400">Résumé source</span>
                <select value={portfolio.resume.source || "generated"} onChange={(event) => onPortfolioChange({ resume: { ...portfolio.resume, source: event.target.value } })} className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200">
                  <option value="generated">Generate from Resume Builder</option>
                  <option value="uploaded">Upload an existing PDF</option>
                </select>
              </label>
              {portfolio.resume.source === "uploaded" ? (
                <div className="rounded-xl border border-stone-800 bg-stone-900/40 p-4">
                  <p className="text-sm font-medium text-stone-200">Uploaded résumé PDF</p>
                  <p className="mt-1 text-xs leading-5 text-stone-500">Stored locally and included in your private `.zenid` backup. Maximum 8 MB.</p>
                  {portfolio.resume.uploadedAssetId ? (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-stone-800 bg-stone-950 px-3 py-3">
                      <span className="min-w-0 truncate text-xs text-stone-300">{portfolio.resume.uploadedFileName || "Uploaded résumé.pdf"}</span>
                      <button type="button" onClick={() => onMediaRemove({ kind: "resume-pdf" })} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10" aria-label="Remove uploaded résumé"><Trash2 size={14} /></button>
                    </div>
                  ) : (
                    <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-stone-700 px-3 py-4 text-xs font-medium text-stone-400 hover:border-amber-600 hover:text-amber-400">
                      <FileUp size={16} /> Upload résumé PDF
                      <input type="file" accept="application/pdf,.pdf" onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (file) onMediaSelect({ kind: "resume-pdf", file });
                      }} className="sr-only" />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-stone-400">Résumé version</span>
                  <select value={portfolio.resume.resumeId || project.resumes[0]?.id || ""} onChange={(event) => onPortfolioChange({ resume: { ...portfolio.resume, resumeId: event.target.value } })} className="rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200">
                    {project.resumes.map((resume) => <option key={resume.id} value={resume.id}>{resume.name || "Untitled Resume"}</option>)}
                  </select>
                </label>
              )}
            </>
          )}
          <Field label="Introduction video" value={portfolio.introVideoUrl || ""} onChange={setPortfolio("introVideoUrl")} placeholder="YouTube or Vimeo URL" />
        </div>
      </EditorSection>

      <EditorSection title="Visible sections" description="Hiding a section changes only the portfolio. It never deletes the underlying profile data.">
        <div className="grid gap-2">
          {[
            ["about", "About", "Introduction and location"],
            ["skills", "Skills", "Skill tags inside the About section"],
            ["experience", "Experience", "Professional timeline"],
            ["projects", "Projects", "Selected work cards"],
            ["certifications", "Certificates", "Credentials and verification links"],
            ["contact", "Contact", "One dedicated contact section for enabled public details"],
          ].map(([key, label, description]) => (
            <VisibilityRow key={key} label={label} description={description} checked={portfolio.visibleSections[key]} onChange={setVisible(key)} />
          ))}
        </div>
      </EditorSection>

      <EditorSection title="Section order" description="Choose how the main portfolio sections flow after the fixed introduction. The navigation follows the same order.">
        <SectionOrderEditor
          sectionOrder={portfolio.sectionOrder}
          onChange={(sectionOrder) => onPortfolioChange({ sectionOrder })}
        />
      </EditorSection>

      <EditorSection title="Public contact details" description="All contacts begin private. Enable only what you intentionally want visitors to see.">
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-600/20 bg-amber-600/5 p-4 text-xs leading-5 text-amber-200/80">
          <LockKeyhole size={17} className="mt-0.5 shrink-0 text-amber-500" />
          This controls the preview only for now. Static ZIP export will add a final publication review before any public files are created.
        </div>
        <div className="grid gap-3">
          <TextAreaField label="Contact introduction" value={portfolio.contactMessage || ""} onChange={setPortfolio("contactMessage")} rows={3} placeholder="Invite visitors to get in touch." />
          <Field label="Email" type="email" value={info.email} onChange={setInfo("email")} placeholder="you@example.com" />
          <CheckboxField label="Show email publicly" checked={portfolio.contactPrivacy.email} onChange={setContact("email")} />
          <Field label="Phone" value={info.phone} onChange={setInfo("phone")} placeholder="+90 ..." />
          <CheckboxField label="Show phone publicly" checked={portfolio.contactPrivacy.phone} onChange={setContact("phone")} />
          <Field label="LinkedIn" value={info.linkedin} onChange={setInfo("linkedin")} placeholder="linkedin.com/in/..." />
          <CheckboxField label="Show LinkedIn publicly" checked={portfolio.contactPrivacy.linkedin} onChange={setContact("linkedin")} />
          <Field label="GitHub" value={info.github} onChange={setInfo("github")} placeholder="github.com/..." />
          <CheckboxField label="Show GitHub publicly" checked={portfolio.contactPrivacy.github} onChange={setContact("github")} />
        </div>
      </EditorSection>
    </div>
  );
}
