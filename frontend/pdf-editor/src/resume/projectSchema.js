import { createInitialResumeData, DEFAULT_SECTION_ORDER } from "./data.js";
import { createStableId } from "./ids.js";
import { DEFAULT_ACCENT } from "./themes.js";

export const CURRENT_SCHEMA_VERSION = 2;
// The storage location is stable; schemaVersion inside the payload controls
// migrations. This avoids stranding data under a new key for every release.
export const PROJECT_STORAGE_KEY = "zenid.project";
export const LEGACY_RESUME_STORAGE_KEY = "zenid.resume-builder.draft.v1";

export const DEFAULT_PORTFOLIO_SECTION_ORDER = [
  "about",
  "experience",
  "projects",
  "certifications",
  "contact",
];

export const DEFAULT_PORTFOLIO_CONFIG = {
  language: "en",
  template: "studio",
  theme: "dark",
  accentColor: "#d97706",
  about: "",
  availability: "Open to opportunities",
  contactMessage: "I’m always open to discussing new projects, ideas, and opportunities.",
  introVideoUrl: "",
  resume: {
    enabled: false,
    source: "generated",
    resumeId: null,
    uploadedAssetId: null,
    uploadedFileName: "",
  },
  visibleSections: {
    about: true,
    skills: true,
    experience: true,
    projects: true,
    certifications: true,
    contact: true,
  },
  sectionOrder: DEFAULT_PORTFOLIO_SECTION_ORDER,
  contactPrivacy: {
    email: false,
    phone: false,
    linkedin: false,
    github: false,
  },
  hiddenItems: {
    experience: [],
    projects: [],
    certifications: [],
  },
  media: {
    profileImageId: null,
    projectImageIds: {},
    projectGalleryIds: {},
    certificateImageIds: {},
  },
  caseStudies: [],
};

const PROFILE_ARRAY_FIELDS = [
  "domains",
  "skills",
  "experience",
  "projects",
  "achievements",
  "certifications",
  "education",
];

export const RESUME_SELECTABLE_FIELDS = ["experience", "projects"];

