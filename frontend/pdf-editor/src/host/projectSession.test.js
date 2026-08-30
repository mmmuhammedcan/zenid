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

import { openProject, saveProject, validateProject } from "./projectSession.js";
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
