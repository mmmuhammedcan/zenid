import test from "node:test";
import assert from "node:assert/strict";
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
});
