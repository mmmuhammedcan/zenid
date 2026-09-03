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
// promise ZenID should make. D-028 grounds the checks below in the binary,
// structural rules from `zenid-resume-checklist.pdf` (a location the reader
// can place you by, at least one working professional link, a dated entry so
// reverse chronology is legible, and one date convention throughout) rather
// than any judgment of whether the content itself is compelling.
const YYYY_MM = /^\d{4}-\d{2}$/;

function dateShape(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.toLowerCase() === "present") return null; // "present" carries no format of its own.
  return YYYY_MM.test(text) ? "yyyy-mm" : "free-text";
}

// Matches getFilledSections's definition of a filled row (resumeSections.js),
// so "started writing this entry" means the same thing here as it does when
// the application itself decides whether to render a section.
function hasContent(field, item) {
  if (field === "education") return Boolean(item.institution || item.degree);
  return Boolean(item.company || item.role);
}

function findUndatedAndInconsistentDates(project, findings) {
  const shapesSeen = new Set();

  [
    { field: "experience", items: project.profile.experience || [] },
    { field: "education", items: project.profile.education || [] },
  ].forEach(({ field, items }) => {
    items.forEach((item) => {
      // An unfilled scaffold row (normalizeProject's default placeholder) is
      // not a real entry with a missing date; only flag entries the user has
      // actually started writing.
      if (!hasContent(field, item)) return;
      if (!item.startDate) {
        findings.push({
          code: "UNDATED_ITEM",
          message: `A ${field} entry has no start date, so reverse-chronological order cannot be inferred.`,
          field,
          itemId: item.id,
        });
        return;
      }
      const shape = dateShape(item.startDate);
      if (shape) shapesSeen.add(shape);
      const endShape = dateShape(item.endDate);
      if (endShape) shapesSeen.add(endShape);
    });
  });

  if (shapesSeen.size > 1) {
    findings.push({
      code: "INCONSISTENT_DATE_FORMAT",
      message:
        "Dates are written in more than one format across entries (for example \"2025-06\" and " +
        "\"June 2023\"). Use one convention throughout.",
    });
  }
}

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
  if (!info.city && !info.state) {
    findings.push({
      code: "NO_LOCATION",
      message: "The header has no city or region, so a reader cannot place where you're based.",
    });
  }
  if (!info.linkedin && !info.github && !info.portfolio) {
    findings.push({
      code: "NO_PROFESSIONAL_LINK",
      message: "The header has no LinkedIn, GitHub, or portfolio link.",
    });
  }

  const emptySections = PROFILE_SECTIONS.filter((section) => (project.profile[section] || []).length === 0);
  if (emptySections.length > 0) {
    findings.push({
      code: "EMPTY_SECTIONS",
      message: `These sections have no entries: ${emptySections.join(", ")}.`,
      sections: emptySections,
    });
  }

  findUndatedAndInconsistentDates(project, findings);

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

// D-029: seven equal-weight, binary criteria computed straight from the
// mechanical findings above (plus one direct content check), so the score is
// arithmetic over already-explained facts rather than a second, hidden
// judgment. Deliberately not weighted or tuned to "feel right" - an unequal
// weighting would itself be an unstated opinion about which gap matters
// more, which is exactly the kind of judgment D-028/D-029 keep out of the
// server.
function hasRealExperienceAndSkills(project) {
  const experienceFilled = (project.profile.experience || []).some((e) => e.company || e.role);
  const skillsFilled = (project.profile.skills || []).some((s) => s.items && String(s.items).trim());
  return experienceFilled && skillsFilled;
}

function computeAtsScore(project, findings) {
  const has = (code) => findings.some((f) => f.code === code);

  const criteria = [
    {
      key: "fullName",
      label: "A full name is present",
      passed: !has("NO_FULL_NAME"),
      recommendation: "Add your full name to the profile header.",
    },
    {
      key: "contactMethod",
      label: "An email address or phone number is present",
      passed: !has("NO_CONTACT_METHOD"),
      recommendation: "Add an email address or phone number.",
    },
    {
      key: "location",
      label: "A city or region is present",
      passed: !has("NO_LOCATION"),
      recommendation: "Add a city or region to the header.",
    },
    {
      key: "professionalLink",
      label: "A LinkedIn, GitHub, or portfolio link is present",
      passed: !has("NO_PROFESSIONAL_LINK"),
      recommendation: "Add a LinkedIn, GitHub, or portfolio link.",
    },
    {
      key: "sectionsFilled",
      label: "At least one real experience entry and a listed skill are present",
      passed: hasRealExperienceAndSkills(project),
      recommendation: "Add at least one real experience entry and list your skills.",
    },
    {
      key: "datedEntries",
      label: "Every experience and education entry has a start date",
      passed: !has("UNDATED_ITEM"),
      recommendation: "Add a start date to every experience and education entry.",
    },
    {
      key: "consistentDates",
      label: "Dates use one consistent format",
      passed: !has("INCONSISTENT_DATE_FORMAT"),
      recommendation: "Use one date format (for example YYYY-MM) throughout.",
    },
  ].map((c) => (c.passed ? { key: c.key, label: c.label, passed: true } : c));

  const passed = criteria.filter((c) => c.passed).length;
  const total = criteria.length;
  return { percent: Math.round((passed / total) * 100), passed, total, criteria };
}

// Reports rather than throws, because an agent should be able to ask "is this
// project sound?" without the answer being an exception it has to catch.
export function validateProject(project) {
  try {
    const normalized = normalizeProject(project);
    const findings = mechanicalFindings(normalized);
    return {
      valid: true,
      schemaVersion: normalized.schemaVersion,
      errors: [],
      findings,
      atsScore: computeAtsScore(normalized, findings),
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
