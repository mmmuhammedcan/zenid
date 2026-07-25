import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, CopyPlus, Download, FolderOpen, RotateCcw, Save, Trash2 } from "lucide-react";
import AccordionSection from "./AccordionSection";
import PersonalInfoForm from "./PersonalInfoForm";
import DomainForm from "./DomainForm";
import SkillsForm from "./SkillsForm";
import ExperienceForm from "./ExperienceForm";
import ProjectsForm from "./ProjectsForm";
import AchievementsForm from "./AchievementsForm";
import CertificationsForm from "./CertificationsForm";
import EducationForm from "./EducationForm";
import AdditionalSectionForm from "./AdditionalSectionForm";
import ResumeItemSelection from "./ResumeItemSelection";
import TargetedWording from "./TargetedWording";
import ResumePreview from "./ResumePreview";
import ResumePdfPreview from "./ResumePdfPreview";
import { SECTION_LABELS, DEFAULT_SECTION_ORDER } from "./data";
import { getFilledSections } from "./resumeSections";
import { exportResumeToPdf } from "./resumePdfExport";

export default function BuilderView({
  template,
  resumeData,
  outputResumeData,
  accentColor,
  onChangeResumeData,
  onChangeResumeItemSelection,
  onSetContentOverride,
  onResetContentOverride,
  onChangeTemplate,
  resumes,
  activeResume,
  onSelectResume,
  onRenameResume,
  onDuplicateResume,
  onDeleteResume,
  onSaveProject,
  onOpenProject,
  onResetProject,
  projectNotice,
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [previewMode, setPreviewMode] = useState("design");
  const projectInputRef = useRef(null);
  const checklistUrl = `${import.meta.env.BASE_URL}assets/zenid-resume-checklist.pdf`;

  const setPersonalInfo = (personalInfo) => onChangeResumeData({ ...resumeData, personalInfo });
  const setDomains = (domains) => onChangeResumeData({ ...resumeData, domains });
  const setSkills = (skills) => onChangeResumeData({ ...resumeData, skills });
  const setExperience = (experience) => onChangeResumeData({ ...resumeData, experience });
  const setProjects = (projects) => onChangeResumeData({ ...resumeData, projects });
  const setAchievements = (achievements) => onChangeResumeData({ ...resumeData, achievements });
  const setCertifications = (certifications) => onChangeResumeData({ ...resumeData, certifications });
  const setEducation = (education) => onChangeResumeData({ ...resumeData, education });
  const setAdditionalSection = (additionalSection) => onChangeResumeData({ ...resumeData, additionalSection });

  const sectionOrder = resumeData.sectionOrder && resumeData.sectionOrder.length ? resumeData.sectionOrder : DEFAULT_SECTION_ORDER;

  const moveSection = (key, direction) => {
    const index = sectionOrder.indexOf(key);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return;
    const next = [...sectionOrder];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChangeResumeData({ ...resumeData, sectionOrder: next });
  };

  const filled = getFilledSections(resumeData);

  const SECTION_CONFIG = {
    domains: { complete: filled.domains.length > 0, render: () => <DomainForm items={resumeData.domains} onChange={setDomains} /> },
    skills: { complete: filled.skills.length > 0, render: () => <SkillsForm items={resumeData.skills} onChange={setSkills} /> },
    experience: { complete: filled.experience.length > 0, render: () => <ExperienceForm items={resumeData.experience} onChange={setExperience} /> },
    projects: { complete: filled.projects.length > 0, render: () => <ProjectsForm items={resumeData.projects} onChange={setProjects} /> },
    achievements: { complete: filled.achievements.length > 0, render: () => <AchievementsForm items={resumeData.achievements} onChange={setAchievements} /> },
    certifications: { complete: filled.certifications.length > 0, render: () => <CertificationsForm items={resumeData.certifications} onChange={setCertifications} /> },
    education: { complete: filled.education.length > 0, render: () => <EducationForm items={resumeData.education} onChange={setEducation} /> },
    additionalSection: { complete: filled.hasAdditional, render: () => <AdditionalSectionForm data={resumeData.additionalSection} onChange={setAdditionalSection} /> },
  };

  const handleExport = async () => {
    setExportError("");
    setExporting(true);
    try {
      await exportResumeToPdf({ template, resumeData: outputResumeData, accentColor });
    } catch (error) {
      console.error("Resume export failed", error);
      setExportError("We couldn't export your resume. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleProjectFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) onOpenProject(file);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-stone-800/50 bg-stone-900/60 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link
          to="/"
          title="Back to home"
          className="flex items-center justify-center rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-200"
          aria-label="Go to home"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-stone-600">/</span>
        <button
          type="button"
          onClick={onChangeTemplate}
          className="flex items-center gap-1.5 text-xs text-stone-400 transition-colors hover:text-stone-200"
        >
          <ArrowLeft size={14} /> Templates
        </button>
        <span className="text-stone-600">/</span>
        <select
          value={activeResume.id}
          onChange={(event) => onSelectResume(event.target.value)}
          aria-label="Active resume version"
          className="rounded-lg border border-stone-700 bg-stone-900 px-2 py-2 text-xs text-stone-200 outline-none transition-colors focus:border-amber-600"
        >
          {resumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.name || "Untitled Resume"}
            </option>
          ))}
        </select>
        <input
          value={activeResume.name}
          onChange={(event) => onRenameResume(event.target.value)}
          aria-label="Resume version name"
          placeholder="Resume name"
          className="min-w-32 flex-1 border-b border-transparent bg-transparent px-1 py-1 text-xs font-medium text-stone-300 outline-none transition-colors hover:border-stone-700 focus:border-amber-600"
        />
        <button
          type="button"
          onClick={onDuplicateResume}
          aria-label="Add resume variant"
          className="flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-amber-600 hover:bg-amber-600/10 hover:text-amber-400"
          title="Create another resume version using the same profile"
        >
          <CopyPlus size={15} /> <span className="hidden xl:inline">Add Resume Variant</span>
        </button>
        {resumes.length > 1 && (
          <button
            type="button"
            onClick={onDeleteResume}
            className="flex items-center justify-center rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            title="Delete current resume variant"
            aria-label="Delete current resume variant"
          >
            <Trash2 size={15} />
          </button>
        )}
        <input
          ref={projectInputRef}
          type="file"
          accept=".zenid,application/zip,application/json"
          onChange={handleProjectFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => projectInputRef.current?.click()}
          aria-label="Open ZenID project"
          className="flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-amber-600 hover:bg-amber-600/10 hover:text-amber-400"
          title="Open a private ZenID project locally"
        >
          <FolderOpen size={15} /> <span className="hidden xl:inline">Open Project</span>
        </button>
        <button
          type="button"
          onClick={onSaveProject}
          aria-label="Save ZenID project"
          className="flex items-center gap-1.5 rounded-lg border border-stone-700 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:border-amber-600 hover:bg-amber-600/10 hover:text-amber-400"
          title="Save an editable private project to this device"
        >
          <Save size={15} /> <span className="hidden xl:inline">Save Project</span>
        </button>
        <button
          type="button"
          onClick={onResetProject}
          className="flex items-center justify-center rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Clear local project"
          aria-label="Clear local project"
        >
          <RotateCcw size={15} />
        </button>
        <a
          href={checklistUrl}
          download="ZenID_Resume_Architecture_Playbook.pdf"
          className="flex items-center gap-2 rounded-lg border border-stone-700 px-3 py-2 text-sm font-medium text-stone-200 transition-colors hover:border-amber-600 hover:bg-amber-600/10 hover:text-amber-400"
          title="Download the resume checklist (PDF)"
        >
          <BookOpen size={16} />
          <span className="hidden sm:inline">Resume Checklist</span>
          <Download size={14} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} /> {exporting ? "Exporting…" : "Export PDF"}
        </button>
      </header>

      {projectNotice && (
        <div
          role={projectNotice.type === "error" ? "alert" : "status"}
          className={`border-b px-6 py-2 text-center text-sm ${
            projectNotice.type === "error"
              ? "border-red-900/50 bg-red-950/60 text-red-300"
              : "border-emerald-900/50 bg-emerald-950/40 text-emerald-300"
          }`}
        >
          {projectNotice.text}
        </div>
      )}

      {exportError && (
        <div role="alert" className="border-b border-red-900/50 bg-red-950/60 px-6 py-2 text-center text-sm text-red-300">
          {exportError}
        </div>
      )}

      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="w-full border-r border-stone-800/60 bg-stone-950 px-6 py-8 lg:w-[420px] lg:shrink-0 lg:overflow-y-auto">
          <AccordionSection
            title="Personal Information"
            defaultOpen
            complete={!!(resumeData.personalInfo.fullName || resumeData.personalInfo.email)}
          >
            <PersonalInfoForm data={resumeData.personalInfo} onChange={setPersonalInfo} />
          </AccordionSection>

          <AccordionSection title="Included in this resume" defaultOpen>
            <ResumeItemSelection
              resumeData={resumeData}
              selectedItems={activeResume.selectedItems}
              onChange={onChangeResumeItemSelection}
            />
          </AccordionSection>

          <AccordionSection title="Targeted wording">
            <TargetedWording
              resumeData={resumeData}
              selectedItems={activeResume.selectedItems}
              contentOverrides={activeResume.contentOverrides}
              onSet={onSetContentOverride}
              onReset={onResetContentOverride}
            />
          </AccordionSection>

          {sectionOrder.map((key, idx) => {
            const config = SECTION_CONFIG[key];
            if (!config) return null;
            return (
              <AccordionSection
                key={key}
                title={SECTION_LABELS[key]}
                complete={config.complete}
                onMoveUp={() => moveSection(key, -1)}
                onMoveDown={() => moveSection(key, 1)}
                canMoveUp={idx > 0}
                canMoveDown={idx < sectionOrder.length - 1}
              >
                {config.render()}
              </AccordionSection>
            );
          })}
        </div>

        <div className="flex flex-1 justify-center overflow-x-auto bg-transparent px-6 py-10">
          <div className="lg:sticky lg:top-10 lg:self-start">
            <div className="mb-3 flex max-w-[595px] items-start justify-between gap-4 text-xs text-stone-400">
              <div className="flex rounded-lg border border-stone-800 bg-stone-900/70 p-0.5" aria-label="Preview type">
                <button
                  type="button"
                  onClick={() => setPreviewMode("design")}
                  aria-pressed={previewMode === "design"}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    previewMode === "design" ? "bg-stone-700 text-stone-100" : "hover:text-stone-200"
                  }`}
                >
                  Design
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("pdf")}
                  aria-pressed={previewMode === "pdf"}
                  className={`rounded-md px-2.5 py-1 transition-colors ${
                    previewMode === "pdf" ? "bg-stone-700 text-stone-100" : "hover:text-stone-200"
                  }`}
                >
                  PDF export
                </button>
              </div>
              <span className="max-w-sm text-right">
                {previewMode === "pdf"
                  ? "Exact ATS PDF layout and page breaks, generated locally in your browser."
                  : template === "modern"
                    ? "The ATS PDF uses a single-column layout. Select PDF export to inspect the exact pages."
                    : "Live design preview. Select PDF export to inspect exact page breaks."}
              </span>
            </div>
            {previewMode === "pdf" ? (
              <ResumePdfPreview resumeData={outputResumeData} accentColor={accentColor} />
            ) : (
              <ResumePreview template={template} resumeData={outputResumeData} accentColor={accentColor} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
