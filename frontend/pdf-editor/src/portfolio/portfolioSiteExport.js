import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { DEFAULT_PORTFOLIO_SECTION_ORDER, normalizeProject } from "../resume/projectSchema.js";

export const PORTFOLIO_ZIP_MIME = "application/zip";
export const MAX_PORTFOLIO_ZIP_BYTES = 25 * 1024 * 1024;

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const SECTION_LABELS = {
  about: "About & skills",
  experience: "Experience",
  projects: "Projects",
  certifications: "Certificates",
  contact: "Contact",
};

function text(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeId(value) {
  return text(value).replace(/[^a-zA-Z0-9_-]/g, "-") || "item";
}

function safeExternalUrl(value) {
  const candidate = text(value);
  if (!candidate) return null;
  try {
    const parsed = new URL(/^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

function lines(value) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function paragraphs(value) {
  return lines(value).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function skillTokens(skills) {
  return skills.flatMap((group) =>
    String(group.items || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function normalizedSectionOrder(portfolio) {
  const supplied = Array.isArray(portfolio.sectionOrder) ? portfolio.sectionOrder : [];
  return [
    ...supplied.filter(
      (id, index) => DEFAULT_PORTFOLIO_SECTION_ORDER.includes(id) && supplied.indexOf(id) === index
    ),
    ...DEFAULT_PORTFOLIO_SECTION_ORDER.filter((id) => !supplied.includes(id)),
  ];
}

function publishedItems(items, hiddenIds, nameFields) {
  const hidden = new Set(hiddenIds || []);
  return items.filter(
    (item) => !hidden.has(item.id) && nameFields.some((field) => text(item[field]))
  );
}

function publicContacts(project) {
  const { profile, portfolio } = project;
  if (!portfolio.visibleSections.contact) return [];
  const info = profile.personalInfo;
  return [
    portfolio.contactPrivacy.email && text(info.email) && { label: "Email", value: info.email, href: `mailto:${info.email}` },
    portfolio.contactPrivacy.phone && text(info.phone) && { label: "Phone", value: info.phone, href: `tel:${info.phone}` },
    portfolio.contactPrivacy.linkedin && text(info.linkedin) && { label: "LinkedIn", value: info.linkedin, href: safeExternalUrl(info.linkedin) },
    portfolio.contactPrivacy.github && text(info.github) && { label: "GitHub", value: info.github, href: safeExternalUrl(info.github) },
  ].filter((entry) => entry && entry.href);
}

export function getPublicPortfolioAssetIds(input) {
  const project = normalizeProject(input);
  const { profile, portfolio } = project;
  const ids = [];
  if (portfolio.media.profileImageId) ids.push(portfolio.media.profileImageId);

  if (portfolio.visibleSections.projects) {
    publishedItems(profile.projects, portfolio.hiddenItems.projects, ["name"]).forEach((item) => {
      ids.push(portfolio.media.projectImageIds[item.id]);
      ids.push(...(portfolio.media.projectGalleryIds[item.id] || []));
    });
  }
  if (portfolio.visibleSections.certifications) {
    publishedItems(profile.certifications, portfolio.hiddenItems.certifications, ["title"]).forEach((item) => {
      ids.push(portfolio.media.certificateImageIds[item.id]);
    });
  }
  if (portfolio.resume.enabled && portfolio.resume.source === "uploaded") {
    ids.push(portfolio.resume.uploadedAssetId);
  }
  return [...new Set(ids.filter(Boolean))];
}

export function buildPublicationReview(input) {
  const project = normalizeProject(input);
  const { profile, portfolio } = project;
  const visible = portfolio.visibleSections;
  const projects = visible.projects
    ? publishedItems(profile.projects, portfolio.hiddenItems.projects, ["name"])
    : [];
  const certifications = visible.certifications
    ? publishedItems(profile.certifications, portfolio.hiddenItems.certifications, ["title"])
    : [];
  const files = [];
  if (portfolio.media.profileImageId) files.push("Profile image");
  projects.forEach((item) => {
    const count = new Set([
      portfolio.media.projectImageIds[item.id],
      ...(portfolio.media.projectGalleryIds[item.id] || []),
    ].filter(Boolean)).size;
    if (count) files.push(`${item.name}: ${count} project image${count === 1 ? "" : "s"}`);
  });
  certifications.forEach((item) => {
    if (portfolio.media.certificateImageIds[item.id]) files.push(`${item.title}: certificate image`);
  });
  if (portfolio.resume.enabled) {
    files.push(portfolio.resume.source === "uploaded"
      ? portfolio.resume.uploadedFileName || "Uploaded résumé PDF"
      : "Generated résumé PDF");
  }

  const sections = normalizedSectionOrder(portfolio).filter((id) => {
    if (id === "about") return visible.about || visible.skills;
    return visible[id];
  }).map((id) => SECTION_LABELS[id]);

  return {
    identity: [profile.personalInfo.fullName, profile.personalInfo.title].map(text).filter(Boolean),
    sections,
    contacts: publicContacts(project).map(({ label, value }) => ({ label, value })),
    files,
    projectCount: projects.length,
    certificationCount: certifications.length,
  };
}

function assetBytes(asset) {
  return asset.bytes instanceof Uint8Array ? asset.bytes : new Uint8Array(asset.bytes || []);
}

function assertImageAsset(asset, label) {
  if (!asset || !EXTENSIONS[asset.mimeType] || !assetBytes(asset).byteLength) {
    throw new Error(`${label} is missing or unsupported. Replace or remove it before publishing.`);
  }
}

function isPdf(bytes) {
  return bytes?.length >= 5 && String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-";
}

function siteReferences(html) {
  return [...html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*?\b(src|href)=(["'])(.*?)\3/gi)].map((match) => ({
    tag: match[1].toLowerCase(),
    attribute: match[2].toLowerCase(),
    value: match[4],
  }));
}

function validatePortfolioFiles(files) {
  if (!files["index.html"]) throw new Error("The public portfolio package is missing index.html.");
  const html = strFromU8(files["index.html"]);
  if (/<script\b[^>]*\bsrc=|<link\b[^>]*\brel=["']?stylesheet|@import\s|url\(\s*["']?https?:/i.test(html)) {
    throw new Error("The public portfolio contains a network-dependent runtime resource.");
  }

  const localReferences = [];
  const externalLinks = [];
  siteReferences(html).forEach(({ tag, attribute, value }) => {
    if (value.startsWith("#") || value.startsWith("mailto:") || value.startsWith("tel:")) return;
    if (/^https?:\/\//i.test(value)) {
      if (tag !== "a" || attribute !== "href") {
        throw new Error("The public portfolio contains an external runtime dependency.");
      }
      externalLinks.push(value);
      return;
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("/") || value.startsWith("\\")) {
      throw new Error(`The public portfolio contains a static-host-incompatible reference: ${value}`);
    }
    const path = value.split(/[?#]/, 1)[0];
    if (!path || path.split("/").includes("..") || !files[path]) {
      throw new Error(`The public portfolio references a missing or unsafe file: ${value}`);
    }
    localReferences.push(path);
  });

  return {
    filePaths: Object.keys(files),
    localReferences: [...new Set(localReferences)],
    externalLinks: [...new Set(externalLinks)],
  };
}

export function validatePortfolioSiteArchive(input) {
  let files;
  try {
    files = unzipSync(input instanceof Uint8Array ? input : new Uint8Array(input));
  } catch {
    throw new Error("The public portfolio ZIP could not be opened for verification.");
  }
  return validatePortfolioFiles(files);
}

function createPublicFiles(project, assets, resumePdfBytes) {
  const files = {};
  const paths = { projects: {}, certificates: {} };
  const assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  const addImage = (id, path, label) => {
    if (!id) return null;
    const asset = assetMap.get(id);
    assertImageAsset(asset, label);
    const fullPath = `${path}.${EXTENSIONS[asset.mimeType]}`;
    files[fullPath] = assetBytes(asset);
    return fullPath;
  };

  paths.profile = addImage(project.portfolio.media.profileImageId, "assets/profile", "The profile image");

  const projects = publishedItems(project.profile.projects, project.portfolio.hiddenItems.projects, ["name"]);
  if (project.portfolio.visibleSections.projects) {
    projects.forEach((item) => {
      const ids = [...new Set([
        project.portfolio.media.projectImageIds[item.id],
        ...(project.portfolio.media.projectGalleryIds[item.id] || []),
      ].filter(Boolean))];
      paths.projects[item.id] = ids.map((id, index) => ({
        id,
        path: addImage(id, `projects/${safeId(item.id)}-${index + 1}`, `An image for ${item.name}`),
      }));
    });
  }

  const certifications = publishedItems(project.profile.certifications, project.portfolio.hiddenItems.certifications, ["title"]);
  if (project.portfolio.visibleSections.certifications) {
    certifications.forEach((item) => {
      paths.certificates[item.id] = addImage(
        project.portfolio.media.certificateImageIds[item.id],
        `certificates/${safeId(item.id)}`,
        `The certificate image for ${item.title}`
      );
    });
  }

  if (project.portfolio.resume.enabled) {
    const bytes = project.portfolio.resume.source === "uploaded"
      ? assetBytes(assetMap.get(project.portfolio.resume.uploadedAssetId) || {})
      : resumePdfBytes instanceof Uint8Array
        ? resumePdfBytes
        : new Uint8Array(resumePdfBytes || []);
    if (!isPdf(bytes)) throw new Error("The public résumé PDF is missing or invalid.");
    files["resume.pdf"] = bytes;
    paths.resume = "resume.pdf";
  }
  return { files, paths };
}

function sectionHeading(eyebrow, title, copy = "") {
  return `<div class="section-heading"><span>${escapeHtml(eyebrow)}</span><h2>${escapeHtml(title)}</h2>${copy ? `<p>${escapeHtml(copy)}</p>` : ""}</div>`;
}

function renderPortfolioHtml(project, paths) {
  const { profile, portfolio } = project;
  const info = profile.personalInfo;
  const visible = portfolio.visibleSections;
  const skills = skillTokens(profile.skills);
  const experiences = publishedItems(profile.experience, portfolio.hiddenItems.experience, ["company", "role"]);
  const projects = publishedItems(profile.projects, portfolio.hiddenItems.projects, ["name"]);
  const certifications = publishedItems(profile.certifications, portfolio.hiddenItems.certifications, ["title"]);
  const contacts = publicContacts(project);
  const sectionOrder = normalizedSectionOrder(portfolio);
  const accent = /^#[0-9a-f]{6}$/i.test(portfolio.accentColor) ? portfolio.accentColor : "#d97706";
  const light = portfolio.theme === "light";
  const about = text(portfolio.about) || text(info.summary) || "Welcome to my portfolio.";
  const location = [info.city, info.state].map(text).filter(Boolean).join(", ");
  const introVideo = safeExternalUrl(portfolio.introVideoUrl);
  const initials = (text(info.fullName).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("") || "ZI").toUpperCase();
  const caseStudy = (id) => portfolio.caseStudies.find((study) => study.projectId === id) || {};

  const renderAbout = () => (visible.about || visible.skills) ? `<section id="about">
    <div class="container">
      ${visible.about ? `${sectionHeading("Profile", "About me")}<div class="prose lead">${paragraphs(about)}</div>` : ""}
      ${visible.skills ? `<div class="skills-block">${sectionHeading("Capabilities", "Key skills")}<div class="tags">${(skills.length ? skills : ["Add your skills"]).map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div></div>` : ""}
    </div>
  </section>` : "";

  const renderExperience = () => visible.experience ? `<section id="experience"><div class="container">
    ${sectionHeading("Journey", "Experience", "Roles, responsibilities, and the work that shaped my practice.")}
    <div class="stack">${(experiences.length ? experiences : [{ id: "empty", role: "Experience coming soon" }]).map((item) => `<article class="card experience-card"><div><h3>${escapeHtml(item.role || "Role")}</h3><p class="muted">${escapeHtml(item.company)}</p><small>${escapeHtml([item.startDate, item.isCurrentlyWorking ? "Present" : item.endDate].filter(Boolean).join(" — "))}</small></div><div class="prose">${paragraphs(item.description)}${text(item.tools) ? `<p class="accent-text">${escapeHtml(item.tools)}</p>` : ""}</div></article>`).join("")}</div>
  </div></section>` : "";

  const renderProjects = () => visible.projects ? `<section id="projects"><div class="container">
    ${sectionHeading("Selected work", "Projects", "Case studies, implementation details, and project links.")}
    <div class="project-grid">${(projects.length ? projects : [{ id: "empty", name: "Projects coming soon" }]).map((item, index) => {
      const study = caseStudy(item.id);
      const images = paths.projects[item.id] || [];
      const links = [
        ["GitHub", safeExternalUrl(item.githubUrl)],
        ["Live demo", safeExternalUrl(item.liveUrl)],
        [text(study.platformName) || "Project link", safeExternalUrl(study.platformUrl || item.link)],
        ["Video", safeExternalUrl(study.videoUrl)],
        ["LinkedIn", safeExternalUrl(study.linkedinUrl)],
      ].filter(([, href]) => href);
      return `<article class="card project-card">${images[0] ? `<img src="${escapeHtml(images[0].path)}" alt="${escapeHtml(item.name)} preview">` : ""}<div class="card-body"><small>0${index + 1}${text(study.projectType || item.domain) ? ` · ${escapeHtml(study.projectType || item.domain)}` : ""}</small><h3>${escapeHtml(item.name)}</h3><div class="prose">${paragraphs(study.shortDescription || item.description)}</div>${text(item.techStack) ? `<p class="accent-text">${escapeHtml(item.techStack)}</p>` : ""}${links.length ? `<div class="links">${links.map(([label, href]) => `<a href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(label)} ↗</a>`).join("")}</div>` : ""}${text(study.fullDescription) || images.length > 1 ? `<details><summary>View case study</summary><div class="case-study">${paragraphs(study.fullDescription)}${images.length > 1 ? `<div class="gallery">${images.slice(1).map(({ id, path }, imageIndex) => `<figure><img src="${escapeHtml(path)}" alt="${escapeHtml(item.name)} screenshot ${imageIndex + 2}"><figcaption>${escapeHtml(study.screenshotCaptions?.[id] || "")}</figcaption></figure>`).join("")}</div>` : ""}</div></details>` : ""}</div></article>`;
    }).join("")}</div>
  </div></section>` : "";

  const renderCertifications = () => visible.certifications ? `<section id="certifications"><div class="container">
    ${sectionHeading("Learning", "Certificates & awards", "Credentials with context and direct verification.")}
    <div class="certificate-grid">${(certifications.length ? certifications : [{ id: "empty", title: "Credentials coming soon" }]).map((item) => `<article class="card certificate-card">${paths.certificates[item.id] ? `<img src="${escapeHtml(paths.certificates[item.id])}" alt="${escapeHtml(item.title)} certificate">` : ""}<h3>${escapeHtml(item.title)}</h3><p class="muted">${escapeHtml([item.issuer, item.date].filter(Boolean).join(" · "))}</p>${text(item.credentialId) ? `<small>Credential: ${escapeHtml(item.credentialId)}</small>` : ""}<div class="prose">${paragraphs(item.description)}</div>${safeExternalUrl(item.link) ? `<a href="${escapeHtml(safeExternalUrl(item.link))}" target="_blank" rel="noreferrer">Verify credential ↗</a>` : ""}</article>`).join("")}</div>
  </div></section>` : "";

  const renderContact = () => visible.contact ? `<section id="contact"><div class="container">
    ${sectionHeading("Contact", "Let’s connect", portfolio.contactMessage)}
    <div class="contact-grid">${contacts.length ? contacts.map(({ label, value, href }) => `<a class="card contact-card" href="${escapeHtml(href)}"${href.startsWith("http") ? ' target="_blank" rel="noreferrer"' : ""}><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></a>`).join("") : `<p class="muted">No public contact methods have been selected.</p>`}</div>
  </div></section>` : "";

  const renderers = { about: renderAbout, experience: renderExperience, projects: renderProjects, certifications: renderCertifications, contact: renderContact };
  const sections = sectionOrder.map((id) => renderers[id]?.() || "").join("");
  const nav = sectionOrder.filter((id) => {
    if (id === "about") return visible.about || visible.skills;
    return visible[id];
  }).map((id) => `<a href="#${id}">${escapeHtml(SECTION_LABELS[id].replace(" & skills", ""))}</a>`).join("");

  return `<!doctype html>
<html lang="${escapeHtml(portfolio.language || "en")}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${escapeHtml(`${info.fullName || "Professional"} portfolio`)}"><title>${escapeHtml(info.fullName || "Portfolio")}</title>
<style>
:root{--accent:${accent};--bg:${light ? "#fafaf9" : "#0d0c0b"};--surface:${light ? "#fff" : "#171513"};--text:${light ? "#1c1917" : "#f5f5f4"};--muted:${light ? "#57534e" : "#a8a29e"};--border:${light ? "#e7e5e4" : "rgba(255,255,255,.1)"}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:15px/1.65 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}a{color:inherit}.container{width:min(1120px,calc(100% - 40px));margin:auto}.site-header{position:sticky;top:0;z-index:10;border-bottom:1px solid var(--border);background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(18px)}.header-inner{display:flex;align-items:center;justify-content:space-between;min-height:68px}.brand{display:flex;align-items:center;gap:12px;text-decoration:none;font-weight:700}.avatar,.portrait-placeholder{display:grid;place-items:center;background:linear-gradient(145deg,var(--accent),#292524);color:#fff;font-weight:800}.avatar{width:38px;height:38px;border-radius:12px}.nav{display:flex;gap:24px}.nav a{text-decoration:none;color:var(--muted);font-size:13px}.hero{position:relative;overflow:hidden;padding:100px 0}.hero:before{content:"";position:absolute;width:420px;height:420px;right:-130px;top:-190px;border-radius:50%;background:var(--accent);opacity:.16;filter:blur(70px)}.hero-grid{position:relative;display:grid;grid-template-columns:1.25fr .75fr;gap:70px;align-items:center}.pill,.tag{display:inline-flex;border:1px solid var(--border);background:var(--surface);border-radius:999px}.pill{padding:6px 12px;font-size:12px}.hero h1{font-size:clamp(48px,8vw,78px);line-height:.98;letter-spacing:-.055em;margin:18px 0}.title,.accent-text{color:var(--accent);font-weight:650}.title{font-size:22px}.hero-copy{max-width:680px;color:var(--muted);font-size:16px}.actions,.links,.tags{display:flex;flex-wrap:wrap;gap:10px}.actions{margin-top:28px}.button,.links a{border:1px solid var(--border);border-radius:12px;padding:10px 14px;text-decoration:none;font-weight:650;font-size:13px}.button.primary{background:var(--accent);border-color:var(--accent);color:#fff}.portrait{aspect-ratio:1;border:1px solid var(--border);padding:18px;border-radius:40px;background:var(--surface);box-shadow:0 24px 80px rgba(0,0,0,.2)}.portrait img,.portrait-placeholder{width:100%;height:100%;border-radius:30px;object-fit:cover}.portrait-placeholder{font-size:72px}section{border-top:1px solid var(--border);padding:84px 0}.section-heading{max-width:690px;margin-bottom:34px}.section-heading span{color:var(--accent);font-size:12px;font-weight:750;text-transform:uppercase;letter-spacing:.2em}.section-heading h2{font-size:clamp(32px,5vw,45px);line-height:1.1;letter-spacing:-.035em;margin:8px 0}.section-heading p,.muted{color:var(--muted)}.lead{font-size:19px;max-width:880px}.skills-block{margin-top:42px}.tag,.tags span{padding:8px 13px;border:1px solid var(--border);border-radius:12px;background:var(--surface);font-size:13px}.stack,.project-grid,.certificate-grid,.contact-grid{display:grid;gap:16px}.project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.certificate-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.contact-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.card{border:1px solid var(--border);border-radius:22px;background:var(--surface);overflow:hidden}.experience-card{display:grid;grid-template-columns:.35fr .65fr;gap:28px;padding:24px}.card h3{margin:0 0 8px;font-size:19px}.card small{color:var(--muted)}.card-body,.certificate-card{padding:24px}.project-card>img{width:100%;aspect-ratio:16/9;object-fit:cover}.project-card h3{margin-top:26px}.prose p{margin:8px 0}.links{margin-top:20px}.links a,.certificate-card>a{color:var(--accent)}details{margin-top:20px;border-top:1px solid var(--border);padding-top:16px}summary{cursor:pointer;font-weight:700}.case-study{padding-top:14px}.gallery{display:grid;gap:12px;margin-top:18px}.gallery img,.certificate-card img{display:block;width:100%;border-radius:12px}.gallery figure{margin:0}.gallery figcaption{color:var(--muted);font-size:12px}.certificate-card{display:flex;flex-direction:column}.certificate-card .prose{flex:1}.contact-card{display:flex;flex-direction:column;padding:22px;text-decoration:none}.contact-card strong{overflow-wrap:anywhere}.footer{border-top:1px solid var(--border);padding:30px 0;color:var(--muted);font-size:12px}.footer-inner{display:flex;justify-content:space-between;gap:16px}
@media(max-width:760px){.nav{display:none}.hero{padding:68px 0}.hero-grid{grid-template-columns:1fr;gap:44px}.portrait{max-width:340px}.project-grid,.certificate-grid,.contact-grid,.experience-card{grid-template-columns:1fr}section{padding:64px 0}}
</style></head>
<body><header class="site-header"><div class="container header-inner"><a class="brand" href="#home"><span class="avatar">${escapeHtml(initials)}</span>${escapeHtml(info.fullName || "Portfolio")}</a><nav class="nav" aria-label="Portfolio sections">${nav}</nav></div></header>
<main id="home"><div class="hero"><div class="container hero-grid"><div><span class="pill">${escapeHtml(portfolio.availability || "Portfolio")}</span><h1>${escapeHtml(info.fullName || "Your name")}</h1><p class="title">${escapeHtml(info.title || "Professional portfolio")}</p>${visible.about ? `<div class="hero-copy">${paragraphs(about)}</div>` : ""}<div class="actions">${paths.resume ? `<a class="button primary" href="${paths.resume}" download>Download résumé</a>` : ""}${introVideo ? `<a class="button" href="${escapeHtml(introVideo)}" target="_blank" rel="noreferrer">Watch introduction ↗</a>` : ""}${visible.contact ? '<a class="button" href="#contact">Contact me</a>' : ""}${visible.about && location ? `<span class="button">${escapeHtml(location)}</span>` : ""}</div></div><div class="portrait">${paths.profile ? `<img src="${escapeHtml(paths.profile)}" alt="${escapeHtml(info.fullName || "Portfolio profile")}">` : `<div class="portrait-placeholder">${escapeHtml(initials)}</div>`}</div></div></div>${sections}</main>
<footer class="footer"><div class="container footer-inner"><span>© ${new Date().getFullYear()} ${escapeHtml(info.fullName || "Portfolio owner")}</span><span>Built locally with ZenID</span></div></footer></body></html>`;
}

export function serializePortfolioSite(input, options = {}) {
  const project = normalizeProject(input);
  const { files, paths } = createPublicFiles(project, options.assets || [], options.resumePdfBytes);
  files["index.html"] = strToU8(renderPortfolioHtml(project, paths));
  validatePortfolioFiles(files);
  const archive = zipSync(files, { level: 6 });
  if (archive.byteLength > MAX_PORTFOLIO_ZIP_BYTES) {
    throw new Error("The public portfolio ZIP is larger than 25 MB. Remove or resize some published images.");
  }
  return archive;
}

export function getPortfolioZipFileName(fullName) {
  const safeName = text(fullName)
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/^\.+|\.+$/g, "");
  return `${safeName || "My"}_Portfolio.zip`;
}

export function downloadPortfolioSite(project, options = {}) {
  const bytes = serializePortfolioSite(project, options);
  const url = URL.createObjectURL(new Blob([bytes], { type: PORTFOLIO_ZIP_MIME }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getPortfolioZipFileName(project.profile?.personalInfo?.fullName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