export class ProjectCompatibilityError extends Error {
  constructor(message, code = "INCOMPATIBLE_PROJECT") {
    super(message);
    this.name = "ProjectCompatibilityError";
    this.code = code;
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isRecord(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function normalizePortfolio(source = {}) {
  const portfolio = isRecord(source) ? clone(source) : {};
  const suppliedSectionOrder = Array.isArray(portfolio.sectionOrder)
    ? portfolio.sectionOrder.filter((section, index, order) =>
        typeof section === "string" && section.trim() && order.indexOf(section) === index
      )
    : [];
  const sectionOrder = [
    ...suppliedSectionOrder,
    ...DEFAULT_PORTFOLIO_SECTION_ORDER.filter((section) => !suppliedSectionOrder.includes(section)),
  ];
  return {
    ...clone(DEFAULT_PORTFOLIO_CONFIG),
    ...portfolio,
    visibleSections: {
      ...DEFAULT_PORTFOLIO_CONFIG.visibleSections,
      ...(isRecord(portfolio.visibleSections) ? portfolio.visibleSections : {}),
    },
    sectionOrder,
    contactPrivacy: {
      ...DEFAULT_PORTFOLIO_CONFIG.contactPrivacy,
      ...(isRecord(portfolio.contactPrivacy) ? portfolio.contactPrivacy : {}),
    },
    resume: {
      ...DEFAULT_PORTFOLIO_CONFIG.resume,
      ...(isRecord(portfolio.resume) ? portfolio.resume : {}),
      source: portfolio.resume?.source === "uploaded" ? "uploaded" : "generated",
    },
    hiddenItems: {
      ...clone(DEFAULT_PORTFOLIO_CONFIG.hiddenItems),
      ...(isRecord(portfolio.hiddenItems) ? portfolio.hiddenItems : {}),
    },
    media: {
      ...clone(DEFAULT_PORTFOLIO_CONFIG.media),
      ...(isRecord(portfolio.media) ? portfolio.media : {}),
      projectImageIds: {
        ...DEFAULT_PORTFOLIO_CONFIG.media.projectImageIds,
        ...(isRecord(portfolio.media?.projectImageIds) ? portfolio.media.projectImageIds : {}),
      },
      projectGalleryIds: {
        ...DEFAULT_PORTFOLIO_CONFIG.media.projectGalleryIds,
        ...(isRecord(portfolio.media?.projectGalleryIds) ? portfolio.media.projectGalleryIds : {}),
      },
      certificateImageIds: {
        ...DEFAULT_PORTFOLIO_CONFIG.media.certificateImageIds,
        ...(isRecord(portfolio.media?.certificateImageIds) ? portfolio.media.certificateImageIds : {}),
      },
    },
    caseStudies: Array.isArray(portfolio.caseStudies)
      ? portfolio.caseStudies.filter(isRecord).map((study) => ({
          projectId: typeof study.projectId === "string" ? study.projectId : "",
          projectType: typeof study.projectType === "string" ? study.projectType : "",
          shortDescription: typeof study.shortDescription === "string" ? study.shortDescription : "",
          fullDescription: typeof study.fullDescription === "string" ? study.fullDescription : "",
          videoUrl: typeof study.videoUrl === "string" ? study.videoUrl : "",
          linkedinUrl: typeof study.linkedinUrl === "string" ? study.linkedinUrl : "",
          platformName: typeof study.platformName === "string" ? study.platformName : "",
          platformUrl: typeof study.platformUrl === "string" ? study.platformUrl : "",
          screenshotCaptions: isRecord(study.screenshotCaptions) ? study.screenshotCaptions : {},
        }))
      : [],
  };
}

function normalizedId(candidate, field, seenIds) {
  const base =
    typeof candidate === "string" && candidate.trim()
      ? candidate.trim()
      : candidate !== undefined && candidate !== null
        ? `legacy-${field}-${String(candidate)}`
        : createStableId();

  if (!seenIds.has(base)) {
    seenIds.add(base);
    return base;
  }

  const replacement = createStableId();
  seenIds.add(replacement);
  return replacement;
}

export function normalizeProfile(source = {}) {
  if (!isRecord(source)) {
    throw new ProjectCompatibilityError("The project profile is missing or invalid.", "INVALID_PROFILE");
  }

  const defaults = createInitialResumeData();
  const profile = {
    ...clone(source),
    personalInfo: {
      ...defaults.personalInfo,
      ...(isRecord(source.personalInfo) ? source.personalInfo : {}),
    },
    additionalSection: {
      ...defaults.additionalSection,
      ...(isRecord(source.additionalSection) ? source.additionalSection : {}),
    },
  };

  const seenIds = new Set();
  PROFILE_ARRAY_FIELDS.forEach((field) => {
    const fallback = defaults[field];
    const items = Array.isArray(source[field]) ? source[field] : fallback;
    profile[field] = items.map((item) => {
      const record = isRecord(item) ? clone(item) : {};
      return { ...record, id: normalizedId(record.id, field, seenIds) };
    });
  });

  delete profile.sectionOrder;
  return profile;
}

export function createResumeDocument(overrides = {}) {
  const selectedItems = isRecord(overrides.selectedItems) ? clone(overrides.selectedItems) : {};
  RESUME_SELECTABLE_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(selectedItems, field)) return;
    selectedItems[field] = Array.isArray(selectedItems[field])
      ? [...new Set(selectedItems[field].filter((id) => typeof id === "string" && id))]
      : [];
  });

  return {
    ...clone(overrides),
    id: overrides.id || createStableId(),
    name: typeof overrides.name === "string" ? overrides.name : "General Resume",
    language: overrides.language || "en",
    template: overrides.template ?? null,
    pendingTemplate: overrides.pendingTemplate || overrides.template || "minimal",
    accentColor: overrides.accentColor || DEFAULT_ACCENT,
    sectionOrder:
      Array.isArray(overrides.sectionOrder) && overrides.sectionOrder.length
        ? [...overrides.sectionOrder]
        : [...DEFAULT_SECTION_ORDER],
    selectedItems,
    contentOverrides: isRecord(overrides.contentOverrides) ? clone(overrides.contentOverrides) : {},
  };
}

export function createEmptyProject() {
  const resumeData = createInitialResumeData();
  const { sectionOrder, ...profile } = resumeData;

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: normalizeProfile(profile),
    resumes: [createResumeDocument({ sectionOrder })],
    portfolio: normalizePortfolio(),
  };
}

