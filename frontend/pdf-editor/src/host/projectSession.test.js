// SPEC-011 T008 — open, validate, and save.
//
// These cover the tools that touch the user's filesystem, which is where a
// mistake is least recoverable. The non-overwriting save (AC-007) is the case
// that matters most: an agent working on a user's career history must not be
// able to destroy the original by default.

import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { createProject, openProject, saveProject, validateProject } from "./projectSession.js";
import {
  CURRENT_SCHEMA_VERSION,
  normalizeProject,
  ProjectCompatibilityError,
} from "../resume/projectSchema.js";
import { parseProjectFileBytes, serializeProjectArchive } from "../resume/projectFile.js";

async function workspace() {
  return mkdtemp(path.join(tmpdir(), "zenid-mcp-test-"));
}

function syntheticProject() {
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      personalInfo: { fullName: "Ada Yılmaz", title: "Software Engineer", email: "ada@example.test" },
      experience: [
        {
          id: "experience-labs",
          company: "Example Labs",
          role: "Software Engineering Intern",
          startDate: "2025-06",
          endDate: "2025-08",
          description: "Built a local-first document workflow.",
          isCurrentlyWorking: false,
        },
      ],
      projects: [{ id: "project-docs", name: "Local Document Workspace", description: "Local-first." }],
      skills: [{ id: "skill-programming", category: "Programming", items: "JavaScript, Python" }],
    },
    resumes: [
      {
        id: "resume-general",
        name: "General Resume",
        language: "en",
        template: "minimal",
        accentColor: "#1F2A44",
        selectedItems: {},
        contentOverrides: {},
      },
    ],
  });
}

async function writeFixture(directory, project, fileName = "project.zenid") {
  const filePath = path.join(directory, fileName);
  await writeFile(filePath, Buffer.from(serializeProjectArchive(project)));
  return filePath;
}

// --- D-030: a project can begin entirely through conversation ----------------

