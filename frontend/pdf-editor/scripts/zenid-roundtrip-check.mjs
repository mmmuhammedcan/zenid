import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  CURRENT_SCHEMA_VERSION,
  materializeResumeData,
  normalizeProject,
} from "../src/resume/projectSchema.js";
import { parseProjectFileBytes, serializeProjectArchive } from "../src/resume/projectFile.js";
import { buildResumePdf } from "../src/resume/resumePdfExport.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const artifactsDirectory = path.join(repositoryRoot, "artifacts");
const projectPath = path.join(artifactsDirectory, "Synthetic_ZenID_Project.zenid");
const originalPdfPath = path.join(artifactsDirectory, "Synthetic_Resume.pdf");
const restoredPdfPath = path.join(artifactsDirectory, "Synthetic_Restored_Resume.pdf");
// T012: a file produced by the MCP server rather than by the application, so
// the round trip covers the path a user's agent client actually writes.
const serverProjectPath = path.join(artifactsDirectory, "Synthetic_Server_Project.zenid");

function fixtureProject() {
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      personalInfo: {
        fullName: "Ada Yılmaz",
        title: "Software Engineer",
        email: "ada@example.test",
        phone: "+90 555 000 0000",
        city: "Ankara",
        state: "Türkiye",
        portfolio: "https://portfolio.example.test",
        linkedin: "https://linkedin.example.test/ada",
        github: "https://github.example.test/ada",
        summary: "Synthetic multilingual résumé fixture: Türkçe, English, Français.",
      },
      domains: [
        { id: "domain-software", text: "Software Engineering" },
        { id: "domain-data", text: "Data Systems" },
      ],
      skills: [
        { id: "skill-programming", category: "Programming Languages", items: "JavaScript, Python, SQL" },
        { id: "skill-tools", category: "Tools & Technologies", items: "React, FastAPI, Docker, Git" },
      ],
      experience: [
        {
          id: "experience-example",
          company: "Example Labs",
          role: "Software Engineering Intern",
          startDate: "2025-06",
          endDate: "2025-08",
          description: "Built a local-first document workflow.\nAdded automated compatibility checks.",
          tools: "React, Node.js",
          isCurrentlyWorking: false,
        },
      ],
      projects: [
        {
          id: "project-local-docs",
          name: "Local Document Workspace",
          techStack: "React / IndexedDB / PDF",
          startDate: "2025-09",
          endDate: "2025-12",
          description: "Created a synthetic project used only for automated round-trip verification.",
          link: "https://project.example.test",
          isCurrentProject: false,
        },
      ],
      achievements: [
        {
          id: "achievement-example",
          title: "Synthetic Engineering Award",
          description: "Fixture content; not a real-world claim.",
          date: "2025",
        },
      ],
      certifications: [
        { id: "cert-example", title: "Synthetic Web Certificate", issuer: "Example Academy", date: "Aug 2025", link: "" },
      ],
      education: [
        {
          id: "education-example",
          institution: "Example University — Ankara, Türkiye",
          degree: "Bachelor of Science (B.Sc.)",
          field: "Computer Engineering",
          startDate: "2022-09",
          endDate: "2026-06",
          gpa: "3.50",
          isCurrentlyStudying: true,
        },
      ],
      additionalSection: { title: "", content: "", link: "" },
    },
    resumes: [
      {
        id: "resume-general",
        name: "Ada Yılmaz — General Resume",
        language: "en",
        template: "minimal",
        pendingTemplate: "minimal",
        accentColor: "#1F2A44",
        sectionOrder: [
          "domains",
          "skills",
          "experience",
          "projects",
          "certifications",
          "education",
          "achievements",
          "additionalSection",
        ],
        selectedItems: {},
        contentOverrides: {},
      },
    ],
    portfolio: {
      template: "minimal",
      theme: "dark",
      visibleSections: {},
      contactPrivacy: {},
      caseStudies: [],
    },
  });
}

async function loadFixtureFontData() {
  const fontDirectory = path.join(repositoryRoot, "frontend/pdf-editor/public/assets/fonts");
  return {
    normal: (await readFile(path.join(fontDirectory, "NotoSans-Regular.ttf"))).toString("base64"),
    bold: (await readFile(path.join(fontDirectory, "NotoSans-Bold.ttf"))).toString("base64"),
    italic: (await readFile(path.join(fontDirectory, "NotoSans-Italic.ttf"))).toString("base64"),
  };
}

