import { useEffect, useRef, useState } from "react";
import {
  Award,
  BriefcaseBusiness,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileArchive,
  FolderOpen,
  Globe2,
  Palette,
  UserRound,
} from "lucide-react";
import PortfolioEditor from "./PortfolioEditor";
import PortfolioPreview from "./PortfolioPreview";
import PublicationReviewDialog from "./PublicationReviewDialog";
import {
  loadProjectFromBrowserStorage,
  saveProjectToBrowserStorage,
  updatePortfolio,
  updateProjectProfile,
} from "../resume/projectSchema";
import { buildResumePdf } from "../resume/resumePdfExport.js";
import ProjectOpenNotice from "../resume/ProjectOpenNotice.jsx";
import {
  BROWSER_AUTOSAVE_UNAVAILABLE,
  classifyProjectOpenError,
  MEDIA_SAVE_FAILED,
  noticeTextForError,
  PORTFOLIO_EXPORT_FAILED,
  PROJECT_SAVE_FAILED,
  userFacingError,
} from "../resume/projectOpenRecovery.js";
import { downloadProjectFile, readProjectBundleFile } from "../resume/projectFile";
import { commitProjectToBrowser, openProjectFileAtomically } from "../resume/projectImport.js";
import {
  deleteMediaAsset,
  getMediaAssets,
  getProjectMediaAssets,
  importMediaAssets,
  mediaRecordsToArchiveAssets,
  referencedAssetIds,
  saveMediaFile,
} from "./assetStore";
import {
  buildPublicResumeData,
  buildPublicationReview,
  downloadPortfolioSite,
  getPublicPortfolioAssetIds,
} from "./portfolioSiteExport";

const STEPS = [
  { id: "profile", label: "Profile", Icon: UserRound },
  { id: "skills", label: "Skills & Experience", Icon: BriefcaseBusiness },
  { id: "projects", label: "Projects", Icon: FolderOpen },
  { id: "certificates", label: "Certificates", Icon: Award },
  { id: "style", label: "Style & Privacy", Icon: Palette },
];