test("creating a project returns an unsaved, empty current-schema workspace", () => {
  const session = createProject({ resumeName: "Graduate CV", language: "tr" });

  assert.equal(session.path, null);
  assert.equal(session.project.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(session.summary.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(session.summary.resumes.length, 1);
  assert.equal(session.summary.resumes[0].name, "Graduate CV");
  assert.equal(session.summary.resumes[0].language, "tr");
  assert.equal(session.summary.sections.experience, 0);
  assert.equal(session.summary.sections.skills, 0);
});

test("a newly created project requires an explicit save path", async () => {
  const session = createProject();

  await assert.rejects(() => saveProject(session), (error) => {
    assert.equal(error.code, "NO_TARGET_PATH");
    assert.match(error.message, /explicit path/i);
    return true;
  });
});

test("a newly created project saves and reopens when given an explicit path", async () => {
  const directory = await workspace();
  const targetPath = path.join(directory, "new-profile.zenid");
  const session = createProject({ resumeName: "First CV" });

  const saved = await saveProject(session, { path: targetPath });
  const reopened = parseProjectFileBytes(new Uint8Array(await readFile(saved.path)));

  assert.equal(saved.path, targetPath);
  assert.equal(reopened.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(reopened.resumes[0].name, "First CV");
});

// --- AC-001: the open summary is structural, not the whole history ----------

test("opening a project returns a structural summary and no section prose", async () => {
  const directory = await workspace();
  const filePath = await writeFixture(directory, syntheticProject());

  const session = await openProject(filePath);

  assert.equal(session.path, filePath);
  assert.equal(session.summary.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(session.summary.resumes, [
    { id: "resume-general", name: "General Resume", language: "en", template: "minimal" },
  ]);
  assert.equal(session.summary.sections.experience, 1);
  assert.equal(session.summary.sections.projects, 1);
  assert.equal(session.summary.sections.skills, 1);
  assert.equal(session.summary.portfolio.resumeEnabled, false);
  assert.equal(session.summary.portfolio.publishedContactFields.length, 0);

  // BR-010: the agent must not be handed the whole professional history to
  // change one bullet.
  const serialized = JSON.stringify(session.summary);
  assert.doesNotMatch(serialized, /Built a local-first document workflow/);
  assert.doesNotMatch(serialized, /Example Labs/);
});

test("the open summary reports which contact fields are public", async () => {
  const directory = await workspace();
  const project = syntheticProject();
  const published = normalizeProject({
    ...project,
    portfolio: { ...project.portfolio, contactPrivacy: { ...project.portfolio.contactPrivacy, email: true } },
  });
  const filePath = await writeFixture(directory, published, "published.zenid");

  const session = await openProject(filePath);
  assert.deepEqual(session.summary.portfolio.publishedContactFields, ["email"]);
});

// --- AC-002: migration round trip -------------------------------------------

test("an older-schema project migrates on open and saves as a current file", async () => {
  const directory = await workspace();
  const current = syntheticProject();
  // A v1 file carries résumé-level selections that v2 dropped.
  const legacy = {
    ...current,
    schemaVersion: 1,
    resumes: [{ ...current.resumes[0], selectedItems: { experience: ["experience-labs"] } }],
  };
  const filePath = path.join(directory, "legacy.zenid");
  await writeFile(filePath, Buffer.from(new TextEncoder().encode(JSON.stringify(legacy))));

  const session = await openProject(filePath);
  assert.equal(session.summary.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(session.summary.migratedFrom, 1);

  const saved = await saveProject(session, { path: path.join(directory, "migrated.zenid") });
  const reopened = parseProjectFileBytes(new Uint8Array(await readFile(saved.path)));
  assert.equal(reopened.schemaVersion, CURRENT_SCHEMA_VERSION);
});

// --- AC-007: a save never silently destroys the opened file ------------------

test("saving without an explicit overwrite leaves the opened file untouched", async () => {
  const directory = await workspace();
  const filePath = await writeFixture(directory, syntheticProject());
  const originalBytes = await readFile(filePath);

  const session = await openProject(filePath);
  const edited = {
    ...session,
    project: normalizeProject({
      ...session.project,
      profile: {
        ...session.project.profile,
        personalInfo: { ...session.project.profile.personalInfo, title: "Senior Software Engineer" },
      },
    }),
  };

  const saved = await saveProject(edited);

  assert.notEqual(saved.path, filePath);
  assert.deepEqual(await readFile(filePath), originalBytes, "the opened file was modified");
  const written = parseProjectFileBytes(new Uint8Array(await readFile(saved.path)));
  assert.equal(written.profile.personalInfo.title, "Senior Software Engineer");
});

test("saving twice without overwrite does not clobber the first copy", async () => {
  const directory = await workspace();
  const filePath = await writeFixture(directory, syntheticProject());
  const session = await openProject(filePath);

  const first = await saveProject(session);
  const second = await saveProject(session);

  assert.notEqual(first.path, second.path);
  await readFile(first.path);
});

test("an explicit overwrite request is honoured", async () => {
  const directory = await workspace();
  const filePath = await writeFixture(directory, syntheticProject());
  const session = await openProject(filePath);
  const edited = {
    ...session,
    project: normalizeProject({
      ...session.project,
      profile: {
        ...session.project.profile,
        personalInfo: { ...session.project.profile.personalInfo, title: "Staff Engineer" },
      },
    }),
  };

  const saved = await saveProject(edited, { overwrite: true });
  assert.equal(saved.path, filePath);
  const written = parseProjectFileBytes(new Uint8Array(await readFile(filePath)));
  assert.equal(written.profile.personalInfo.title, "Staff Engineer");
});

// --- AC-010: refusal on failed normalization, and no file written ------------

test("saving a project that fails normalization refuses and writes nothing", async () => {
  const directory = await workspace();
  const filePath = await writeFixture(directory, syntheticProject());
  const session = await openProject(filePath);
  const broken = { ...session, project: { ...session.project, resumes: [] } };
  const targetPath = path.join(directory, "should-not-exist.zenid");

  await assert.rejects(
    () => saveProject(broken, { path: targetPath }),
    (error) => {
      assert.ok(error instanceof ProjectCompatibilityError);
      assert.equal(error.code, "MISSING_RESUME");
      return true;
    }
  );

  await assert.rejects(() => readFile(targetPath), /ENOENT/);
});

test("opening a file that is not a ZenID project fails with a compatibility error", async () => {
  const directory = await workspace();
  const filePath = path.join(directory, "notes.zenid");
  await writeFile(filePath, "this is not a project");
  await assert.rejects(() => openProject(filePath), ProjectCompatibilityError);
});

// --- validate ----------------------------------------------------------------

test("validating a good project reports valid with the schema version", () => {
  const result = validateProject(syntheticProject());
  assert.equal(result.valid, true);
  assert.equal(result.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.deepEqual(result.errors, []);
});

test("validating a broken project reports the originating error code without throwing", () => {
  const result = validateProject({ ...syntheticProject(), resumes: [] });
  assert.equal(result.valid, false);
  assert.equal(result.errors[0].code, "MISSING_RESUME");
});

test("validation reports mechanical findings without judging the user's content", () => {
  const project = syntheticProject();
  const missingContact = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      personalInfo: { ...project.profile.personalInfo, email: "" },
    },
  });

  const result = validateProject(missingContact);
  assert.equal(result.valid, true);
  assert.ok(
    result.findings.some((finding) => finding.code === "NO_CONTACT_EMAIL"),
    "expected a mechanical finding about the missing contact email"
  );
});

// --- SPEC-011 D-028: ATS-mechanical findings from the checklist's binary rules ---

test("validation flags a missing header location", () => {
  const project = syntheticProject();
  const noLocation = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      personalInfo: { ...project.profile.personalInfo, city: "", state: "" },
    },
  });
  const result = validateProject(noLocation);
  assert.ok(result.findings.some((finding) => finding.code === "NO_LOCATION"));
});

