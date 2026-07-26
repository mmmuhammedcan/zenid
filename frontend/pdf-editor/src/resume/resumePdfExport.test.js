import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmptyProject,
  materializeResumeData,
  updateResumeItemSelection,
} from "./projectSchema.js";
import { buildResumePdf, getResumeFileName } from "./resumePdfExport.js";

test("buildResumePdf creates an ATS-readable multi-section PDF", async () => {
  const doc = await buildResumePdf({
    accentColor: "#1F2A44",
    resumeData: {
      personalInfo: {
        fullName: "Test Engineer",
        email: "engineer@example.com",
        phone: "+90 555 000 0000",
        city: "Ankara",
        summary: "Software engineer focused on reliable document systems.",
      },
      sectionOrder: ["skills", "experience", "projects", "education"],
      skills: [{ category: "Programming Languages", items: "JavaScript, Python, SQL" }],
      experience: [{
        company: "Example Inc.",
        role: "Software Engineer",
        startDate: "2024-01",
        endDate: "2025-06",
        description: "Built a document export pipeline.\nReduced processing failures by 40%.",
        tools: "React, Node.js",
      }],
      projects: [{
        name: "Resume Builder",
        techStack: "React / jsPDF",
        description: "Created selectable-text PDF output.",
      }],
      education: [{ institution: "Example University", degree: "B.Sc.", field: "Computer Engineering" }],
    },
  });

  const bytes = new Uint8Array(doc.output("arraybuffer"));
  assert.equal(String.fromCharCode(...bytes.slice(0, 5)), "%PDF-");
  assert.ok(bytes.length > 2_000);
  assert.equal(doc.getNumberOfPages(), 1);
});

test("resume filenames are safe and predictable", () => {
  assert.equal(getResumeFileName("  Şule Işık  "), "Şule_Işık_Resume.pdf");
  assert.equal(getResumeFileName("Jane / Doe"), "Jane__Doe_Resume.pdf");
  assert.equal(getResumeFileName(""), "Resume.pdf");
  assert.equal(getResumeFileName("Şule Işık", "tr"), "Şule_Işık_CV.pdf");
});

test("Turkish résumé PDF localizes fixed labels and dates while preserving authored text", async () => {
  const doc = await buildResumePdf({
    language: "tr",
    resumeData: {
      personalInfo: { fullName: "Şule Işık", summary: "Kullanıcının yazdığı içerik." },
      sectionOrder: ["experience"],
      experience: [{
        id: "experience",
        company: "ZenID",
        role: "Yazılım Geliştirici",
        startDate: "2026-07",
        isCurrentlyWorking: true,
        tools: "React",
      }],
    },
  });
  const pageOperators = doc.internal.pages.slice(1).flat().join("\n");

  assert.match(pageOperators, /Tem 2026/);
  assert.match(pageOperators, /Devam ediyor/);
  assert.match(pageOperators, /Araçlar: React/);
  assert.doesNotMatch(pageOperators, /Professional Experience/);
});

test("ATS PDF rendering uses the active resume variant item selection", async () => {
  const project = createEmptyProject();
  const resumeId = project.resumes[0].id;
  project.profile.experience = [
    { id: "backend", company: "ZenID", role: "Backend Engineer" },
    { id: "retail", company: "Store", role: "Retail Associate" },
  ];
  const selected = updateResumeItemSelection(project, resumeId, "experience", "retail", false);

  const doc = await buildResumePdf({
    resumeData: materializeResumeData(selected, resumeId),
    accentColor: selected.resumes[0].accentColor,
  });
  const pageOperators = doc.internal.pages.slice(1).flat().join("\n");

  assert.match(pageOperators, /Backend Engineer/);
  assert.doesNotMatch(pageOperators, /Retail Associate/);
});