export default function PortfolioApp() {
  const [project, setProject] = useState(loadProjectFromBrowserStorage);
  const [activeStep, setActiveStep] = useState("profile");
  const [mobileView, setMobileView] = useState("edit");
  const [notice, setNotice] = useState("Saved locally in this browser");
  const [projectNotice, setProjectNotice] = useState(null);
  const [assetUrls, setAssetUrls] = useState({});
  const [resumeUrl, setResumeUrl] = useState(null);
  const [showPublicationReview, setShowPublicationReview] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const openInputRef = useRef(null);
  const openProjectButtonRef = useRef(null);
  const assetUrlsRef = useRef({});
  const resumeUrlRef = useRef(null);
  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);
  const mediaKey = JSON.stringify(referencedAssetIds(project));

  useEffect(() => {
    try {
      saveProjectToBrowserStorage(project);
      setNotice("Saved locally in this browser");
    } catch (error) {
      console.warn("ZenID could not autosave the portfolio project.", error);
      setNotice(BROWSER_AUTOSAVE_UNAVAILABLE);
    }
  }, [project]);

  useEffect(() => {
    let active = true;
    getMediaAssets(JSON.parse(mediaKey))
      .then((records) => {
        if (!active) return;
        const nextUrls = Object.fromEntries(records.map((record) => [record.id, URL.createObjectURL(record.blob)]));
        setAssetUrls((current) => {
          Object.values(current).forEach((url) => URL.revokeObjectURL(url));
          assetUrlsRef.current = nextUrls;
          return nextUrls;
        });
      })
      .catch((error) => {
        console.warn("ZenID could not restore local portfolio media.", error);
      });
    return () => {
      active = false;
    };
  }, [mediaKey]);

  useEffect(
    () => () => {
      Object.values(assetUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      if (resumeUrlRef.current) URL.revokeObjectURL(resumeUrlRef.current);
    },
    []
  );

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      if (!project.portfolio.resume.enabled) {
        if (resumeUrlRef.current) URL.revokeObjectURL(resumeUrlRef.current);
        resumeUrlRef.current = null;
        setResumeUrl(null);
        return;
      }
      if (project.portfolio.resume.source === "uploaded") {
        if (resumeUrlRef.current) URL.revokeObjectURL(resumeUrlRef.current);
        resumeUrlRef.current = null;
        setResumeUrl(null);
        return;
      }
      const resumeId = project.portfolio.resume.resumeId || project.resumes[0]?.id;
      const resume = project.resumes.find((item) => item.id === resumeId) || project.resumes[0];
      if (!resume) return;
      try {
        const pdf = await buildResumePdf({
          resumeData: buildPublicResumeData(project, resume.id),
          accentColor: resume.accentColor,
        });
        if (!active) return;
        const nextUrl = URL.createObjectURL(pdf.output("blob"));
        if (resumeUrlRef.current) URL.revokeObjectURL(resumeUrlRef.current);
        resumeUrlRef.current = nextUrl;
        setResumeUrl(nextUrl);
      } catch (error) {
        console.warn("ZenID could not prepare the portfolio résumé preview.", error);
      }
    }, 350);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [project]);

  const changeProfile = (updates) => setProject((current) => updateProjectProfile(current, updates));
  const changePortfolio = (updates) => setProject((current) => updatePortfolio(current, updates));

  const handleOpenProject = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.confirm("Open this ZenID project? It will replace the current browser workspace.")) return;

    try {
      const bundle = await openProjectFileAtomically(file, {
        readBundle: readProjectBundleFile,
        persistAssets: importMediaAssets,
        commitProject: commitProjectToBrowser({
          persistProject: saveProjectToBrowserStorage,
          applyProject: setProject,
        }),
      });
      setProjectNotice({
        type: "success",
        text: `ZenID Project opened locally${bundle.assets.length ? ` with ${bundle.assets.length} media file${bundle.assets.length === 1 ? "" : "s"}` : ""} — nothing was uploaded`,
      });
    } catch (error) {
      console.error("Portfolio project import failed", error);
      setProjectNotice({ type: "error", recovery: classifyProjectOpenError(error) });
    }
  };

  const handleSaveProject = async () => {
    try {
      setNotice("Preparing your private ZenID Project locally…");
      const records = await getProjectMediaAssets(project);
      const assets = await mediaRecordsToArchiveAssets(records);
      downloadProjectFile(project, { assets });
      setNotice(`Private ZenID Project saved${assets.length ? ` with ${assets.length} media file${assets.length === 1 ? "" : "s"}` : ""}`);
    } catch (error) {
      console.error("Portfolio project export failed", error);
      setNotice(noticeTextForError(error, PROJECT_SAVE_FAILED));
    }
  };

  const handlePublishPortfolio = async () => {
    try {
      setIsPublishing(true);
      setNotice("Preparing the public portfolio ZIP locally…");
      const assetIds = getPublicPortfolioAssetIds(project);
      const records = await getMediaAssets(assetIds);
      if (records.length !== assetIds.length) {
        throw userFacingError("One or more public portfolio files are missing from this browser. Replace or remove them before publishing.");
      }
      const assets = await mediaRecordsToArchiveAssets(records);
      let resumePdfBytes;
      if (project.portfolio.resume.enabled && project.portfolio.resume.source !== "uploaded") {
        const resumeId = project.portfolio.resume.resumeId || project.resumes[0]?.id;
        const resume = project.resumes.find((item) => item.id === resumeId) || project.resumes[0];
        if (!resume) throw userFacingError("Choose a résumé version before publishing.");
        const pdf = await buildResumePdf({
          resumeData: buildPublicResumeData(project, resume.id),
          accentColor: resume.accentColor,
        });
        resumePdfBytes = new Uint8Array(pdf.output("arraybuffer"));
      }
      downloadPortfolioSite(project, { assets, resumePdfBytes });
      setShowPublicationReview(false);
      setNotice("Public portfolio ZIP downloaded — private project data was excluded");
    } catch (error) {
      console.error("Portfolio site export failed", error);
      setNotice(noticeTextForError(error, PORTFOLIO_EXPORT_FAILED));
    } finally {
      setIsPublishing(false);
    }
  };

  const updateMediaReference = (current, descriptor, assetId) => {
    const { kind, itemId, file } = descriptor;
    const media = current.portfolio.media;
    if (kind === "resume-pdf") {
      return updatePortfolio(current, {
        resume: {
          ...current.portfolio.resume,
          source: "uploaded",
          uploadedAssetId: assetId,
          uploadedFileName: assetId ? file?.name || current.portfolio.resume.uploadedFileName : "",
        },
      });
    }
    if (kind === "profile-image") {
      return updatePortfolio(current, { media: { ...media, profileImageId: assetId } });
    }
    if (kind === "project-gallery") {
      const galleryMap = { ...media.projectGalleryIds };
      const currentIds = Array.isArray(galleryMap[itemId]) ? galleryMap[itemId] : [];
      galleryMap[itemId] = assetId ? [...currentIds, assetId] : currentIds;
      return updatePortfolio(current, { media: { ...media, projectGalleryIds: galleryMap } });
    }
    const field = kind === "project-image" ? "projectImageIds" : "certificateImageIds";
    const itemMap = { ...media[field] };
    if (assetId) itemMap[itemId] = assetId;
    else delete itemMap[itemId];
    return updatePortfolio(current, { media: { ...media, [field]: itemMap } });
  };

  const removeMediaReference = (current, descriptor) => {
    if (descriptor.kind !== "project-gallery") return updateMediaReference(current, descriptor, null);
    const media = current.portfolio.media;
    const galleryMap = { ...media.projectGalleryIds };
    galleryMap[descriptor.itemId] = (galleryMap[descriptor.itemId] || []).filter((id) => id !== descriptor.assetId);
    if (!galleryMap[descriptor.itemId].length) delete galleryMap[descriptor.itemId];
    return updatePortfolio(current, { media: { ...media, projectGalleryIds: galleryMap } });
  };

  const descriptorAssetId = (descriptor) => {
    if (descriptor.kind === "resume-pdf") return project.portfolio.resume.uploadedAssetId;
    if (descriptor.kind === "profile-image") return project.portfolio.media.profileImageId;
    if (descriptor.kind === "project-image") return project.portfolio.media.projectImageIds[descriptor.itemId];
    if (descriptor.kind === "certificate-image") return project.portfolio.media.certificateImageIds[descriptor.itemId];
    return descriptor.assetId || null;
  };

  const handleMediaSelect = async (descriptor) => {
    try {
      const oldId = descriptor.kind === "project-gallery" ? null : descriptorAssetId(descriptor);
      const record = await saveMediaFile(descriptor.file, descriptor.kind);
      setProject((current) => updateMediaReference(current, descriptor, record.id));
      if (oldId) await deleteMediaAsset(oldId);
      setNotice(descriptor.kind === "resume-pdf" ? "Résumé PDF saved locally in this browser" : "Image saved locally in this browser");
    } catch (error) {
      console.error("Portfolio media save failed", error);
      setNotice(noticeTextForError(error, MEDIA_SAVE_FAILED));
    }
  };

  const handleMediaRemove = async (descriptor) => {
    const assetId = descriptorAssetId(descriptor);
    setProject((current) => removeMediaReference(current, descriptor));
    try {
      await deleteMediaAsset(assetId);
      setNotice(descriptor.kind === "resume-pdf" ? "Résumé PDF removed from this local project" : "Image removed from this local project");
    } catch (error) {
      console.warn("The unused local image could not be removed.", error);
    }
  };

  const goTo = (index) => {
    const step = STEPS[Math.max(0, Math.min(STEPS.length - 1, index))];
    setActiveStep(step.id);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-950 text-stone-100">
      <header className="border-b border-stone-800/70 bg-stone-950/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">Portfolio Builder</h1>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Local</span>
            </div>
            <p className="mt-1 text-xs text-stone-500">{notice}</p>
          </div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <input ref={openInputRef} type="file" accept=".zenid,application/json" onChange={handleOpenProject} className="hidden" />
            <button ref={openProjectButtonRef} type="button" onClick={() => openInputRef.current?.click()} className="flex items-center gap-2 rounded-lg border border-stone-800 px-3 py-2 text-xs font-medium text-stone-300 transition-colors hover:bg-stone-900">
              <FolderOpen size={14} /> Open Project
            </button>
            <button type="button" onClick={handleSaveProject} className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-amber-500">
              <FileArchive size={14} /> Save Project
            </button>
            <button type="button" onClick={() => setShowPublicationReview(true)} className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 transition-colors hover:bg-emerald-500/15">
              <Globe2 size={14} /> Export Website
            </button>
          </div>
        </div>
      </header>

      <ProjectOpenNotice
        notice={projectNotice}
        onOpenAnother={() => openInputRef.current?.click()}
        onDismiss={() => setProjectNotice(null)}
        returnFocusRef={openProjectButtonRef}
        className="mx-auto my-4 max-w-[1760px] rounded-lg"
      />

      <div className="border-b border-stone-800/70 bg-stone-950 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1800px] gap-2 overflow-x-auto pb-1">
          {STEPS.map(({ id, label, Icon }, index) => {
            const active = activeStep === id;
            const visited = index < activeIndex;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveStep(id)}
                aria-current={active ? "step" : undefined}
                className={`flex min-w-max flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium transition-colors ${active ? "border-amber-600 bg-amber-600/10 text-amber-400" : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700 hover:text-stone-200"}`}
              >
                {visited ? <Check size={14} className="text-emerald-500" /> : <Icon size={14} />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-stone-800 p-2 lg:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-2 rounded-xl bg-stone-900 p-1">
          <button type="button" onClick={() => setMobileView("edit")} className={`rounded-lg px-3 py-2 text-xs font-medium ${mobileView === "edit" ? "bg-stone-700 text-white" : "text-stone-500"}`}>Edit</button>
          <button type="button" onClick={() => setMobileView("preview")} className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${mobileView === "preview" ? "bg-stone-700 text-white" : "text-stone-500"}`}><Eye size={14} /> Preview</button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1800px] lg:h-[calc(100vh-13.6rem)] lg:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
        <aside className={`${mobileView === "edit" ? "block" : "hidden"} overflow-y-auto border-stone-800 bg-stone-950 lg:block lg:border-r`}>
          <div className="mx-auto max-w-2xl p-5 sm:p-7">
            <PortfolioEditor
              activeStep={activeStep}
              project={project}
              assetUrls={assetUrls}
              onProfileChange={changeProfile}
              onPortfolioChange={changePortfolio}
              onMediaSelect={handleMediaSelect}
              onMediaRemove={handleMediaRemove}
            />
            <div className="mt-10 flex items-center justify-between border-t border-stone-800 pt-5">
              <button type="button" onClick={() => goTo(activeIndex - 1)} disabled={activeIndex === 0} className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-stone-400 hover:bg-stone-900 disabled:cursor-not-allowed disabled:opacity-30"><ChevronLeft size={14} /> Previous</button>
              {activeIndex < STEPS.length - 1 ? (
                <button type="button" onClick={() => goTo(activeIndex + 1)} className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-500">Next <ChevronRight size={14} /></button>
              ) : (
                <button type="button" onClick={() => setMobileView("preview")} className="flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-2 text-xs font-medium text-white hover:bg-amber-500"><Eye size={14} /> Review preview</button>
              )}
            </div>
          </div>
        </aside>

        <section className={`${mobileView === "preview" ? "block" : "hidden"} overflow-y-auto bg-stone-900/60 p-3 sm:p-5 lg:block`} aria-label="Live portfolio preview">
          <div className="mx-auto min-h-full max-w-6xl shadow-2xl shadow-black/40">
            <PortfolioPreview
              project={project}
              assetUrls={assetUrls}
              resumeUrl={project.portfolio.resume.source === "uploaded"
                ? assetUrls[project.portfolio.resume.uploadedAssetId]
                : resumeUrl}
            />
          </div>
        </section>
      </div>
      {showPublicationReview && (
        <PublicationReviewDialog
          review={buildPublicationReview(project)}
          busy={isPublishing}
          onCancel={() => setShowPublicationReview(false)}
          onPublish={handlePublishPortfolio}
        />
      )}
    </div>
  );
}