test("validation does not flag a header location when city is present", () => {
  const project = syntheticProject();
  const withLocation = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      personalInfo: { ...project.profile.personalInfo, city: "Ankara" },
    },
  });
  const result = validateProject(withLocation);
  assert.ok(!result.findings.some((finding) => finding.code === "NO_LOCATION"));
});

test("validation flags no professional link present", () => {
  const project = syntheticProject();
  const noLinks = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      personalInfo: { ...project.profile.personalInfo, linkedin: "", github: "", portfolio: "" },
    },
  });
  const result = validateProject(noLinks);
  assert.ok(result.findings.some((finding) => finding.code === "NO_PROFESSIONAL_LINK"));
});

test("validation does not flag professional links when github is present", () => {
  const project = syntheticProject();
  const withLink = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      personalInfo: { ...project.profile.personalInfo, github: "https://github.com/ada" },
    },
  });
  const result = validateProject(withLink);
  assert.ok(!result.findings.some((finding) => finding.code === "NO_PROFESSIONAL_LINK"));
});

test("validation flags an experience entry with no start date", () => {
  const project = syntheticProject();
  const undated = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      experience: [{ ...project.profile.experience[0], startDate: "" }],
    },
  });
  const result = validateProject(undated);
  const finding = result.findings.find((f) => f.code === "UNDATED_ITEM");
  assert.ok(finding, "expected an UNDATED_ITEM finding");
  assert.equal(finding.field, "experience");
  assert.equal(finding.itemId, "experience-labs");
});

test("validation flags an education entry with no start date", () => {
  const project = syntheticProject();
  const withEducation = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      education: [
        { id: "edu-1", institution: "Metu", degree: "BSc", field: "CS", startDate: "", endDate: "2024-06" },
      ],
    },
  });
  const result = validateProject(withEducation);
  const finding = result.findings.find((f) => f.code === "UNDATED_ITEM" && f.field === "education");
  assert.ok(finding, "expected an UNDATED_ITEM finding for education");
});

test("validation does not flag a dated experience entry", () => {
  const result = validateProject(syntheticProject());
  assert.ok(!result.findings.some((finding) => finding.code === "UNDATED_ITEM"));
});

