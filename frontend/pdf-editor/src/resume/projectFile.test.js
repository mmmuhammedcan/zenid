import test from "node:test";
import assert from "node:assert/strict";
import { strToU8, unzipSync } from "fflate";
import { createEmptyProject, migrateLegacyResumeDraft } from "./projectSchema.js";
import {
  getProjectFileName,
  parseProjectBundleBytes,
  parseProjectFileBytes,
  serializeProjectArchive,
} from "./projectFile.js";

const PNG_FIXTURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

test("a ZIP-based .zenid project survives an export/import round trip", () => {
  const project = createEmptyProject();
  project.profile.personalInfo.fullName = "Çağla Öz";
  project.profile.projects[0].name = "Privacy-first Portfolio";
  project.resumes[0].name = "Backend Resume";
  project.resumes[0].template = "modern";

  const bytes = serializeProjectArchive(project, { exportedAt: "2026-07-21T00:00:00.000Z" });
  const restored = parseProjectFileBytes(bytes);

  assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
  assert.equal(restored.profile.personalInfo.fullName, "Çağla Öz");
  assert.equal(restored.profile.projects[0].name, "Privacy-first Portfolio");
  assert.equal(restored.resumes[0].name, "Backend Resume");
  assert.equal(restored.resumes[0].template, "modern");
});

test("generated resume PDFs can travel inside the private project archive", () => {
  const project = createEmptyProject();
  const pdfBytes = strToU8("%PDF-1.3\nfixture");
  const bytes = serializeProjectArchive(project, {
    generatedPdfs: [{ resumeId: project.resumes[0].id, bytes: pdfBytes }],
  });
  const files = unzipSync(bytes);
  const generatedPath = `generated/${project.resumes[0].id}.pdf`;

  assert.ok(files[generatedPath]);
  assert.equal(new TextDecoder().decode(files[generatedPath]), "%PDF-1.3\nfixture");
  assert.equal(parseProjectFileBytes(bytes).resumes[0].id, project.resumes[0].id);
});

test("portfolio media survives a private project archive round trip", () => {
  const project = createEmptyProject();
  project.portfolio.media.profileImageId = "profile-photo";
  const bytes = serializeProjectArchive(project, {
    assets: [
      {
        id: "profile-photo",
        kind: "profile-image",
        name: "portrait.png",
        mimeType: "image/png",
        bytes: PNG_FIXTURE,
      },
    ],
  });

  const restored = parseProjectBundleBytes(bytes);
  assert.equal(restored.project.portfolio.media.profileImageId, "profile-photo");
  assert.equal(restored.assets.length, 1);
  assert.equal(restored.assets[0].name, "portrait.png");
  assert.deepEqual(restored.assets[0].bytes, PNG_FIXTURE);
});

test("an uploaded portfolio resume PDF survives the private project archive", () => {
  const project = createEmptyProject();
  const pdfBytes = strToU8("%PDF-1.7\nportfolio resume fixture");
  project.portfolio.resume = {
    enabled: true,
    source: "uploaded",
    resumeId: null,
    uploadedAssetId: "portfolio-resume",
    uploadedFileName: "Muhammed_Resume.pdf",
  };

  const restored = parseProjectBundleBytes(serializeProjectArchive(project, {
    assets: [{
      id: "portfolio-resume",
      kind: "resume-pdf",
      name: "Muhammed_Resume.pdf",
      mimeType: "application/pdf",
      bytes: pdfBytes,
    }],
  }));

  assert.equal(restored.project.portfolio.resume.source, "uploaded");
  assert.equal(restored.project.portfolio.resume.uploadedAssetId, "portfolio-resume");
  assert.equal(restored.assets[0].mimeType, "application/pdf");
  assert.deepEqual(restored.assets[0].bytes, pdfBytes);
});

test("the importer continues to accept the early plain-JSON project format", () => {
  const project = createEmptyProject();
  project.profile.personalInfo.fullName = "Legacy JSON";
  const restored = parseProjectFileBytes(strToU8(JSON.stringify(project)));
  assert.equal(restored.profile.personalInfo.fullName, "Legacy JSON");
});

test("legacy resume JSON can still be migrated before archive export", () => {
  const migrated = migrateLegacyResumeDraft({
    template: "minimal",
    resumeData: {
      personalInfo: { fullName: "Old Draft" },
      sectionOrder: ["skills"],
      domains: [],
      skills: [],
      experience: [],
      projects: [],
      achievements: [],
      certifications: [],
      education: [],
      additionalSection: {},
    },
  });
  const restored = parseProjectFileBytes(serializeProjectArchive(migrated));
  assert.equal(restored.profile.personalInfo.fullName, "Old Draft");
});

test("project filenames are portable and retain Unicode names", () => {
  assert.equal(getProjectFileName("  Şule / Işık  "), "Şule__Işık_ZenID_Project.zenid");
  assert.equal(getProjectFileName(""), "My_ZenID_Project.zenid");
});
