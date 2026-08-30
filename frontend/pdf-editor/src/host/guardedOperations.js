// SPEC-011 T007 — the guarded operation layer.
//
// This module sits between the MCP tools and the pure schema functions, and it
// is where D-025 and D-026 are enforced. Two rules matter:
//
// 1. Presentation versus fact. An agent may rewrite how an item reads on one
//    résumé variant. Changing what the item asserts about the user's history —
//    the employer, the institution, the dates, a credential identifier — is a
//    different act with different consequences, so it needs a different tool
//    and is always reported with old and new values.
//
// 2. The publication scope may narrow but never widen. Whatever the user chose
//    to keep private stays private. This is checked as a comparison between the
//    project before and after, so a tool that forgets to think about privacy
//    still cannot leak anything.
//
// Every operation returns { project, changes } rather than a bare project, so
// the caller can always tell the user exactly what happened (BR-003).

import {
  getResumeDocument,
  materializeResumeData,
  ProjectCompatibilityError,
  resetResumeContentOverride,
  setResumeContentOverride,
  updatePortfolio,
  updateProjectProfile,
  updateResumeItemSelection,
  RESUME_OVERRIDE_FIELDS,
} from "../resume/projectSchema.js";

export class PresentationBoundaryError extends ProjectCompatibilityError {
  constructor(message) {
    super(message, "PRESENTATION_BOUNDARY");
    this.name = "PresentationBoundaryError";
  }
}

export class PublicationGuardError extends ProjectCompatibilityError {
  constructor(message) {
    super(message, "PUBLICATION_WIDENED");
    this.name = "PublicationGuardError";
  }
}

// The only key a wording tool is allowed to write. Everything else on an item
// is a claim about the user's history.
const PRESENTATION_KEYS = new Set(["description"]);

function findItem(project, field, itemId) {
  const items = project.profile?.[field];
  if (!Array.isArray(items)) {
    throw new ProjectCompatibilityError(`Unknown profile section: ${field}.`, "UNKNOWN_SECTION");
  }
  const item = items.find((entry) => entry.id === itemId);
  if (!item) {
    throw new ProjectCompatibilityError(`Item ${itemId} was not found in ${field}.`, "ITEM_NOT_FOUND");
  }
  return item;
}

// --- Publication guard -------------------------------------------------------

function widenedBooleanMap(before = {}, after = {}, prefix) {
  return Object.keys({ ...before, ...after })
    .filter((key) => after[key] === true && before[key] !== true)
    .map((key) => `${prefix}.${key}`);
}

function widenedHiddenItems(before = {}, after = {}) {
  return Object.keys({ ...before, ...after })
    .filter((field) => {
      const afterIds = new Set(after[field] || []);
      return (before[field] || []).some((id) => !afterIds.has(id));
    })
    .map((field) => `hiddenItems.${field}`);
}

function mediaEntries(media = {}) {
  const entries = [];
  if (media.profileImageId) entries.push("media.profileImageId");
  for (const key of ["projectImageIds", "projectGalleryIds", "certificateImageIds"]) {
    for (const [itemId, value] of Object.entries(media[key] || {})) {
      const count = Array.isArray(value) ? value.length : value ? 1 : 0;
      if (count > 0) entries.push(`media.${key}.${itemId}`);
    }
  }
  return entries;
}

// Compares two projects and refuses if the second publishes anything the first
// did not. Exported so that every tool, present and future, can call it.
export function assertPublicationNotWidened(before, after) {
  const a = before.portfolio || {};
  const b = after.portfolio || {};

  const widened = [
    ...widenedBooleanMap(a.contactPrivacy, b.contactPrivacy, "contactPrivacy"),
    ...widenedBooleanMap(a.visibleSections, b.visibleSections, "visibleSections"),
    ...widenedHiddenItems(a.hiddenItems, b.hiddenItems),
  ];

  const beforeMedia = new Set(mediaEntries(a.media));
  for (const entry of mediaEntries(b.media)) {
    if (!beforeMedia.has(entry)) widened.push(entry);
  }

  if (b.resume?.enabled === true && a.resume?.enabled !== true) {
    widened.push("portfolio.resume.enabled");
  }

  if (widened.length > 0) {
    throw new PublicationGuardError(
      `This change would publish information the user has not chosen to publish (${widened.join(", ")}). ` +
        "Publication settings can only be narrowed here; widening them is done by the user in ZenID."
    );
  }
  return after;
}

// --- Change reporting --------------------------------------------------------

function diffRecord(before = {}, after = {}, pathPrefix) {
  return Object.keys(after)
    .filter((key) => before[key] !== after[key])
    .map((key) => ({ path: `${pathPrefix}.${key}`, before: before[key], after: after[key] }));
}

// --- Presentation edits ------------------------------------------------------