async function exportProject() {
  await mkdir(artifactsDirectory, { recursive: true });
  const project = fixtureProject();
  const resume = project.resumes[0];
  const originalDocument = await buildResumePdf({
    resumeData: materializeResumeData(project, resume.id),
    accentColor: resume.accentColor,
    fontData: await loadFixtureFontData(),
  });
  const originalPdf = new Uint8Array(originalDocument.output("arraybuffer"));
  await writeFile(originalPdfPath, originalPdf);
  const archive = serializeProjectArchive(project, {
    exportedAt: "2026-07-21T00:00:00.000Z",
    generatedPdfs: [{ resumeId: resume.id, bytes: originalPdf }],
  });
  await writeFile(projectPath, archive);
  const server = await exportServerProject();
  process.stdout.write(
    `${JSON.stringify(
      { stage: "saved", projectPath, bytes: archive.byteLength, serverProject: server },
      null,
      2
    )}\n`
  );
}

// Drives the same tool layer the MCP server exposes, without the protocol, so
// the round-trip check does not depend on the package's dependencies being
// installed but still exercises the server's own write path.
async function exportServerProject() {
  const { createSession, createTools } = await import("../../../packages/zenid-mcp/src/tools.js");
  const session = createSession();
  const tools = Object.fromEntries(createTools(session).map((tool) => [tool.name, tool.handler]));

  await tools.zenid_open_project({ path: projectPath });
  const edit = await tools.zenid_set_wording({
    resumeId: fixtureProject().resumes[0].id,
    field: "experience",
    itemId: "experience-example",
    description: "Shipped a local-first document workflow used across the team.",
  });
  assert.equal(edit.applied, true, "The server did not apply the wording edit");

  const saved = await tools.zenid_save_project({ path: serverProjectPath, overwrite: true });
  return { path: saved.path, bytes: saved.bytes, changes: edit.changes.length };
}

async function restoreProject() {
  const archive = new Uint8Array(await readFile(projectPath));
  const restored = parseProjectFileBytes(archive);
  const expected = fixtureProject();
  assert.deepEqual(restored, expected, "The restored ZenID project differs from the saved project");

  const resume = restored.resumes[0];
  const resumeData = materializeResumeData(restored, resume.id);
  const fontData = await loadFixtureFontData();
  const pdf = await buildResumePdf({ resumeData, accentColor: resume.accentColor, fontData });
  const pdfBytes = new Uint8Array(pdf.output("arraybuffer"));
  await writeFile(restoredPdfPath, pdfBytes);

  // T012: the server-written file must reopen, carry the agent's wording, and
  // leave the user's canonical text exactly as they wrote it.
  const serverRestored = parseProjectFileBytes(new Uint8Array(await readFile(serverProjectPath)));
  assert.equal(
    serverRestored.resumes[0].contentOverrides.experience["experience-example"].description,
    "Shipped a local-first document workflow used across the team.",
    "The server-produced file lost the wording override"
  );
  assert.equal(
    serverRestored.profile.experience[0].description,
    expected.profile.experience[0].description,
    "The server-produced file changed the canonical profile text"
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        stage: "restored-in-fresh-process",
        serverProjectReopened: true,
        serverProjectSchemaVersion: serverRestored.schemaVersion,
        schemaVersion: restored.schemaVersion,
        fullName: restored.profile.personalInfo.fullName,
        resumes: restored.resumes.length,
        experienceEntries: restored.profile.experience.length,
        projectEntries: restored.profile.projects.length,
        certificationEntries: restored.profile.certifications.length,
        educationEntries: restored.profile.education.length,
        restoredPdfPages: pdf.getNumberOfPages(),
        restoredPdfPath,
      },
      null,
      2
    )}\n`
  );
}

const mode = process.argv[2];
if (mode === "save") await exportProject();
else if (mode === "restore") await restoreProject();
else throw new Error("Use: node scripts/zenid-roundtrip-check.mjs save|restore");
