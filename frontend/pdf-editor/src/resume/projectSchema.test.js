import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_SCHEMA_VERSION,
  applyResumeData,
  createEmptyProject,
  duplicateResumeDocument,
  deleteResumeDocument,
  getResumeDocument,
  loadProjectFromBrowserStorage,
  materializeResumeData,
  migrateLegacyResumeDraft,
  migrateProject,
  normalizePortfolio,
  DEFAULT_PORTFOLIO_SECTION_ORDER,
  PROJECT_STORAGE_KEY,
  LEGACY_RESUME_STORAGE_KEY,
} from "./projectSchema.js";

function legacyDraft() {
  return {
    template: "modern",
    pendingTemplate: "modern",
    accentColor: "#1F2A44",
    resumeData: {
      personalInfo: { fullName: "Şule Işık", email: "sule@example.com", summary: "Türkçe özgeçmiş" },
      sectionOrder: ["experience", "education"],
      domains: [{ id: 1, text: "Cloud" }],
      skills: [{ id: 2, category: "Languages", items: "TypeScript" }],
      experience: [{ id: 3, company: "ZenID", role: "Engineer" }],
      projects: [],
      achievements: [],
      certifications: [],
      education: [{ id: 4, institution: "ODTÜ", degree: "B.Sc." }],
      additionalSection: { title: "Languages", content: "Turkish", link: "" },
    },
  };
}

test("new projects use schema v1 and portable string IDs", () => {
  const project = createEmptyProject();
  assert.equal(project.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(typeof project.resumes[0].id, "string");
  assert.equal(typeof project.profile.experience[0].id, "string");
  assert.equal(project.portfolio.template, "studio");
  assert.equal(project.portfolio.contactPrivacy.email, false);
  assert.deepEqual(project.portfolio.sectionOrder, DEFAULT_PORTFOLIO_SECTION_ORDER);
});

test("portfolio defaults are added without discarding older configuration", () => {
  const portfolio = normalizePortfolio({
    template: "legacy-template",
    contactPrivacy: { linkedin: true },
    media: { projectImageIds: { "project-1": "asset-1" } },
    futureSetting: "preserved",
  });

  assert.equal(portfolio.template, "legacy-template");
  assert.equal(portfolio.contactPrivacy.linkedin, true);
  assert.equal(portfolio.contactPrivacy.email, false);
  assert.equal(portfolio.visibleSections.projects, true);
  assert.equal(portfolio.media.projectImageIds["project-1"], "asset-1");
  assert.equal(portfolio.media.profileImageId, null);
  assert.equal(portfolio.futureSetting, "preserved");
});

test("portfolio section order is normalized without losing future section identifiers", () => {
  const portfolio = normalizePortfolio({
    sectionOrder: ["projects", "future-section", "projects", "about"],
  });

  assert.deepEqual(portfolio.sectionOrder, [
    "projects",
    "future-section",
    "about",
    "experience",
    "certifications",
    "contact",
  ]);
});

test("legacy localStorage drafts migrate without losing Unicode content or presentation", () => {
  const project = migrateLegacyResumeDraft(legacyDraft());
  const resume = project.resumes[0];

  assert.equal(project.profile.personalInfo.fullName, "Şule Işık");
  assert.equal(project.profile.personalInfo.summary, "Türkçe özgeçmiş");
  assert.equal(project.profile.education[0].institution, "ODTÜ");
  assert.equal(project.profile.experience[0].id, "legacy-experience-3");
  assert.equal(resume.template, "modern");
  assert.equal(resume.accentColor, "#1F2A44");
  assert.deepEqual(resume.sectionOrder, ["experience", "education"]);
});

test("browser loading falls back to a valid legacy draft when the current save is corrupt", () => {
  const values = new Map([
    [PROJECT_STORAGE_KEY, "{broken"],
    [LEGACY_RESUME_STORAGE_KEY, JSON.stringify(legacyDraft())],
  ]);
  const storage = { getItem: (key) => values.get(key) || null };
  const project = loadProjectFromBrowserStorage(storage);
  assert.equal(project.profile.personalInfo.fullName, "Şule Işık");
});

test("resume edits update shared facts while keeping document presentation separate", () => {
  const project = createEmptyProject();
  const resumeId = project.resumes[0].id;
  const data = materializeResumeData(project, resumeId);
  data.personalInfo.fullName = "Shared Name";
  data.sectionOrder = ["education", "skills"];

  const updated = applyResumeData(project, resumeId, data);
  assert.equal(updated.profile.personalInfo.fullName, "Shared Name");
  assert.deepEqual(getResumeDocument(updated, resumeId).sectionOrder, ["education", "skills"]);
  assert.equal(updated.profile.sectionOrder, undefined);
});

test("duplicating a resume creates a new document without duplicating the profile", () => {
  const project = createEmptyProject();
  project.profile.personalInfo.fullName = "One Profile";
  const result = duplicateResumeDocument(project, project.resumes[0].id);

  assert.equal(result.project.resumes.length, 2);
  assert.notEqual(result.project.resumes[0].id, result.project.resumes[1].id);
  assert.equal(result.project.profile.personalInfo.fullName, "One Profile");
});

test("resume variants can be deleted but a project always keeps one resume", () => {
  const project = createEmptyProject();
  const duplicated = duplicateResumeDocument(project, project.resumes[0].id);
  const deleted = deleteResumeDocument(duplicated.project, duplicated.resumeId);

  assert.equal(deleted.project.resumes.length, 1);
  assert.equal(deleted.resumeId, project.resumes[0].id);
  assert.throws(() => deleteResumeDocument(project, project.resumes[0].id), (error) => error.code === "LAST_RESUME");
});

test("projects from a newer schema fail safely", () => {
  assert.throws(
    () => migrateProject({ ...createEmptyProject(), schemaVersion: CURRENT_SCHEMA_VERSION + 1 }),
    (error) => error.code === "NEWER_PROJECT"
  );
});