export function setWording(project, { resumeId, field, itemId, description, ...rest }) {
  const factualKeys = Object.keys(rest).filter((key) => !PRESENTATION_KEYS.has(key));
  if (factualKeys.length > 0) {
    throw new PresentationBoundaryError(
      `A wording tool cannot change ${factualKeys.join(", ")} because ${
        factualKeys.length === 1 ? "it is" : "they are"
      } a statement of fact about the user's history, not presentation. ` +
        "Use zenid_edit_fact, which records the old and new value."
    );
  }
  if (!RESUME_OVERRIDE_FIELDS.includes(field)) {
    throw new PresentationBoundaryError(
      `Wording overrides are only supported for ${RESUME_OVERRIDE_FIELDS.join(" and ")}, not ${field}. ` +
        "Use zenid_edit_fact to correct the underlying entry."
    );
  }
  if (typeof description !== "string") {
    throw new PresentationBoundaryError("A wording edit needs a description string.");
  }

  const previous = materializeResumeData(project, resumeId)?.[field]?.find((item) => item.id === itemId);
  const next = setResumeContentOverride(project, resumeId, field, itemId, description);
  const targetResumeId = getResumeDocument(project, resumeId).id;

  return {
    project: assertPublicationNotWidened(project, next),
    changes: [
      {
        path: `resumes.${targetResumeId}.contentOverrides.${field}.${itemId}.description`,
        before: previous?.description,
        after: description,
      },
    ],
  };
}

export function resetWording(project, { resumeId, field, itemId }) {
  const before = materializeResumeData(project, resumeId)?.[field]?.find((item) => item.id === itemId);
  const next = resetResumeContentOverride(project, resumeId, field, itemId);
  const after = materializeResumeData(next, resumeId)?.[field]?.find((item) => item.id === itemId);

  return {
    project: assertPublicationNotWidened(project, next),
    changes:
      before?.description === after?.description
        ? []
        : [
            {
              path: `resumes.${getResumeDocument(project, resumeId).id}.contentOverrides.${field}.${itemId}.description`,
              before: before?.description,
              after: after?.description,
            },
          ],
  };
}

export function setItemSelection(project, { resumeId, field, itemId, included }) {
  const wasIncluded = Boolean(
    materializeResumeData(project, resumeId)?.[field]?.some((item) => item.id === itemId)
  );
  const next = updateResumeItemSelection(project, resumeId, field, itemId, included);

  return {
    project: assertPublicationNotWidened(project, next),
    changes:
      wasIncluded === Boolean(included)
        ? []
        : [
            {
              path: `resumes.${getResumeDocument(project, resumeId).id}.selectedItems.${field}.${itemId}`,
              before: wasIncluded,
              after: Boolean(included),
            },
          ],
  };
}

// --- Fact edits --------------------------------------------------------------

// The one place a factual claim may change. It always reports what moved, so a
// user reviewing an agent session can see every assertion that was altered.
export function editFact(project, { field, itemId, changes }) {
  if (!changes || typeof changes !== "object") {
    throw new ProjectCompatibilityError("A fact edit needs a changes object.", "INVALID_FACT_EDIT");
  }

  if (field === "personalInfo") {
    const before = project.profile.personalInfo;
    const reported = diffRecord(before, changes, "profile.personalInfo");
    if (reported.length === 0) return { project, changes: [] };
    const next = updateProjectProfile(project, { personalInfo: { ...before, ...changes } });
    return { project: assertPublicationNotWidened(project, next), changes: reported };
  }

  const item = findItem(project, field, itemId);
  const reported = diffRecord(item, changes, `profile.${field}.${itemId}`);
  if (reported.length === 0) return { project, changes: [] };

  const next = updateProjectProfile(project, {
    [field]: project.profile[field].map((entry) =>
      entry.id === itemId ? { ...entry, ...changes, id: entry.id } : entry
    ),
  });

  return { project: assertPublicationNotWidened(project, next), changes: reported };
}

// --- Portfolio settings ------------------------------------------------------

export function applyPortfolioSettings(project, updates) {
  if (!updates || typeof updates !== "object") {
    throw new ProjectCompatibilityError("A portfolio update needs an object.", "INVALID_PORTFOLIO_UPDATE");
  }

  // Merge nested groups rather than replacing them, so a caller touching one
  // flag does not silently reset the others.
  const merged = { ...updates };
  for (const key of ["contactPrivacy", "visibleSections", "hiddenItems", "media", "resume"]) {
    if (updates[key] && typeof updates[key] === "object" && !Array.isArray(updates[key])) {
      merged[key] = { ...project.portfolio[key], ...updates[key] };
    }
  }

  const next = updatePortfolio(project, merged);
  assertPublicationNotWidened(project, next);

  const changes = Object.keys(updates).flatMap((key) =>
    JSON.stringify(project.portfolio[key]) === JSON.stringify(next.portfolio[key])
      ? []
      : [{ path: `portfolio.${key}`, before: project.portfolio[key], after: next.portfolio[key] }]
  );

  return { project: next, changes };
}
