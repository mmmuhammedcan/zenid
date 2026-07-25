import { useEffect, useState } from "react";
import TemplateSelector from "./TemplateSelector";
import BuilderView from "./BuilderView";
import {
  applyResumeData,
  createEmptyProject,
  deleteResumeDocument,
  duplicateResumeDocument,
  getResumeDocument,
  loadProjectFromBrowserStorage,
  materializeResumeEditorData,
  materializeResumeData,
  resetResumeContentOverride,
  saveProjectToBrowserStorage,
  setResumeContentOverride,
  updateResumeDocument,
  updateResumeItemSelection,
} from "./projectSchema.js";
import { downloadProjectFile, readProjectBundleFile } from "./projectFile.js";
import { commitProjectToBrowser, openProjectFileAtomically } from "./projectImport.js";
import { buildResumePdf } from "./resumePdfExport.js";
import {
  BROWSER_AUTOSAVE_UNAVAILABLE,
  classifyProjectOpenError,
  noticeTextForError,
  PROJECT_SAVE_FAILED,
} from "./projectOpenRecovery.js";
import { getProjectMediaAssets, importMediaAssets, mediaRecordsToArchiveAssets } from "../portfolio/assetStore.js";

function projectHasUserContent(project) {
  if (Object.values(project.profile.personalInfo || {}).some((value) => String(value || "").trim())) return true;
  if (project.resumes.length > 1 || project.resumes.some((resume) => resume.template)) return true;

  return ["domains", "skills", "experience", "projects", "achievements", "certifications", "education"].some(
    (field) =>
      (project.profile[field] || []).some((item) =>
        Object.entries(item).some(
          ([key, value]) =>
            key !== "id" &&
            !(field === "skills" && key === "category" && value === "Programming Languages") &&
            value !== false &&
            String(value || "").trim()
        )
      )
  );
}

