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
  materializeResumeData,
  saveProjectToBrowserStorage,
  updateResumeDocument,
} from "./projectSchema.js";
import { downloadProjectFile, readProjectBundleFile } from "./projectFile.js";
import { openProjectFileAtomically } from "./projectImport.js";
import { buildResumePdf } from "./resumePdfExport.js";
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
  const resumeData = materializeResumeData(project, activeResume.id);

  useEffect(() => {
    try {
      saveProjectToBrowserStorage(project);
    } catch (error) {
      console.warn("ZenID could not autosave this project in the browser.", error);
    }
  }, [project]);

  const updateActiveResume = (updates) => {
    setProject((current) => updateResumeDocument(current, activeResume.id, updates));
  };

  const handleResumeDataChange = (nextResumeData) => {
    setProject((current) => applyResumeData(current, activeResume.id, nextResumeData));
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
        commitProject: (nextProject) => {
          setProject(nextProject);
          setActiveResumeId(nextProject.resumes[0].id);
        },
      });
      setProjectNotice({ type: "success", text: "Project opened locally. No file was uploaded." });
    } catch (error) {
      console.error("ZenID project import failed", error);
      setProjectNotice({
        type: "error",
        text: error?.message || "This ZenID project could not be opened.",
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
      setProjectNotice({ type: "error", text: "The ZenID project could not be saved." });
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
        onContinue={() => updateActiveResume({ template: activeResume.pendingTemplate })}
        accentColor={activeResume.accentColor}
        onSelectAccent={(accentColor) => updateActiveResume({ accentColor })}
        onOpenProject={handleOpenProject}
        projectNotice={projectNotice}
      />
    );
  }

  return (
    <BuilderView
      template={activeResume.template}
      resumeData={resumeData}
      accentColor={activeResume.accentColor}
      onChangeResumeData={handleResumeDataChange}
      onChangeTemplate={() => updateActiveResume({ template: null })}
      resumes={project.resumes}
      activeResume={activeResume}
      onSelectResume={setActiveResumeId}
      onRenameResume={(name) => updateActiveResume({ name })}
      onDuplicateResume={handleDuplicateResume}
      onDeleteResume={handleDeleteResume}
      onSaveProject={handleSaveProject}
      onOpenProject={handleOpenProject}
      onResetProject={handleResetProject}
      projectNotice={projectNotice}
    />
  );
}