test("validation flags inconsistent date formatting across entries", () => {
  const project = syntheticProject();
  const mixedDates = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      experience: [
        { ...project.profile.experience[0], startDate: "2025-06", endDate: "2025-08" },
        {
          id: "experience-second",
          company: "Second Co",
          role: "Engineer",
          startDate: "June 2023",
          endDate: "Present",
          description: "Worked.",
          isCurrentlyWorking: true,
        },
      ],
    },
  });
  const result = validateProject(mixedDates);
  assert.ok(result.findings.some((finding) => finding.code === "INCONSISTENT_DATE_FORMAT"));
});

test("validation does not flag consistent YYYY-MM dates across entries", () => {
  const project = syntheticProject();
  const consistentDates = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      experience: [
        { ...project.profile.experience[0], startDate: "2025-06", endDate: "2025-08" },
        {
          id: "experience-second",
          company: "Second Co",
          role: "Engineer",
          startDate: "2023-06",
          endDate: "2024-01",
          description: "Worked.",
          isCurrentlyWorking: false,
        },
      ],
    },
  });
  const result = validateProject(consistentDates);
  assert.ok(!result.findings.some((finding) => finding.code === "INCONSISTENT_DATE_FORMAT"));
});

// --- SPEC-011 D-029: the deterministic ats score --------------------------

test("a project meeting every criterion scores 100 with all seven criteria passed", () => {
  const project = syntheticProject();
  const complete = normalizeProject({
    ...project,
    profile: {
      ...project.profile,
      personalInfo: { ...project.profile.personalInfo, city: "Ankara", github: "https://github.com/ada" },
    },
  });
  const result = validateProject(complete);
  assert.equal(result.atsScore.percent, 100);
  assert.equal(result.atsScore.passed, 7);
  assert.equal(result.atsScore.total, 7);
  assert.ok(result.atsScore.criteria.every((c) => c.passed === true));
  assert.ok(result.atsScore.criteria.every((c) => !c.recommendation));
});

test("a bare project with only a name and email scores well below 100", () => {
  const project = normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: { personalInfo: { fullName: "Deniz Kaya", email: "deniz@example.test" } },
    resumes: [
      {
        id: "resume-general",
        name: "General Resume",
        language: "en",
        template: "minimal",
        accentColor: "#1F2A44",
        selectedItems: {},
        contentOverrides: {},
      },
    ],
  });
  const result = validateProject(project);
  assert.ok(result.atsScore.percent < 100);
  assert.ok(result.atsScore.passed < result.atsScore.total);
  const failed = result.atsScore.criteria.filter((c) => !c.passed);
  assert.ok(failed.length > 0);
  failed.forEach((c) => assert.ok(c.recommendation, `${c.key} failed with no recommendation`));
});

test("atsScore is stable across repeated calls with no edit (AC-015)", () => {
  const project = syntheticProject();
  const first = validateProject(project).atsScore;
  const second = validateProject(project).atsScore;
  assert.deepEqual(first, second);
});

test("atsScore uses exactly the seven D-029 criteria, by key", () => {
  const result = validateProject(syntheticProject());
  const keys = result.atsScore.criteria.map((c) => c.key).sort();
  assert.deepEqual(
    keys,
    [
      "contactMethod",
      "consistentDates",
      "datedEntries",
      "fullName",
      "location",
      "professionalLink",
      "sectionsFilled",
    ].sort()
  );
});

test("the location criterion fails exactly when NO_LOCATION is a finding", () => {
  const project = syntheticProject();
  const noLocation = normalizeProject({
    ...project,
    profile: { ...project.profile, personalInfo: { ...project.profile.personalInfo, city: "", state: "" } },
  });
  const result = validateProject(noLocation);
  const locationCriterion = result.atsScore.criteria.find((c) => c.key === "location");
  assert.equal(locationCriterion.passed, false);
  assert.ok(result.findings.some((f) => f.code === "NO_LOCATION"));
});