export default function ResumeApp() {
  const [initialProject] = useState(loadProjectFromBrowserStorage);
  const [project, setProject] = useState(initialProject);
  const [activeResumeId, setActiveResumeId] = useState(initialProject.resumes[0].id);
  const [projectNotice, setProjectNotice] = useState(null);

  const activeResume = getResumeDocument(project, activeResumeId);
  const resumeData = materializeResumeEditorData(project, activeResume.id);
  const outputResumeData = materializeResumeData(project, activeResume.id);

  useEffect(() => {
    try {
      saveProjectToBrowserStorage(project);
    } catch (error) {
      console.warn("ZenID could not autosave this project in the browser.", error);
      setProjectNotice({ type: "error", text: BROWSER_AUTOSAVE_UNAVAILABLE });
    }
  }, [project]);

  const updateActiveResume = (updates) => {
    setProject((current) => updateResumeDocument(current, activeResume.id, updates));
  };

  const navigateWithin = (change) => {
    setProjectNotice(null);
    change();
  };

  const handleResumeDataChange = (nextResumeData) => {
    setProject((current) => applyResumeData(current, activeResume.id, nextResumeData));
  };

  const handleResumeItemSelection = (field, itemId, included) => {
    setProject((current) =>
      updateResumeItemSelection(current, activeResume.id, field, itemId, included)
    );
  };

  const handleSetContentOverride = (field, itemId, description) => {
    setProject((current) =>
      setResumeContentOverride(current, activeResume.id, field, itemId, description)
    );
  };

  const handleResetContentOverride = (field, itemId) => {
    setProject((current) =>
      resetResumeContentOverride(current, activeResume.id, field, itemId)
    );
  };

  const handleOpenProject = async (file) => {
    if (
      projectHasUserContent(project) &&
      !window.confirm("Open this ZenID project? Your current browser workspace will be replaced. Save a backup first if needed.")
    ) {
      return;
    }

    try {
      await openProjectFileAtomically(file, {
        readBundle: readProjectBundleFile,
        persistAssets: importMediaAssets,
        commitProject: commitProjectToBrowser({
          persistProject: saveProjectToBrowserStorage,
          applyProject: (nextProject) => {
            setProject(nextProject);
            setActiveResumeId(nextProject.resumes[0].id);
          },
        }),
      });
      setProjectNotice({ type: "success", text: "Project opened locally. No file was uploaded." });
    } catch (error) {
      console.error("ZenID project import failed", error);
      setProjectNotice({
        type: "error",
        recovery: classifyProjectOpenError(error),
      });
    }
  };

  const handleSaveProject = async () => {
    try {
      setProjectNotice({ type: "success", text: "Preparing your private project and resume PDFs locally…" });
      const generatedPdfs = [];
      for (const resume of project.resumes) {
        const resumeDataForDocument = materializeResumeData(project, resume.id);
        const pdf = await buildResumePdf({
          resumeData: resumeDataForDocument,
          accentColor: resume.accentColor,
        });
        generatedPdfs.push({
          resumeId: resume.id,
          bytes: new Uint8Array(pdf.output("arraybuffer")),
        });
      }
      const mediaRecords = await getProjectMediaAssets(project);
      const assets = await mediaRecordsToArchiveAssets(mediaRecords);
      downloadProjectFile(project, { generatedPdfs, assets });
      setProjectNotice({
        type: "success",
        text: `Private ZenID project saved with ${generatedPdfs.length} generated resume PDF${generatedPdfs.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      console.error("ZenID project export failed", error);
      setProjectNotice({ type: "error", text: noticeTextForError(error, PROJECT_SAVE_FAILED) });
    }
  };

  const handleDuplicateResume = () => {
    const result = duplicateResumeDocument(project, activeResume.id);
    setProject(result.project);
    setActiveResumeId(result.resumeId);
    setProjectNotice({ type: "success", text: "A new resume version was created from the current layout." });
  };

  const handleDeleteResume = () => {
    if (project.resumes.length <= 1) return;
    if (!window.confirm(`Delete “${activeResume.name || "Untitled Resume"}” from this local project?`)) return;

    const result = deleteResumeDocument(project, activeResume.id);
    setProject(result.project);
    setActiveResumeId(result.resumeId);
    setProjectNotice({ type: "success", text: "The resume variant was removed from this local project." });
  };

  const handleResetProject = () => {
    if (!window.confirm("Clear the current local project? Save a .zenid backup first if you may need it later.")) {
      return;
    }
    const empty = createEmptyProject();
    setProject(empty);
    setActiveResumeId(empty.resumes[0].id);
    setProjectNotice({ type: "success", text: "A new empty local project was created." });
  };

  if (!activeResume.template) {
    return (
      <TemplateSelector
        selected={activeResume.pendingTemplate}
        onSelect={(pendingTemplate) => updateActiveResume({ pendingTemplate })}
        onContinue={() => navigateWithin(() => updateActiveResume({ template: activeResume.pendingTemplate }))}
        accentColor={activeResume.accentColor}
        onSelectAccent={(accentColor) => updateActiveResume({ accentColor })}
        onOpenProject={handleOpenProject}
        projectNotice={projectNotice}
        onDismissProjectNotice={() => setProjectNotice(null)}
      />
    );
  }

  return (
    <BuilderView
      template={activeResume.template}
      resumeData={resumeData}
      outputResumeData={outputResumeData}
      accentColor={activeResume.accentColor}
      onChangeResumeData={handleResumeDataChange}
      onChangeResumeItemSelection={handleResumeItemSelection}
      onSetContentOverride={handleSetContentOverride}
      onResetContentOverride={handleResetContentOverride}
      onChangeTemplate={() => navigateWithin(() => updateActiveResume({ template: null }))}
      resumes={project.resumes}
      activeResume={activeResume}
      onSelectResume={(resumeId) => navigateWithin(() => setActiveResumeId(resumeId))}
      onRenameResume={(name) => updateActiveResume({ name })}
      onDuplicateResume={handleDuplicateResume}
      onDeleteResume={handleDeleteResume}
      onSaveProject={handleSaveProject}
      onOpenProject={handleOpenProject}
      onResetProject={handleResetProject}
      projectNotice={projectNotice}
      onDismissProjectNotice={() => setProjectNotice(null)}
    />
  );
}
