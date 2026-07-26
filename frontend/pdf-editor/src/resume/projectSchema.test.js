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
  materializeResumeEditorData,
  materializeResumeData,
  migrateLegacyResumeDraft,
  migrateProject,
  normalizeProject,
  normalizePortfolio,
  resetResumeContentOverride,
  setResumeContentOverride,
  DEFAULT_PORTFOLIO_SECTION_ORDER,
  PROJECT_STORAGE_KEY,
  LEGACY_RESUME_STORAGE_KEY,
  updateResumeDocument,
  updateResumeItemSelection,
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

test("new projects use the current schema and portable string IDs", () => {
  const project = createEmptyProject();
  assert.equal(project.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(typeof project.resumes[0].id, "string");
  assert.equal(typeof project.profile.experience[0].id, "string");
  assert.equal(project.portfolio.template, "studio");
  assert.equal(project.portfolio.contactPrivacy.email, false);
  assert.deepEqual(project.portfolio.sectionOrder, DEFAULT_PORTFOLIO_SECTION_ORDER);
});

test("schema v1 projects migrate with every resume item included", () => {
  const current = createEmptyProject();
  current.profile.experience.push({ id: "second-experience", company: "Store", role: "Retail" });
  current.resumes[0].selectedItems = {
    experience: [],
    projects: ["placeholder-project-id"],
    futureSelection: ["preserved"],
  };
  const migrated = migrateProject({ ...current, schemaVersion: 1 });

  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(migrated.resumes[0].selectedItems, {
    futureSelection: ["preserved"],
  });
  assert.equal(
    materializeResumeData(migrated, migrated.resumes[0].id).experience.length,
    migrated.profile.experience.length
  );
});

test("schema v2 projects reset newly semantic override placeholders and preserve unknown branches", () => {
  const current = createEmptyProject();
  const experienceId = current.profile.experience[0].id;
  current.resumes[0].contentOverrides = {
    experience: { [experienceId]: { description: "Placeholder wording" } },
    projects: { placeholder: { description: "Placeholder project" } },
    futureBranch: { preserved: true },
  };

  const migrated = migrateProject({ ...current, schemaVersion: 2 });

  assert.equal(migrated.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(migrated.resumes[0].contentOverrides, {
    futureBranch: { preserved: true },
  });
  assert.equal(
    materializeResumeData(migrated, migrated.resumes[0].id).experience[0].description,
    current.profile.experience[0].description
  );
});

test("schema v3 rejects malformed known override branches", () => {
  const project = createEmptyProject();
  project.resumes[0].contentOverrides = { experience: [] };

  assert.throws(
    () => normalizeProject(project),
    (error) => error.code === "INVALID_CONTENT_OVERRIDE"
  );
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
  project.resumes[0].template = "modern";
  project.resumes[0].accentColor = "#123456";
  project.resumes[0].sectionOrder = ["projects", "experience"];
  project.resumes[0].selectedItems = {
    experience: [project.profile.experience[0].id],
    projects: [],
  };
  project.resumes[0].contentOverrides = {
    experience: {
      [project.profile.experience[0].id]: { description: "Targeted wording" },
    },
  };
  const result = duplicateResumeDocument(project, project.resumes[0].id);

  assert.equal(result.project.resumes.length, 2);
  assert.notEqual(result.project.resumes[0].id, result.project.resumes[1].id);
  assert.equal(result.project.profile.personalInfo.fullName, "One Profile");
  assert.equal(result.project.resumes[1].name, "Resume 2");
  assert.equal(result.project.resumes[1].template, "modern");
  assert.equal(result.project.resumes[1].accentColor, "#123456");
  assert.deepEqual(result.project.resumes[1].sectionOrder, ["projects", "experience"]);
  assert.deepEqual(result.project.resumes[1].selectedItems, project.resumes[0].selectedItems);
  assert.deepEqual(result.project.resumes[1].contentOverrides, project.resumes[0].contentOverrides);
});

test("two variants keep presentation separate while sharing canonical company facts", () => {
  const project = createEmptyProject();
  project.profile.experience[0] = {
    ...project.profile.experience[0],
    company: "Acme",
    role: "Engineer",
  };
  const generalId = project.resumes[0].id;
  project.resumes[0] = {
    ...project.resumes[0],
    name: "General Resume",
    template: "modern",
    accentColor: "#111111",
    sectionOrder: ["experience", "projects"],
  };
  const duplicated = duplicateResumeDocument(project, generalId);
  const targetedId = duplicated.resumeId;
  let updated = updateResumeDocument(duplicated.project, targetedId, {
    name: "Targeted Resume",
    template: "minimal",
    accentColor: "#abcdef",
    sectionOrder: ["projects", "experience"],
  });
  const editorData = materializeResumeEditorData(updated, generalId);
  editorData.experience[0].company = "ZenID";
  updated = applyResumeData(updated, generalId, editorData);

  const general = getResumeDocument(updated, generalId);
  const targeted = getResumeDocument(updated, targetedId);
  assert.deepEqual(
    [general.name, general.template, general.accentColor, general.sectionOrder],
    ["General Resume", "modern", "#111111", ["experience", "projects"]]
  );
  assert.deepEqual(
    [targeted.name, targeted.template, targeted.accentColor, targeted.sectionOrder],
    ["Targeted Resume", "minimal", "#abcdef", ["projects", "experience"]]
  );
  assert.equal(materializeResumeData(updated, generalId).experience[0].company, "ZenID");
  assert.equal(materializeResumeData(updated, targetedId).experience[0].company, "ZenID");
});

test("resume item selections filter output without hiding canonical editor data", () => {
  const project = createEmptyProject();
  project.profile.experience = [
    { id: "backend", company: "ZenID", role: "Backend Engineer" },
    { id: "retail", company: "Store", role: "Retail Associate" },
  ];
  project.profile.projects = [
    { id: "api", name: "API Project" },
    { id: "landing", name: "Landing Page" },
  ];
  const generalId = project.resumes[0].id;
  const duplicated = duplicateResumeDocument(project, generalId);
  const backendId = duplicated.resumeId;
  let selected = updateResumeItemSelection(
    duplicated.project,
    backendId,
    "experience",
    "retail",
    false
  );
  selected = updateResumeItemSelection(selected, backendId, "projects", "landing", false);

  assert.deepEqual(
    materializeResumeEditorData(selected, backendId).experience.map((item) => item.id),
    ["backend", "retail"]
  );
  assert.deepEqual(
    materializeResumeData(selected, generalId).experience.map((item) => item.id),
    ["backend", "retail"]
  );
  assert.deepEqual(
    materializeResumeData(selected, backendId).experience.map((item) => item.id),
    ["backend"]
  );
  assert.deepEqual(
    materializeResumeData(selected, backendId).projects.map((item) => item.id),
    ["api"]
  );
  assert.equal(selected.profile.experience.length, 2);
});

test("an explicit empty selection hides a section and a new item joins only the active allowlist", () => {
  const project = createEmptyProject();
  const resumeId = project.resumes[0].id;
  project.resumes[0].selectedItems = { experience: [] };
  const editorData = materializeResumeEditorData(project, resumeId);
  editorData.experience.push({ id: "new-experience", company: "ZenID", role: "Engineer" });

  const updated = applyResumeData(project, resumeId, editorData);

  assert.deepEqual(getResumeDocument(updated, resumeId).selectedItems.experience, ["new-experience"]);
  assert.deepEqual(
    materializeResumeData(updated, resumeId).experience.map((item) => item.id),
    ["new-experience"]
  );
});

test("description overrides affect only one resume output and can explicitly blank wording", () => {
  const project = createEmptyProject();
  project.profile.experience[0] = {
    ...project.profile.experience[0],
    company: "ZenID",
    role: "Engineer",
    description: "Shared verified wording",
  };
  project.profile.projects[0] = {
    ...project.profile.projects[0],
    name: "ZenID Project",
    description: "Shared project wording",
  };
  const generalId = project.resumes[0].id;
  const duplicated = duplicateResumeDocument(project, generalId);
  const targetedId = duplicated.resumeId;
  let updated = setResumeContentOverride(
    duplicated.project,
    targetedId,
    "experience",
    project.profile.experience[0].id,
    "Targeted backend wording"
  );
  updated = setResumeContentOverride(
    updated,
    targetedId,
    "projects",
    project.profile.projects[0].id,
    ""
  );

  assert.equal(materializeResumeEditorData(updated, targetedId).experience[0].description, "Shared verified wording");
  assert.equal(materializeResumeData(updated, generalId).experience[0].description, "Shared verified wording");
  assert.equal(materializeResumeData(updated, targetedId).experience[0].description, "Targeted backend wording");
  assert.equal(materializeResumeData(updated, targetedId).projects[0].description, "");
  assert.equal(updated.profile.experience[0].description, "Shared verified wording");
});

test("resetting an override uses the latest canonical wording", () => {
  const project = createEmptyProject();
  const resumeId = project.resumes[0].id;
  const experienceId = project.profile.experience[0].id;
  project.profile.experience[0].description = "Original shared wording";
  let updated = setResumeContentOverride(
    project,
    resumeId,
    "experience",
    experienceId,
    "Targeted wording"
  );
  const editorData = materializeResumeEditorData(updated, resumeId);
  editorData.experience[0].description = "Latest shared wording";
  updated = applyResumeData(updated, resumeId, editorData);
  updated = resetResumeContentOverride(updated, resumeId, "experience", experienceId);

  assert.equal(materializeResumeData(updated, resumeId).experience[0].description, "Latest shared wording");
  assert.equal(updated.resumes[0].contentOverrides.experience, undefined);
});

test("deleting a canonical item removes its overrides from every resume", () => {
  const project = createEmptyProject();
  const experienceId = project.profile.experience[0].id;
  const firstId = project.resumes[0].id;
  const duplicated = duplicateResumeDocument(project, firstId);
  let updated = setResumeContentOverride(
    duplicated.project,
    firstId,
    "experience",
    experienceId,
    "First wording"
  );
  updated = setResumeContentOverride(
    updated,
    duplicated.resumeId,
    "experience",
    experienceId,
    "Second wording"
  );
  const editorData = materializeResumeEditorData(updated, firstId);
  editorData.experience = [];
  updated = applyResumeData(updated, firstId, editorData);

  updated.resumes.forEach((resume) => {
    assert.equal(resume.contentOverrides.experience, undefined);
  });
});

test("an override for an excluded or orphan item never enters output", () => {
  const project = createEmptyProject();
  const resumeId = project.resumes[0].id;
  const experienceId = project.profile.experience[0].id;
  let updated = setResumeContentOverride(
    project,
    resumeId,
    "experience",
    experienceId,
    "Hidden targeted wording"
  );
  updated = updateResumeItemSelection(updated, resumeId, "experience", experienceId, false);
  updated.resumes[0].contentOverrides.experience.orphan = { description: "Orphan wording" };

  assert.deepEqual(materializeResumeData(updated, resumeId).experience, []);
  assert.equal(updated.resumes[0].contentOverrides.experience.orphan.description, "Orphan wording");
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
