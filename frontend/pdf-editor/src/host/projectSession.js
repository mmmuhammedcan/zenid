// SPEC-011 T009 — open, validate, and save a project from the Node host.
//
// This is the filesystem-facing half of the plugin. It holds one working
// project in memory (D-025) and makes persistence an explicit, deliberate act.
//
// The save default is the important design choice here. An agent editing
// someone's professional history should not be able to destroy the original
// file as a side effect of being helpful, so a save writes a new sibling file
// unless the caller explicitly asks to overwrite (BR-004, AC-007).
//
// Only paths the caller supplies are touched. Nothing scans the filesystem
// (BR-009), and nothing reaches the network (BR-001).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { parseProjectFileBytes, serializeProjectArchive } from "../resume/projectFile.js";
import {
  CURRENT_SCHEMA_VERSION,
  normalizeProject,
  ProjectCompatibilityError,
} from "../resume/projectSchema.js";

const PROFILE_SECTIONS = [
  "domains",
  "skills",
  "experience",
  "projects",
  "achievements",
  "certifications",
  "education",
];

// A structural summary, deliberately without section prose. An agent asked to
// improve one bullet should not have to ingest an entire career to find it
// (BR-010); it calls the section read for the part it actually needs.
export function summarizeProject(project, { migratedFrom = null } = {}) {
  return {
    schemaVersion: project.schemaVersion,
    migratedFrom,
    resumes: project.resumes.map((resume) => ({
      id: resume.id,
      name: resume.name,
      language: resume.language,
      template: resume.template,
    })),
    sections: Object.fromEntries(
      PROFILE_SECTIONS.map((section) => [section, (project.profile[section] || []).length])
    ),
    portfolio: {
      language: project.portfolio.language,
      resumeEnabled: project.portfolio.resume.enabled,
      visibleSections: Object.entries(project.portfolio.visibleSections)
        .filter(([, visible]) => visible)
        .map(([section]) => section),
      publishedContactFields: Object.entries(project.portfolio.contactPrivacy)
        .filter(([, published]) => published)
        .map(([field]) => field),
      hiddenItemCounts: Object.fromEntries(
        Object.entries(project.portfolio.hiddenItems).map(([field, ids]) => [field, ids.length])
      ),
    },
  };
}

export async function openProject(filePath) {
  const bytes = new Uint8Array(await readFile(filePath));

  // Read the declared schema before migration so the summary can tell the user
  // their file was upgraded rather than silently changing it underneath them.
  let declaredVersion = null;
  try {
    const text = new TextDecoder().decode(bytes.subarray(0, 256)).trimStart();
    if (text.startsWith("{")) {
      declaredVersion = JSON.parse(new TextDecoder().decode(bytes))?.schemaVersion ?? null;
    }
  } catch {
    declaredVersion = null;
  }

  const project = parseProjectFileBytes(bytes);
  const migratedFrom =
    typeof declaredVersion === "number" && declaredVersion < CURRENT_SCHEMA_VERSION
      ? declaredVersion
      : null;

  return {
    path: filePath,
    project,
    summary: summarizeProject(project, { migratedFrom }),
  };
}

// Mechanical checks only. These are properties of the document that can be
// decided without judging the quality of someone's career, which is not a
// promise ZenID should make. SPEC-011 Q-005 leaves the wider question of how
// much ATS analysis to claim to the creator; this set is intentionally the
// narrow, defensible one.
function mechanicalFindings(project) {
  const findings = [];
  const info = project.profile.personalInfo || {};

  if (!info.fullName) findings.push({ code: "NO_FULL_NAME", message: "The profile has no full name." });
  if (!info.email) {
    findings.push({ code: "NO_CONTACT_EMAIL", message: "The profile has no contact email address." });
  }
  if (!info.email && !info.phone) {
    findings.push({ code: "NO_CONTACT_METHOD", message: "The profile has no email address and no phone number." });
  }

  const emptySections = PROFILE_SECTIONS.filter((section) => (project.profile[section] || []).length === 0);
  if (emptySections.length > 0) {
    findings.push({
      code: "EMPTY_SECTIONS",
      message: `These sections have no entries: ${emptySections.join(", ")}.`,
      sections: emptySections,
    });
  }

  project.resumes.forEach((resume) => {
    const selections = resume.selectedItems || {};
    Object.entries(selections).forEach(([field, ids]) => {
      if (Array.isArray(ids) && ids.length === 0) {
        findings.push({
          code: "RESUME_SECTION_EMPTIED",
          message: `Resume "${resume.name}" excludes every ${field} entry.`,
          resumeId: resume.id,
          field,
        });
      }
    });
  });

  return findings;
}

// Reports rather than throws, because an agent should be able to ask "is this
// project sound?" without the answer being an exception it has to catch.
export function validateProject(project) {
  try {
    const normalized = normalizeProject(project);
    return {
      valid: true,
      schemaVersion: normalized.schemaVersion,
      errors: [],
      findings: mechanicalFindings(normalized),
    };
  } catch (error) {
    return {
      valid: false,
      schemaVersion: project?.schemaVersion ?? null,
      errors: [{ code: error.code || "INCOMPATIBLE_PROJECT", message: error.message }],
      findings: [],
    };
  }
}

function nextAvailablePath(originalPath, attempt) {
  const directory = path.dirname(originalPath);
  const extension = path.extname(originalPath);
  const base = path.basename(originalPath, extension);
  const suffix = attempt === 0 ? "edited" : `edited-${attempt + 1}`;
  return path.join(directory, `${base}.${suffix}${extension}`);
}

export async function saveProject(session, { path: requestedPath, overwrite = false } = {}) {
  // Serialize first. If the project is not sound, no file is created at all,
  // rather than a truncated or invalid one being left behind (AC-010).
  const bytes = serializeProjectArchive(session.project);

  if (overwrite && !requestedPath && !session.path) {
    throw new ProjectCompatibilityError("There is no opened path to overwrite.", "NO_TARGET_PATH");
  }

  let targetPath = requestedPath || (overwrite ? session.path : null);
  let flag = "w";

  if (!targetPath) {
    // Find a free name instead of overwriting a previous save.
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const candidate = nextAvailablePath(session.path, attempt);
      try {
        await writeFile(candidate, Buffer.from(bytes), { flag: "wx" });
        return { path: candidate, bytes: bytes.byteLength, overwritten: false };
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
    throw new ProjectCompatibilityError(
      "Could not find an unused file name to save to. Pass an explicit path.",
      "NO_TARGET_PATH"
    );
  }

  // An explicit path is still not licence to clobber an unrelated file.
  if (!overwrite) flag = "wx";
  await writeFile(targetPath, Buffer.from(bytes), { flag });

  return {
    path: targetPath,
    bytes: bytes.byteLength,
    overwritten: Boolean(overwrite) && targetPath === session.path,
  };
}
