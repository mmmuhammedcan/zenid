import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { createEmptyProject } from "../resume/projectSchema.js";
import { buildResumePdf } from "../resume/resumePdfExport.js";
import {
  buildPublicResumeData,
  buildPublicationReview,
  getPublicPortfolioAssetIds,
  serializePortfolioSite,
  validatePortfolioSiteArchive,
} from "./portfolioSiteExport.js";

function fixture() {
  const project = createEmptyProject();
  project.profile.personalInfo = {
    ...project.profile.personalInfo,
    fullName: "Şule Işık",
    title: "Engineer",
    email: "public@example.com",
    phone: "+90 private phone",
  };
  project.profile.projects = [
    { id: "public-project", name: "Public Project", description: "Safe public details" },
    { id: "private-project", name: "Private Project", description: "SECRET PROJECT DETAILS" },
  ];
  project.profile.certifications = [
    { id: "public-certificate", title: "Public Certificate", issuer: "ZenID" },
  ];
  project.portfolio.about = "Public introduction";
  project.portfolio.sectionOrder = ["projects", "about", "contact", "experience", "certifications"];
  project.portfolio.contactPrivacy.email = true;
  project.portfolio.contactPrivacy.phone = false;
  project.portfolio.hiddenItems.projects = ["private-project"];
  project.portfolio.media = {
    ...project.portfolio.media,
    profileImageId: "profile-image",
    projectImageIds: {
      "public-project": "public-project-image",
      "private-project": "private-project-image",
    },
    certificateImageIds: { "public-certificate": "certificate-image" },
  };
  project.portfolio.resume = {
    ...project.portfolio.resume,
    enabled: true,
    source: "uploaded",
    uploadedAssetId: "resume-pdf",
    uploadedFileName: "Public Resume.pdf",
  };
  return project;
}

const assets = [
  { id: "profile-image", mimeType: "image/png", bytes: new Uint8Array([1, 2, 3]) },
  { id: "public-project-image", mimeType: "image/jpeg", bytes: new Uint8Array([4, 5, 6]) },
  { id: "private-project-image", mimeType: "image/jpeg", bytes: new Uint8Array([7, 8, 9]) },
  { id: "certificate-image", mimeType: "image/webp", bytes: new Uint8Array([10, 11, 12]) },
  { id: "resume-pdf", mimeType: "application/pdf", bytes: new TextEncoder().encode("%PDF-1.7\npublic resume") },
];

test("public asset selection excludes media attached only to hidden items", () => {
  assert.deepEqual(getPublicPortfolioAssetIds(fixture()).sort(), [
    "certificate-image",
    "profile-image",
    "public-project-image",
    "resume-pdf",
  ]);
});

test("publication review lists every public contact and packaged file", () => {
  const review = buildPublicationReview(fixture());
  assert.deepEqual(review.contacts, [{ label: "Email", value: "public@example.com" }]);
  assert.deepEqual(review.files, [
    "index.html",
    "Profile image",
    "Public Project: 1 project image",
    "Public Certificate: certificate image",
    "Public Resume.pdf",
  ]);
  assert.equal(review.sections[0], "Projects");
});

test("generated public résumé data excludes private contacts and hidden items", () => {
  const project = fixture();
  project.portfolio.resume.source = "generated";
  const resumeData = buildPublicResumeData(project, project.resumes[0].id);

  assert.equal(resumeData.personalInfo.email, "public@example.com");
  assert.equal(resumeData.personalInfo.phone, "");
  assert.deepEqual(resumeData.projects.map((item) => item.name), ["Public Project"]);
});

