import { Fragment, useEffect, useState } from "react";
import {
  ArrowUpRight,
  Award,
  BadgeCheck,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Code2,
  ContactRound,
  Download,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Phone,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import { contrastTextColor } from "./accessibleColor.js";
import { DEFAULT_PORTFOLIO_SECTION_ORDER } from "../resume/projectSchema";

function nonEmpty(value) {
  return String(value || "").trim();
}

function externalHref(value) {
  const text = nonEmpty(value);
  if (!text) return "#";
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text}`;
}

function safeVideoEmbed(value) {
  try {
    const url = new URL(externalHref(value));
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function skillTokens(skills) {
  return skills.flatMap((group) =>
    String(group.items || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function descriptionLines(value, limit = 3) {
  return String(value || "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function initials(name) {
  const parts = nonEmpty(name).split(/\s+/).filter(Boolean);
  return (parts.length ? parts.slice(0, 2).map((part) => part[0]).join("") : "ZI").toUpperCase();
}

function SectionHeading({ eyebrow, title, copy, accent }) {
  return (
    <div className="mb-8 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: accent }}>{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {copy && <p className="mt-3 text-sm leading-7 opacity-65">{copy}</p>}
    </div>
  );
}

function ModalShell({ title, onClose, children, isLight }) {
  useEffect(() => {
    const handleKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6" style={{ zIndex: 100 }} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-label={title} style={{ maxHeight: "92vh" }} className={`w-full max-w-5xl overflow-y-auto rounded-2xl border shadow-2xl ${isLight ? "border-stone-200 bg-white text-stone-950" : "border-white/10 bg-stone-950 text-stone-100"}`}>
        <header className={`sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4 backdrop-blur-xl ${isLight ? "border-stone-200 bg-white/90" : "border-white/10 bg-stone-950/90"}`}>
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-black/10"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}

function ProjectModal({ project, caseStudy, images, accent, isLight, onClose }) {
  const [imageIndex, setImageIndex] = useState(0);
  const muted = isLight ? "text-stone-600" : "text-stone-400";
  const button = isLight ? "border-stone-200 bg-stone-50" : "border-white/10 bg-white/5";
  const links = [
    project.githubUrl && { label: "View on GitHub", href: project.githubUrl, Icon: Code2 },
    project.liveUrl && { label: "Open live demo", href: project.liveUrl, Icon: Globe2 },
    project.link && { label: "Project link", href: project.link, Icon: ExternalLink },
    caseStudy.videoUrl && { label: "Watch project video", href: caseStudy.videoUrl, Icon: Play },
    caseStudy.linkedinUrl && { label: "View LinkedIn post", href: caseStudy.linkedinUrl, Icon: ContactRound },
    caseStudy.platformUrl && { label: caseStudy.platformName || "Open project platform", href: caseStudy.platformUrl, Icon: ExternalLink },
  ].filter(Boolean);
  const summary = nonEmpty(caseStudy.shortDescription) || nonEmpty(project.description);
  const details = nonEmpty(caseStudy.fullDescription) || nonEmpty(project.description);
  const activeImage = images[imageIndex];

  return (
    <ModalShell title={project.name} onClose={onClose} isLight={isLight}>
      <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-5">
        <div className="lg:col-span-2">
          {(caseStudy.projectType || project.domain) && <span className="inline-flex rounded-full px-3 py-1.5 text-xs font-medium" style={{ backgroundColor: accent, color: contrastTextColor(accent) }}>{caseStudy.projectType || project.domain}</span>}
          <h3 className="mt-5 text-3xl font-semibold tracking-tight">{project.name}</h3>
          {project.domain && <p className="mt-4 text-sm font-semibold">Domain / function: <span style={{ color: accent }}>{project.domain}</span></p>}
          <div className={`mt-5 space-y-3 text-sm leading-7 ${muted}`}>
            {descriptionLines(summary, 12).map((line) => <p key={line}>{line}</p>)}
          </div>
          {project.techStack && <p className="mt-6 text-xs font-semibold uppercase tracking-wider" style={{ color: accent }}>{project.techStack}</p>}
          <div className="mt-7 flex flex-wrap gap-2">
            {links.map(({ label, href, Icon }) => (
              <a key={label} href={externalHref(href)} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${button}`}><Icon size={15} /> {label}</a>
            ))}
          </div>
        </div>
        <div className="lg:col-span-3">
          {images.length ? (
            <>
              <div className={`relative overflow-hidden rounded-2xl border ${button}`}>
                <img src={activeImage.url} alt={activeImage.caption || `${project.name} screenshot ${imageIndex + 1}`} className="aspect-[4/3] w-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)} aria-label="Previous screenshot" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white"><ChevronLeft size={20} /></button>
                    <button type="button" onClick={() => setImageIndex((imageIndex + 1) % images.length)} aria-label="Next screenshot" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white"><ChevronRight size={20} /></button>
                  </>
                )}
              </div>
              {activeImage.caption && <p className={`mt-3 px-2 text-center text-xs leading-5 ${muted}`}>{activeImage.caption}</p>}
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button key={image.id} type="button" onClick={() => setImageIndex(index)} aria-label={`Show screenshot ${index + 1}`} className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${index === imageIndex ? "border-current" : "border-transparent opacity-60"}`} style={{ color: accent }}>
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className={`flex aspect-[4/3] items-center justify-center rounded-2xl border ${button} ${muted}`}><span className="text-sm">Add project screenshots in the editor.</span></div>
          )}
        </div>
      </div>
      {details && (
        <div className={`border-t px-5 py-7 sm:px-7 ${isLight ? "border-stone-200" : "border-white/10"}`}>
          <h3 className="text-xl font-semibold">Project details</h3>
          <p className={`mt-4 whitespace-pre-line text-sm leading-7 ${muted}`}>{details}</p>
        </div>
      )}
    </ModalShell>
  );
}

export default function PortfolioPreview({ project, assetUrls = {}, resumeUrl }) {
  const [activeProject, setActiveProject] = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const { profile, portfolio } = project;
  const info = profile.personalInfo;
  const accent = portfolio.accentColor || "#d97706";
  const accentText = contrastTextColor(accent);
  const isLight = portfolio.theme === "light";
  const surface = isLight ? "bg-stone-50 text-stone-950" : "bg-[#0d0c0b] text-stone-100";
  const card = isLight ? "border-stone-200 bg-white" : "border-white/10 bg-white/[0.035]";
  const muted = isLight ? "text-stone-600" : "text-stone-400";
  const visible = portfolio.visibleSections;
  const privacy = portfolio.contactPrivacy;
  const hidden = portfolio.hiddenItems;
  const skills = skillTokens(profile.skills);
  const experiences = profile.experience.filter((item) => !hidden.experience.includes(item.id) && (nonEmpty(item.company) || nonEmpty(item.role)));
  const projects = profile.projects.filter((item) => !hidden.projects.includes(item.id) && nonEmpty(item.name));
  const certifications = profile.certifications.filter((item) => !hidden.certifications.includes(item.id) && nonEmpty(item.title));
  const about = nonEmpty(portfolio.about) || nonEmpty(info.summary) || "Add an introduction in the Portfolio editor.";
  const location = [info.city, info.state].map(nonEmpty).filter(Boolean).join(", ");
  const videoEmbed = safeVideoEmbed(portfolio.introVideoUrl);
  const contacts = [
    privacy.email && nonEmpty(info.email) && { label: "Email", value: info.email, href: `mailto:${info.email}`, Icon: Mail },
    privacy.phone && nonEmpty(info.phone) && { label: "Phone", value: info.phone, href: `tel:${info.phone}`, Icon: Phone },
    privacy.linkedin && nonEmpty(info.linkedin) && { label: "LinkedIn", value: info.linkedin, href: externalHref(info.linkedin), Icon: ContactRound },
    privacy.github && nonEmpty(info.github) && { label: "GitHub", value: info.github, href: externalHref(info.github), Icon: Code2 },
  ].filter(Boolean);
  const profileImageUrl = assetUrls[portfolio.media?.profileImageId];
  const resumeName = portfolio.resume.source === "uploaded" && nonEmpty(portfolio.resume.uploadedFileName)
    ? portfolio.resume.uploadedFileName
    : `${nonEmpty(info.fullName).replace(/\s+/g, "_") || "My"}_Resume.pdf`;
  const orderedSectionIds = [
    ...(portfolio.sectionOrder || []).filter(
      (id, index, order) => DEFAULT_PORTFOLIO_SECTION_ORDER.includes(id) && order.indexOf(id) === index
    ),
    ...DEFAULT_PORTFOLIO_SECTION_ORDER.filter((id) => !(portfolio.sectionOrder || []).includes(id)),
  ];
  const navigationSections = {
    about: { visible: visible.about || visible.skills, href: "#portfolio-about", label: visible.about ? "About" : "Skills" },
    experience: { visible: visible.experience, href: "#portfolio-experience", label: "Experience" },
    projects: { visible: visible.projects, href: "#portfolio-projects", label: "Projects" },
    certifications: { visible: visible.certifications, href: "#portfolio-certifications", label: "Certificates" },
    contact: { visible: visible.contact, href: "#portfolio-contact", label: "Contact" },
  };

  const projectImages = (item) => {
    const ids = [portfolio.media.projectImageIds[item.id], ...(portfolio.media.projectGalleryIds[item.id] || [])];
    return [...new Set(ids.filter(Boolean))].map((id) => assetUrls[id]).filter(Boolean);
  };
  const projectCaseStudy = (item) => portfolio.caseStudies.find((study) => study.projectId === item.id) || {
    projectId: item.id,
    projectType: "",
    shortDescription: "",
    fullDescription: "",
    videoUrl: "",
    linkedinUrl: "",
    platformName: "",
    platformUrl: "",
    screenshotCaptions: {},
  };
  const projectImageEntries = (item) => {
    const study = projectCaseStudy(item);
    const galleryIds = portfolio.media.projectGalleryIds[item.id] || [];
    const ids = galleryIds.length ? galleryIds : [portfolio.media.projectImageIds[item.id]];
    return [...new Set(ids.filter(Boolean))]
      .map((id) => ({
        id,
        url: assetUrls[id],
        caption: study.screenshotCaptions[id] || (galleryIds.length ? "" : study.shortDescription || item.description || ""),
      }))
      .filter((image) => image.url);
  };

  return (
    <article className={`min-h-full overflow-hidden rounded-2xl ${surface}`} style={{ colorScheme: isLight ? "light" : "dark" }}>
      <header className={`sticky top-0 z-10 border-b backdrop-blur-xl ${isLight ? "border-stone-200 bg-stone-50/85" : "border-white/10 bg-[#0d0c0b]/85"}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#portfolio-home" className="flex items-center gap-3 text-sm font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold" style={{ backgroundColor: accent, color: accentText }}>{initials(info.fullName)}</span>
            <span>{nonEmpty(info.fullName) || "Your Portfolio"}</span>
          </a>
          <nav className={`hidden items-center gap-5 text-xs font-medium sm:flex ${muted}`} aria-label="Portfolio sections">
            {orderedSectionIds.map((id) => navigationSections[id]).filter(({ visible: isVisible }) => isVisible).map(({ href, label }) => (
              <a key={href} href={href}>{label}</a>
            ))}
          </nav>
        </div>
      </header>

      <main id="portfolio-home">
        <section className="relative overflow-hidden px-5 py-16 sm:px-8 sm:py-24">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: accent }} />
          <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${card}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />{nonEmpty(portfolio.availability) || "Portfolio"}</div>
              <p className={`mt-7 text-sm font-medium ${muted}`}>Hello, I’m</p>
              <h1 className="mt-2 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] sm:text-7xl">{nonEmpty(info.fullName) || "Your name"}</h1>
              <p className="mt-5 text-xl font-medium sm:text-2xl" style={{ color: accent }}>{nonEmpty(info.title) || "Your professional title"}</p>
              {visible.about && <p className={`mt-6 max-w-2xl text-base leading-7 ${muted}`}>{about}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {portfolio.resume.enabled && resumeUrl && <a href={resumeUrl} download={resumeName} className="flex h-11 items-center gap-2 rounded-xl px-4 text-xs font-semibold" style={{ backgroundColor: accent, color: accentText }}><Download size={15} /> Download résumé</a>}
                {videoEmbed && <button type="button" onClick={() => setShowVideo(true)} className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-semibold ${card}`}><Play size={15} /> Watch introduction</button>}
                {visible.contact && <a href="#portfolio-contact" className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-xs font-semibold ${card}`}><Mail size={15} /> Contact me</a>}
                {visible.about && location && <span className={`flex items-center gap-2 px-2 text-xs ${muted}`}><MapPin size={14} /> {location}</span>}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className={`aspect-square rounded-[2.5rem] border p-5 shadow-2xl ${card}`}>
                {profileImageUrl ? <img src={profileImageUrl} alt={nonEmpty(info.fullName) || "Portfolio profile"} className="h-full w-full rounded-[2rem] object-cover" /> : <div className="flex h-full items-center justify-center rounded-[2rem] text-7xl font-semibold text-white" style={{ background: `linear-gradient(145deg, ${accent}, #292524)` }}>{initials(info.fullName)}</div>}
              </div>
              <div className={`absolute -bottom-5 -left-5 flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-xl ${card}`}><Sparkles size={18} style={{ color: accent }} /><div><strong className="block text-lg">{projects.length}</strong><span className={`text-[11px] ${muted}`}>Published projects</span></div></div>
            </div>
          </div>
        </section>

        {orderedSectionIds.map((sectionId) => (
          <Fragment key={sectionId}>
        {sectionId === "about" && (visible.about || visible.skills) && (
          <section id="portfolio-about" className={`border-t px-5 py-16 sm:px-8 sm:py-20 ${isLight ? "border-stone-200" : "border-white/10"}`}>
            <div className="mx-auto max-w-6xl">
              {visible.about && <><SectionHeading eyebrow="Profile" title="About me" accent={accent} /><p className="max-w-4xl text-lg leading-8 opacity-80">{about}</p></>}
              {visible.skills && <div className={visible.about ? "mt-10" : ""}><SectionHeading eyebrow="Capabilities" title="Key skills" accent={accent} /><div className="flex flex-wrap gap-2">{(skills.length ? skills : ["Add", "your", "skills"]).map((skill) => <span key={skill} className={`rounded-xl border px-3 py-2 text-xs font-medium ${card}`}>{skill}</span>)}</div></div>}
            </div>
          </section>
        )}

        {sectionId === "experience" && visible.experience && (
          <section id="portfolio-experience" className={`border-t px-5 py-16 sm:px-8 sm:py-20 ${isLight ? "border-stone-200" : "border-white/10"}`}>
            <div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Journey" title="Experience" copy="Roles, responsibilities, and the work that shaped my practice." accent={accent} /><div className="grid gap-4">{(experiences.length ? experiences : [{ id: "empty", role: "Add experience in the editor", company: "Your professional journey will appear here." }]).map((item) => <div key={item.id} className={`grid gap-3 rounded-2xl border p-5 sm:grid-cols-[0.35fr_0.65fr] sm:p-6 ${card}`}><div><p className="font-semibold">{item.role || "Role"}</p><p className={`mt-1 text-sm ${muted}`}>{item.company}</p>{(item.startDate || item.endDate) && <p className={`mt-3 text-xs ${muted}`}>{item.startDate} — {item.isCurrentlyWorking ? "Present" : item.endDate}</p>}</div><div className={`space-y-2 text-sm leading-6 ${muted}`}>{descriptionLines(item.description, 6).map((line) => <p key={line}>• {line}</p>)}{item.tools && <p className="text-xs font-medium" style={{ color: accent }}>{item.tools}</p>}</div></div>)}</div></div>
          </section>
        )}

        {sectionId === "projects" && visible.projects && (
          <section id="portfolio-projects" className={`border-t px-5 py-16 sm:px-8 sm:py-20 ${isLight ? "border-stone-200" : "border-white/10"}`}>
            <div className="mx-auto max-w-6xl">
              <SectionHeading eyebrow="Selected work" title="Projects" copy="Open a project to explore its problem, implementation, source code, live demo, and screenshots." accent={accent} />
              <div className="grid gap-4 md:grid-cols-2">
                {(projects.length ? projects : [{ id: "empty", name: "Your first project", description: "Add a project to turn this placeholder into a real case study." }]).map((item, index) => {
                  const images = projectImages(item);
                  const caseStudy = projectCaseStudy(item);
                  const cardDescription = caseStudy.shortDescription || item.description;
                  return <article key={item.id} className={`group overflow-hidden rounded-2xl border ${card}`}>{images[0] && <img src={images[0]} alt={`${item.name} preview`} className="aspect-video w-full object-cover" />}<div className="p-6"><div className="flex items-start justify-between gap-4"><span className={`text-xs font-medium ${muted}`}>0{index + 1}</span>{(caseStudy.projectType || item.domain) && <span className="text-xs font-medium" style={{ color: accent }}>{caseStudy.projectType || item.domain}</span>}</div><h3 className="mt-8 text-xl font-semibold">{item.name}</h3><div className={`mt-3 space-y-1 text-sm leading-6 ${muted}`}>{descriptionLines(cardDescription, 2).map((line) => <p key={line}>{line}</p>)}</div>{item.techStack && <p className="mt-5 text-xs font-medium" style={{ color: accent }}>{item.techStack}</p>}<div className="mt-6 flex flex-wrap items-center gap-2"><button type="button" onClick={() => setActiveProject(item)} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${card}`}>View case study <ArrowUpRight size={14} /></button>{item.githubUrl && <a href={externalHref(item.githubUrl)} target="_blank" rel="noreferrer" aria-label={`${item.name} on GitHub`} className={`flex h-9 w-9 items-center justify-center rounded-xl border ${card}`}><Code2 size={15} /></a>}{item.liveUrl && <a href={externalHref(item.liveUrl)} target="_blank" rel="noreferrer" aria-label={`${item.name} live demo`} className={`flex h-9 w-9 items-center justify-center rounded-xl border ${card}`}><Globe2 size={15} /></a>}</div></div></article>;
                })}
              </div>
            </div>
          </section>
        )}

        {sectionId === "certifications" && visible.certifications && (
          <section id="portfolio-certifications" className={`border-t px-5 py-16 sm:px-8 sm:py-20 ${isLight ? "border-stone-200" : "border-white/10"}`}>
            <div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Learning" title="Certificates & awards" copy="Credentials with context, evidence, and direct verification." accent={accent} /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(certifications.length ? certifications : [{ id: "empty", title: "Your certificates", issuer: "Add credentials in the editor." }]).map((item) => <article key={item.id} className={`flex flex-col rounded-2xl border p-5 ${card}`}>{assetUrls[portfolio.media?.certificateImageIds?.[item.id]] ? <img src={assetUrls[portfolio.media.certificateImageIds[item.id]]} alt={`${item.title} certificate`} className="aspect-video w-full rounded-xl bg-white object-contain" /> : <Award size={20} style={{ color: accent }} />}<h3 className="mt-6 font-semibold leading-5">{item.title}</h3><p className={`mt-2 text-xs ${muted}`}>{[item.issuer, item.date].filter(Boolean).join(" · ")}</p>{item.credentialId && <p className={`mt-2 text-[11px] ${muted}`}>Credential: {item.credentialId}</p>}{item.description && <p className={`mt-4 flex-1 text-xs leading-5 ${muted}`}>{item.description}</p>}{item.link && <a href={externalHref(item.link)} target="_blank" rel="noreferrer" className="mt-5 flex items-center gap-2 text-xs font-semibold" style={{ color: accent }}><BadgeCheck size={15} /> Verify credential</a>}</article>)}</div></div>
          </section>
        )}

        {sectionId === "contact" && visible.contact && (
          <section id="portfolio-contact" className={`border-t px-5 py-16 sm:px-8 sm:py-20 ${isLight ? "border-stone-200" : "border-white/10"}`}>
            <div className="mx-auto max-w-6xl"><SectionHeading eyebrow="Contact" title="Let’s connect" copy={portfolio.contactMessage} accent={accent} /><div className="grid gap-3 sm:grid-cols-2">{contacts.length ? contacts.map(({ label, value, href, Icon }) => <a key={label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className={`flex min-w-0 items-start gap-4 rounded-2xl border p-5 ${card}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}20`, color: accent }}><Icon size={18} /></span><span className="min-w-0"><span className={`block text-xs ${muted}`}>{label}</span><span className="mt-1 block break-all text-sm font-semibold">{value}</span></span></a>) : <p className={`text-sm ${muted}`}>Enable at least one public contact method in Style & Privacy.</p>}</div></div>
          </section>
        )}
          </Fragment>
        ))}
      </main>

      <footer className={`border-t px-5 py-8 sm:px-8 ${isLight ? "border-stone-200" : "border-white/10"}`}><div className={`mx-auto flex max-w-6xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between ${muted}`}><span>© {new Date().getFullYear()} {nonEmpty(info.fullName) || "Portfolio owner"}</span><span className="flex items-center gap-2"><BriefcaseBusiness size={13} /> Built locally with ZenID</span></div></footer>

      {activeProject && <ProjectModal project={activeProject} caseStudy={projectCaseStudy(activeProject)} images={projectImageEntries(activeProject)} accent={accent} isLight={isLight} onClose={() => setActiveProject(null)} />}
      {showVideo && videoEmbed && <ModalShell title={`Introduction — ${nonEmpty(info.fullName) || "Portfolio owner"}`} onClose={() => setShowVideo(false)} isLight={isLight}><div className="p-4 sm:p-6"><iframe src={videoEmbed} title="Portfolio introduction video" className="aspect-video w-full rounded-xl bg-black" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /></div></ModalShell>}
    </article>
  );
}
