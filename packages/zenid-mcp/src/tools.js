// SPEC-011 T010 — the MCP tool surface.
//
// This module defines the tools and their handlers, separately from the stdio
// transport, so the behavior can be tested without a subprocess and so the
// protocol layer stays a thin wrapper with nowhere to hide a rule.
//
// The handlers are deliberately boring. Everything that constitutes a promise
// to the user lives one layer down in guardedOperations.js and
// projectSession.js; if a rule appears here instead, it is in the wrong place.

import { z } from "zod";

import {
  openProject,
  saveProject,
  summarizeProject,
  validateProject,
} from "../../../frontend/pdf-editor/src/host/projectSession.js";
import {
  applyPortfolioSettings,
  editFact,
  resetWording,
  setItemSelection,
  setWording,
} from "../../../frontend/pdf-editor/src/host/guardedOperations.js";
import { loadResumeFontData, writeBytes } from "../../../frontend/pdf-editor/src/host/nodeHost.js";
import {
  CURRENT_SCHEMA_VERSION,
  duplicateResumeDocument,
  materializeResumeData,
  ProjectCompatibilityError,
} from "../../../frontend/pdf-editor/src/resume/projectSchema.js";
import {
  buildResumePdf,
  getResumeFileName,
} from "../../../frontend/pdf-editor/src/resume/resumePdfExport.js";
import {
  getPortfolioZipFileName,
  serializePortfolioSite,
} from "../../../frontend/pdf-editor/src/portfolio/portfolioSiteExport.js";

// One working project per server process (D-025). The client holds a path, not
// a copy of the user's history.
export function createSession() {
  return { path: null, project: null, summary: null };
}

function requireOpen(session) {
  if (!session.project) {
    throw new ProjectCompatibilityError(
      "No project is open. Call zenid_open_project with the path to a .zenid file first.",
      "NO_OPEN_PROJECT"
    );
  }
  return session;
}

function applyResult(session, result) {
  session.project = result.project;
  session.summary = summarizeProject(result.project, { migratedFrom: session.summary?.migratedFrom ?? null });
  return { applied: true, changes: result.changes };
}

// What an agent needs to know before it touches someone's professional record.
// It is returned as data rather than restated in every conversation, and it
// reports the live schema version so it cannot quietly drift from the code.
export function describeFormat() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    fileFormat:
      "A .zenid file is a ZIP archive holding one JSON project plus optional media assets. " +
      "ZenID is local-first: the file lives on the user's machine and this server never sends it anywhere.",
    model: {
      profile:
        "The single canonical record of the user's professional history: personalInfo, domains, skills, " +
        "experience, projects, achievements, certifications, education, additionalSection.",
      resumes:
        "Named variants over that one profile. A variant selects which items appear and may override the " +
        "wording of an item, but it never holds its own copy of the facts.",
      portfolio: "The publication settings for the public site, including what is deliberately kept private.",
    },
    presentationVersusFact: {
      presentation:
        "How an item reads: the description text of an experience or project entry, per resume variant. " +
        "Edit with zenid_set_wording, undo with zenid_reset_wording.",
      fact:
        "What an item asserts: employer name, role title, institution, dates, credential identifiers, and " +
        "personal information. Edit only with zenid_edit_fact, which reports the old and new value so the " +
        "user can review every claim that changed.",
      rule:
        "Rewording is presentation. If a change would alter what the user's history says happened, it is a " +
        "fact edit, and inventing one is never acceptable.",
    },
    publicationRules: {
      rule:
        "This server can narrow what is published but never widen it. It cannot set a contactPrivacy or " +
        "visibleSections flag to true, remove an entry from hiddenItems, attach media to the portfolio, or " +
        "enable portfolio.resume.enabled.",
      reason:
        "Deciding to make personal information public is the user's to make in ZenID, not an agent's to make " +
        "on their behalf.",
    },
    saving:
      "Edits are held in memory until zenid_save_project is called. Saving writes a new file by default; " +
      "the opened file is overwritten only when the caller explicitly asks for it.",
  };
}

const resumeTarget = {
  resumeId: z.string().describe("Resume variant id from zenid_list_resumes."),
  field: z.enum(["experience", "projects"]).describe("Profile section holding the item."),
  itemId: z.string().describe("Item id within that section."),
};