export function migrateLegacyResumeDraft(legacyDraft) {
  if (!isRecord(legacyDraft) || !isRecord(legacyDraft.resumeData)) {
    throw new ProjectCompatibilityError("This is not a supported ZenID resume draft.", "INVALID_LEGACY_DRAFT");
  }

  const { sectionOrder, ...profile } = legacyDraft.resumeData;
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile,
    resumes: [
      createResumeDocument({
        name: "General Resume",
        template: legacyDraft.template ?? null,
        pendingTemplate: legacyDraft.pendingTemplate || legacyDraft.template || "minimal",
        accentColor: legacyDraft.accentColor || DEFAULT_ACCENT,
        sectionOrder,
      }),
    ],
    portfolio: normalizePortfolio(),
  });
}

export function normalizeProject(project) {
  if (!isRecord(project)) {
    throw new ProjectCompatibilityError("The selected file is not a ZenID project.", "INVALID_PROJECT");
  }

  if (project.schemaVersion > CURRENT_SCHEMA_VERSION) {
    throw new ProjectCompatibilityError(
      `This project was created by a newer ZenID version (schema ${project.schemaVersion}). Update ZenID before opening it.`,
      "NEWER_PROJECT"
    );
  }

  if (project.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    throw new ProjectCompatibilityError(
      `ZenID does not recognize project schema ${String(project.schemaVersion)}.`,
      "UNSUPPORTED_PROJECT"
    );
  }

  if (!Array.isArray(project.resumes) || project.resumes.length === 0) {
    throw new ProjectCompatibilityError("The project must contain at least one resume document.", "MISSING_RESUME");
  }

  const seenResumeIds = new Set();
  const resumes = project.resumes.map((resume, index) => {
    if (!isRecord(resume)) {
      throw new ProjectCompatibilityError(`Resume ${index + 1} is invalid.`, "INVALID_RESUME");
    }
    const normalized = createResumeDocument(resume);
    normalized.id = normalizedId(normalized.id, "resume", seenResumeIds);
    return normalized;
  });

  return {
    ...clone(project),
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: normalizeProfile(project.profile),
    resumes,
    portfolio: normalizePortfolio(project.portfolio),
  };
}

export function migrateProject(input) {
  if (isRecord(input) && input.schemaVersion === undefined && input.resumeData) {
    return migrateLegacyResumeDraft(input);
  }
  if (!isRecord(input) || input.schemaVersion === undefined || input.schemaVersion >= CURRENT_SCHEMA_VERSION) {
    return normalizeProject(input);
  }

  let migrated = clone(input);
  while (migrated.schemaVersion < CURRENT_SCHEMA_VERSION) {
    if (migrated.schemaVersion === 1) {
      migrated = {
        ...migrated,
        schemaVersion: 2,
        resumes: Array.isArray(migrated.resumes)
          ? migrated.resumes.map((resume) => {
              if (!isRecord(resume) || !isRecord(resume.selectedItems)) return resume;
              const selectedItems = clone(resume.selectedItems);
              RESUME_SELECTABLE_FIELDS.forEach((field) => delete selectedItems[field]);
              return { ...resume, selectedItems };
            })
          : migrated.resumes,
      };
      continue;
    }
    throw new ProjectCompatibilityError(
      `ZenID does not recognize project schema ${String(migrated.schemaVersion)}.`,
      "UNSUPPORTED_PROJECT"
    );
  }
  return normalizeProject(migrated);
}

export function loadProjectFromBrowserStorage(storage = globalThis.localStorage) {
  if (!storage) return createEmptyProject();

  const current = storage.getItem(PROJECT_STORAGE_KEY);
  if (current) {
    try {
      return migrateProject(JSON.parse(current));
    } catch (error) {
      console.warn("The saved ZenID project could not be opened; trying the legacy draft.", error);
    }
  }

  const legacy = storage.getItem(LEGACY_RESUME_STORAGE_KEY);
  if (legacy) {
    try {
      return migrateLegacyResumeDraft(JSON.parse(legacy));
    } catch (error) {
      console.warn("The legacy ZenID resume draft could not be migrated.", error);
    }
  }

  return createEmptyProject();
}

