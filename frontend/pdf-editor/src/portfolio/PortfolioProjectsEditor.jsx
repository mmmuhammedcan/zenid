import { Plus, Trash2 } from "lucide-react";
import { Field, TextAreaField } from "../resume/Field";
import { emptyProject } from "../resume/data";
import MediaField from "./MediaField";
import ProjectGalleryField from "./ProjectGalleryField";

const EMPTY_STUDY = {
  projectId: "",
  projectType: "",
  shortDescription: "",
  fullDescription: "",
  videoUrl: "",
  linkedinUrl: "",
  platformName: "",
  platformUrl: "",
  screenshotCaptions: {},
};

export default function PortfolioProjectsEditor({
  projects,
  portfolio,
  assetUrls,
  onProjectsChange,
  onPortfolioChange,
  onMediaSelect,
  onMediaRemove,
}) {
  const hidden = new Set(portfolio.hiddenItems.projects || []);
  const getStudy = (projectId) => portfolio.caseStudies.find((study) => study.projectId === projectId) || { ...EMPTY_STUDY, projectId };

  const updateProject = (id, patch) => {
    onProjectsChange(projects.map((project) => (project.id === id ? { ...project, ...patch } : project)));
  };

  const updateStudy = (projectId, patch) => {
    const current = getStudy(projectId);
    const next = { ...current, ...patch, projectId };
    const exists = portfolio.caseStudies.some((study) => study.projectId === projectId);
    onPortfolioChange({
      caseStudies: exists
        ? portfolio.caseStudies.map((study) => (study.projectId === projectId ? next : study))
        : [...portfolio.caseStudies, next],
    });
  };

  const setPublished = (projectId, published) => {
    const next = new Set(hidden);
    if (published) next.delete(projectId);
    else next.add(projectId);
    onPortfolioChange({ hiddenItems: { ...portfolio.hiddenItems, projects: [...next] } });
  };

  const removeProject = (projectId) => {
    const thumbnailId = portfolio.media.projectImageIds[projectId];
    if (thumbnailId) onMediaRemove({ kind: "project-image", itemId: projectId });
    (portfolio.media.projectGalleryIds[projectId] || []).forEach((assetId) => {
      onMediaRemove({ kind: "project-gallery", itemId: projectId, assetId });
    });
    onProjectsChange(projects.filter((project) => project.id !== projectId));
    onPortfolioChange({
      caseStudies: portfolio.caseStudies.filter((study) => study.projectId !== projectId),
      hiddenItems: {
        ...portfolio.hiddenItems,
        projects: (portfolio.hiddenItems.projects || []).filter((id) => id !== projectId),
      },
    });
  };

  return (
    <div className="space-y-5">
      {projects.map((project, index) => {
        const study = getStudy(project.id);
        const thumbnailId = portfolio.media.projectImageIds[project.id];
        const galleryIds = portfolio.media.projectGalleryIds[project.id] || [];
        return (
          <section key={project.id} className="overflow-hidden rounded-xl border border-stone-800 bg-stone-900/25">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-stone-200">Edit Project {index + 1}</p>
                {project.name && <p className="mt-0.5 text-xs text-stone-500">{project.name}</p>}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-stone-400">
                  <input type="checkbox" checked={!hidden.has(project.id)} onChange={(event) => setPublished(project.id, event.target.checked)} className="accent-amber-600" />
                  Show on portfolio
                </label>
                {projects.length > 1 && <button type="button" onClick={() => removeProject(project.id)} aria-label={`Remove ${project.name || `project ${index + 1}`}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-500/10"><Trash2 size={14} /></button>}
              </div>
            </header>

            <div className="space-y-5 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Project type" value={study.projectType} onChange={(event) => updateStudy(project.id, { projectType: event.target.value })} placeholder="Machine Learning" />
                <Field label="Domain / function" value={project.domain || ""} onChange={(event) => updateProject(project.id, { domain: event.target.value })} placeholder="Finance" />
              </div>
              <Field label="Project title" value={project.name || ""} onChange={(event) => updateProject(project.id, { name: event.target.value })} placeholder="Credit Risk Modelling" />
              <Field label="Tools and technologies" value={project.techStack || ""} onChange={(event) => updateProject(project.id, { techStack: event.target.value })} placeholder="Python, Scikit-learn, Pandas, Streamlit" />
              <TextAreaField
                label="Project short info (maximum 300 characters)"
                rows={3}
                maxLength={300}
                value={study.shortDescription || project.description || ""}
                onChange={(event) => {
                  updateProject(project.id, { description: event.target.value });
                  updateStudy(project.id, { shortDescription: event.target.value });
                }}
                placeholder="Briefly explain the problem, solution, and value."
              />
              <MediaField
                label="Project thumbnail"
                description="Used on the project card. It is separate from the detailed screenshots below."
                imageUrl={assetUrls[thumbnailId]}
                onSelect={(file) => onMediaSelect({ kind: "project-image", itemId: project.id, file })}
                onRemove={() => onMediaRemove({ kind: "project-image", itemId: project.id })}
              />
              <TextAreaField
                label="Project description"
                rows={7}
                maxLength={2000}
                value={study.fullDescription}
                onChange={(event) => updateStudy(project.id, { fullDescription: event.target.value })}
                placeholder="Describe the problem, your approach, implementation, results, and what you learned."
              />
              <ProjectGalleryField
                label="Project screenshots and descriptions"
                assetIds={galleryIds}
                assetUrls={assetUrls}
                captions={study.screenshotCaptions}
                onAdd={(files) => files.forEach((file) => onMediaSelect({ kind: "project-gallery", itemId: project.id, file }))}
                onRemove={(assetId) => onMediaRemove({ kind: "project-gallery", itemId: project.id, assetId })}
                onCaptionChange={(assetId, caption) => updateStudy(project.id, {
                  screenshotCaptions: { ...study.screenshotCaptions, [assetId]: caption },
                })}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Project video link" value={study.videoUrl} onChange={(event) => updateStudy(project.id, { videoUrl: event.target.value })} placeholder="YouTube or Vimeo URL" />
                <Field label="Live demo / dashboard link" value={project.liveUrl || ""} onChange={(event) => updateProject(project.id, { liveUrl: event.target.value })} placeholder="Streamlit, Power BI, or website URL" />
                <Field label="LinkedIn post link" value={study.linkedinUrl} onChange={(event) => updateStudy(project.id, { linkedinUrl: event.target.value })} placeholder="https://linkedin.com/posts/..." />
                <Field label="Project GitHub link" value={project.githubUrl || ""} onChange={(event) => updateProject(project.id, { githubUrl: event.target.value })} placeholder="https://github.com/..." />
                <Field label="Project platform name" value={study.platformName} onChange={(event) => updateStudy(project.id, { platformName: event.target.value })} placeholder="Kaggle, Hugging Face, Streamlit…" />
                <Field label="Project link" value={study.platformUrl || project.link || ""} onChange={(event) => {
                  updateProject(project.id, { link: event.target.value });
                  updateStudy(project.id, { platformUrl: event.target.value });
                }} placeholder="https://..." />
              </div>
            </div>
          </section>
        );
      })}

      <button type="button" onClick={() => onProjectsChange([...projects, emptyProject()])} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-700 py-3 text-sm text-stone-500 hover:border-amber-600 hover:text-amber-500">
        <Plus size={15} /> Add another project
      </button>
    </div>
  );
}