test("generated portfolio résumé PDF honors variant selections and wording without changing site content", async () => {
  const project = fixture();
  project.portfolio.resume.source = "generated";
  project.resumes[0].selectedItems = { projects: ["public-project"] };
  project.resumes[0].contentOverrides = {
    projects: {
      "public-project": { description: "Targeted resume project wording" },
    },
  };
  const resumeData = buildPublicResumeData(project, project.resumes[0].id);
  const pdf = await buildResumePdf({
    resumeData,
    accentColor: project.resumes[0].accentColor,
  });
  const pageOperators = pdf.internal.pages.slice(1).flat().join("\n");
  const files = unzipSync(serializePortfolioSite(project, {
    assets: assets.filter((asset) => asset.id !== "resume-pdf"),
    resumePdfBytes: new Uint8Array(pdf.output("arraybuffer")),
  }));
  const html = strFromU8(files["index.html"]);

  assert.deepEqual(resumeData.projects.map((item) => item.name), ["Public Project"]);
  assert.match(pageOperators, /Targeted resume project wording/);
  assert.doesNotMatch(pageOperators, /Safe public details/);
  assert.ok(files["resume.pdf"]);
  assert.match(html, /Safe public details/);
  assert.doesNotMatch(html, /Targeted resume project wording/);
});

test("static portfolio ZIP contains only explicitly published content and works without source JSON", () => {
  const archive = serializePortfolioSite(fixture(), { assets });
  const files = unzipSync(archive);
  const html = strFromU8(files["index.html"]);

  assert.match(html, /Şule Işık/);
  assert.match(html, /Public Project/);
  assert.match(html, /public@example\.com/);
  assert.doesNotMatch(html, /Private Project|SECRET PROJECT DETAILS|private phone/);
  assert.ok(files["assets/profile.png"]);
  assert.ok(files["projects/public-project-1.jpg"]);
  assert.ok(files["certificates/public-certificate.webp"]);
  assert.ok(files["resume.pdf"]);
  assert.equal(Object.keys(files).some((path) => path.endsWith(".json")), false);
  assert.equal(Object.keys(files).some((path) => path.includes("private-project")), false);
  assert.doesNotMatch(html, /<script\s+src=|<link[^>]+stylesheet/i);
  assert.ok(html.indexOf('id="projects"') < html.indexOf('id="about"'));
});

test("hidden About content is not leaked and published text is HTML escaped", () => {
  const project = fixture();
  project.portfolio.visibleSections.about = false;
  project.portfolio.about = "PRIVATE ABOUT";
  project.profile.personalInfo.city = "PRIVATE LOCATION";
  project.profile.projects[0].description = '<script>alert("unsafe")</script>';
  const files = unzipSync(serializePortfolioSite(project, { assets }));
  const html = strFromU8(files["index.html"]);

  assert.doesNotMatch(html, /PRIVATE ABOUT|PRIVATE LOCATION|<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&quot;unsafe&quot;\)&lt;\/script&gt;/);
});

test("every offline resource exists and resolves under root and subpath static hosting", () => {
  const archive = serializePortfolioSite(fixture(), { assets });
  const report = validatePortfolioSiteArchive(archive);

  assert.deepEqual(report.localReferences.sort(), [
    "assets/profile.png",
    "certificates/public-certificate.webp",
    "projects/public-project-1.jpg",
    "resume.pdf",
  ]);

  for (const base of ["https://portfolio.example/", "https://example.github.io/zenid-portfolio/"]) {
    const basePath = new URL(base).pathname;
    report.localReferences.forEach((reference) => {
      const resolved = new URL(reference, base);
      assert.equal(resolved.origin, new URL(base).origin);
      assert.equal(resolved.pathname.startsWith(basePath), true);
    });
  }
});

test("archive verification rejects missing files and external runtime dependencies", () => {
  const archive = serializePortfolioSite(fixture(), { assets });
  const missingFilePackage = unzipSync(archive);
  delete missingFilePackage["assets/profile.png"];
  assert.throws(
    () => validatePortfolioSiteArchive(zipSync(missingFilePackage)),
    /missing or unsafe file/
  );

  const networkPackage = unzipSync(archive);
  const html = strFromU8(networkPackage["index.html"]).replace(
    "</head>",
    '<script src="https://cdn.example/app.js"></script></head>'
  );
  networkPackage["index.html"] = strToU8(html);
  assert.throws(
    () => validatePortfolioSiteArchive(zipSync(networkPackage)),
    /network-dependent runtime resource/
  );
});
