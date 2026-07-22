import test from "node:test";
import assert from "node:assert/strict";
import { strFromU8, unzipSync } from "fflate";
import { createEmptyProject } from "../resume/projectSchema.js";
import {
  buildPublicationReview,
  getPublicPortfolioAssetIds,
  serializePortfolioSite,
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
  assert.equal(review.files.includes("Profile image"), true);
  assert.equal(review.files.includes("Public Resume.pdf"), true);
  assert.equal(review.files.some((file) => file.includes("Private Project")), false);
  assert.equal(review.sections[0], "Projects");
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