// The MCP schema layer strips keys it does not declare, which would turn an
// attempt to rewrite an employer name into a silent no-op: the agent believes
// it changed a fact, the user is never told, and the resume still says
// something else. Declaring the factual keys here means the guard sees them and
// refuses out loud, which is the behavior AC-004 asks for.
const FACTUAL_ITEM_KEYS = [
  "company",
  "role",
  "name",
  "institution",
  "degree",
  "issuer",
  "credentialId",
  "startDate",
  "endDate",
  "date",
  "location",
];

const declaredFactualKeys = Object.fromEntries(
  FACTUAL_ITEM_KEYS.map((key) => [
    key,
    z
      .string()
      .optional()
      .describe(`Factual field. Rejected here; use zenid_edit_fact to change ${key}.`),
  ])
);

// Each entry is { name, config, handler }. The handler returns plain data; the
// protocol layer is responsible only for encoding it.
export function createTools(session) {
  return [
    {
      name: "zenid_describe_format",
      config: {
        title: "Describe the ZenID project format",
        description:
          "Return the ZenID project model, the presentation-versus-fact distinction, and the publication rules this server enforces.",
        inputSchema: {},
      },
      handler: async () => describeFormat(),
    },
    {
      name: "zenid_open_project",
      config: {
        title: "Open a ZenID project",
        description:
          "Load a .zenid file from a path the user supplied and return a structural summary. Section text is not returned; use zenid_read_section.",
        inputSchema: { path: z.string().describe("Absolute path to a .zenid file.") },
      },
      handler: async ({ path: filePath }) => {
        const opened = await openProject(filePath);
        session.path = opened.path;
        session.project = opened.project;
        session.summary = opened.summary;
        return opened.summary;
      },
    },
    {
      name: "zenid_read_section",
      config: {
        title: "Read one profile section",
        description:
          "Return the items of one section as they appear on a resume variant, including any wording overrides.",
        inputSchema: {
          section: z.string().describe("Section name, for example experience or projects."),
          resumeId: z.string().optional().describe("Resume variant; defaults to the first."),
        },
      },
      handler: async ({ section, resumeId }) => {
        requireOpen(session);
        const data = materializeResumeData(session.project, resumeId || session.project.resumes[0].id);
        const items = data[section];
        if (items === undefined) {
          throw new ProjectCompatibilityError(`Unknown section: ${section}.`, "UNKNOWN_SECTION");
        }
        return { section, items };
      },
    },
    {
      name: "zenid_list_resumes",
      config: {
        title: "List resume variants",
        description: "List the resume variants in the open project with their selections and overrides.",
        inputSchema: {},
      },
      handler: async () => {
        requireOpen(session);
        return {
          resumes: session.project.resumes.map((resume) => ({
            id: resume.id,
            name: resume.name,
            language: resume.language,
            template: resume.template,
            selectedItems: resume.selectedItems,
            overriddenItems: Object.fromEntries(
              Object.entries(resume.contentOverrides || {}).map(([field, entries]) => [
                field,
                Object.keys(entries || {}),
              ])
            ),
          })),
        };
      },
    },
    {
      name: "zenid_create_resume_variant",
      config: {
        title: "Duplicate a resume variant",
        description:
          "Copy an existing resume variant so it can be targeted at a role without changing the original.",
        inputSchema: {
          resumeId: z.string().describe("Resume variant to copy."),
          name: z.string().optional().describe("Name for the new variant."),
        },
      },
      handler: async ({ resumeId, name }) => {
        requireOpen(session);
        const { project, resumeId: newId } = duplicateResumeDocument(session.project, resumeId);
        const next = name
          ? {
              ...project,
              resumes: project.resumes.map((resume) =>
                resume.id === newId ? { ...resume, name } : resume
              ),
            }
          : project;
        session.project = next;
        session.summary = summarizeProject(next, { migratedFrom: session.summary?.migratedFrom ?? null });
        const result = next.resumes.find((resume) => resume.id === newId);
        return { resumeId: result.id, name: result.name };
      },
    },
    {
      name: "zenid_set_item_selection",
      config: {
        title: "Include or exclude an item",
        description: "Include or exclude one profile item from a resume variant.",
        inputSchema: { ...resumeTarget, included: z.boolean() },
      },
      handler: async (args) => {
        requireOpen(session);
        return applyResult(session, setItemSelection(session.project, args));
      },
    },
    {
      name: "zenid_set_wording",
      config: {
        title: "Rewrite an item's wording",
        description:
          "Rewrite how one item reads on one resume variant. Presentation only: this cannot change employers, institutions, dates, or credential identifiers.",
        inputSchema: {
          ...resumeTarget,
          ...declaredFactualKeys,
          description: z.string().describe("The new wording."),
        },
      },
      handler: async (args) => {
        requireOpen(session);
        // Drop keys the client sent as explicitly undefined, so an absent
        // field is never mistaken for an attempted factual edit.
        const supplied = Object.fromEntries(
          Object.entries(args).filter(([, value]) => value !== undefined)
        );
        return applyResult(session, setWording(session.project, supplied));
      },
    },
    {
      name: "zenid_reset_wording",
      config: {
        title: "Restore canonical wording",
        description: "Remove a wording override so the item reads as the user originally wrote it.",
        inputSchema: resumeTarget,
      },
      handler: async (args) => {
        requireOpen(session);
        return applyResult(session, resetWording(session.project, args));
      },
    },
    {
      name: "zenid_edit_fact",
      config: {
        title: "Change a factual field",
        description:
          "Change what the user's history asserts. Reports the old and new value of every field it changes. Never invent a fact the user did not state.",
        inputSchema: {
          field: z.string().describe("Section name, or personalInfo."),
          itemId: z.string().optional().describe("Item id; omit for personalInfo."),
          changes: z.record(z.string(), z.any()).describe("Field values to set."),
        },
      },
      handler: async (args) => {
        requireOpen(session);
        return applyResult(session, editFact(session.project, args));
      },
    },
    {
      name: "zenid_set_portfolio_settings",
      config: {
        title: "Adjust portfolio settings",
        description:
          "Change portfolio copy or narrow what is published. Widening publication is refused; that decision stays with the user in ZenID.",
        inputSchema: { updates: z.record(z.string(), z.any()) },
      },
      handler: async ({ updates }) => {
        requireOpen(session);
        return applyResult(session, applyPortfolioSettings(session.project, updates));
      },
    },
    {
      name: "zenid_validate",
      config: {
        title: "Validate the open project",
        description:
          "Report whether the project is structurally sound, plus mechanical findings such as a missing contact method or an emptied section.",
        inputSchema: {},
      },
      handler: async () => {
        requireOpen(session);
        return validateProject(session.project);
      },
    },
    {
      name: "zenid_save_project",
      config: {
        title: "Save the project",
        description:
          "Write the edited project to disk. Writes a new file unless overwrite is explicitly true.",
        inputSchema: {
          path: z.string().optional().describe("Target path; defaults to a new sibling file."),
          overwrite: z.boolean().optional().describe("Overwrite the opened file. Defaults to false."),
        },
      },
      handler: async ({ path: targetPath, overwrite }) => {
        requireOpen(session);
        return saveProject(session, { path: targetPath, overwrite: Boolean(overwrite) });
      },
    },
    {
      name: "zenid_export_resume_pdf",
      config: {
        title: "Export a resume PDF",
        description: "Write an ATS-friendly resume PDF, identical to the one ZenID itself produces.",
        inputSchema: {
          resumeId: z.string().optional(),
          path: z.string().optional().describe("Target .pdf path."),
        },
      },
      handler: async ({ resumeId, path: targetPath }) => {
        requireOpen(session);
        const resume =
          session.project.resumes.find((entry) => entry.id === resumeId) || session.project.resumes[0];
        const resumeData = materializeResumeData(session.project, resume.id);
        const doc = await buildResumePdf({
          resumeData,
          accentColor: resume.accentColor,
          language: resume.language,
          fontData: await loadResumeFontData(),
        });
        const bytes = new Uint8Array(doc.output("arraybuffer"));
        const outputPath =
          targetPath ||
          `${session.path.replace(/\.zenid$/i, "")}.${getResumeFileName(
            resumeData.personalInfo?.fullName,
            resume.language
          )}`;
        await writeBytes(outputPath, bytes);
        return { path: outputPath, bytes: bytes.byteLength, resumeId: resume.id };
      },
    },
    {
      name: "zenid_export_portfolio_zip",
      config: {
        title: "Export the public portfolio",
        description:
          "Write the public portfolio ZIP. It contains only what the project's publication settings allow.",
        inputSchema: { path: z.string().optional().describe("Target .zip path.") },
      },
      handler: async ({ path: targetPath }) => {
        requireOpen(session);
        const bytes = serializePortfolioSite(session.project);
        const outputPath =
          targetPath ||
          `${session.path.replace(/\.zenid$/i, "")}.${getPortfolioZipFileName(
            session.project.profile.personalInfo?.fullName
          )}`;
        await writeBytes(outputPath, bytes);
        return { path: outputPath, bytes: bytes.byteLength };
      },
    },
  ];
}