export function saveProjectToBrowserStorage(project, storage = globalThis.localStorage) {
  if (!storage) return;
  storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(normalizeProject(project)));
}

export function getResumeDocument(project, resumeId) {
  return project.resumes.find((resume) => resume.id === resumeId) || project.resumes[0];
}

export function materializeResumeEditorData(project, resumeId) {
  const resume = getResumeDocument(project, resumeId);
  return {
    ...clone(project.profile),
    sectionOrder: [...resume.sectionOrder],
  };
}

export function materializeResumeData(project, resumeId) {
  const resume = getResumeDocument(project, resumeId);
  const data = materializeResumeEditorData(project, resumeId);

  RESUME_SELECTABLE_FIELDS.forEach((field) => {
    if (!Object.prototype.hasOwnProperty.call(resume.selectedItems, field)) return;
    const selected = new Set(resume.selectedItems[field]);
    data[field] = data[field].filter((item) => selected.has(item.id));
  });

  return data;
}

export function applyResumeData(project, resumeId, resumeData) {
  const { sectionOrder, ...profile } = resumeData;
  return normalizeProject({
    ...project,
    profile,
    resumes: project.resumes.map((resume) =>
      resume.id === resumeId
        ? {
            ...resume,
            sectionOrder: Array.isArray(sectionOrder) ? [...sectionOrder] : resume.sectionOrder,
            selectedItems: RESUME_SELECTABLE_FIELDS.reduce((selectedItems, field) => {
              if (!Object.prototype.hasOwnProperty.call(selectedItems, field)) return selectedItems;
              const previousIds = new Set((project.profile[field] || []).map((item) => item.id));
              const nextIds = (profile[field] || []).map((item) => item.id);
              const addedIds = nextIds.filter((id) => !previousIds.has(id));
              if (!addedIds.length) return selectedItems;
              return {
                ...selectedItems,
                [field]: [...new Set([...(selectedItems[field] || []), ...addedIds])],
              };
            }, clone(resume.selectedItems)),
          }
        : resume
    ),
  });
}

export function updateResumeDocument(project, resumeId, updates) {
  return normalizeProject({
    ...project,
    resumes: project.resumes.map((resume) =>
      resume.id === resumeId ? { ...resume, ...clone(updates), id: resume.id } : resume
    ),
  });
}

export function updateResumeItemSelection(project, resumeId, field, itemId, included) {
  if (!RESUME_SELECTABLE_FIELDS.includes(field)) {
    throw new ProjectCompatibilityError(`Resume item selection is not supported for ${field}.`, "INVALID_SELECTION");
  }
  const resume = getResumeDocument(project, resumeId);
  const hasExplicitSelection = Object.prototype.hasOwnProperty.call(resume.selectedItems, field);
  const selected = new Set(
    hasExplicitSelection
      ? resume.selectedItems[field]
      : (project.profile[field] || []).map((item) => item.id)
  );
  if (included) selected.add(itemId);
  else selected.delete(itemId);

  return updateResumeDocument(project, resumeId, {
    selectedItems: {
      ...resume.selectedItems,
      [field]: [...selected],
    },
  });
}

export function updatePortfolio(project, updates) {
  return normalizeProject({
    ...project,
    portfolio: {
      ...project.portfolio,
      ...clone(updates),
    },
  });
}

export function updateProjectProfile(project, updates) {
  return normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      ...clone(updates),
    },
  });
}

export function duplicateResumeDocument(project, resumeId) {
  const source = getResumeDocument(project, resumeId);
  const copyNumber = project.resumes.length + 1;
  const copy = createResumeDocument({
    ...source,
    id: createStableId(),
    name: `Resume ${copyNumber}`,
  });

  return {
    project: normalizeProject({ ...project, resumes: [...project.resumes, copy] }),
    resumeId: copy.id,
  };
}

export function deleteResumeDocument(project, resumeId) {
  if (project.resumes.length <= 1) {
    throw new ProjectCompatibilityError("A ZenID project must keep at least one resume.", "LAST_RESUME");
  }

  const resumes = project.resumes.filter((resume) => resume.id !== resumeId);
  if (resumes.length === project.resumes.length) return { project, resumeId: project.resumes[0].id };

  return {
    project: normalizeProject({ ...project, resumes }),
    resumeId: resumes[0].id,
  };
}
