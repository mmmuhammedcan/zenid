// Shared "what actually has content" logic — used by both ResumePreview.jsx
// (on-screen) and resumePdfExport.js (downloaded file) so the two can never
// drift apart on what counts as a filled-in entry.
export function formatDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.toLowerCase() === "present") return "Present";
  if (dateStr.includes("-")) {
    const [year, month] = dateStr.split("-");
    const date = new Date(year, month - 1);
    return date.toLocaleString("en-US", { month: "short", year: "numeric" });
  }
  return dateStr;
}

export function getFilledSections(resumeData) {
  const {
    domains = [],
    skills = [],
    experience = [],
    projects = [],
    achievements = [],
    certifications = [],
    education = [],
    additionalSection = {},
  } = resumeData;

  return {
    domains: (domains || []).filter((d) => d.text),
    skills: (skills || []).filter((s) => s.category || s.items),
    experience: (experience || []).filter((e) => e.company || e.role),
    projects: (projects || []).filter((p) => p.name),
    achievements: (achievements || []).filter((a) => a.title),
    certifications: (certifications || []).filter((c) => c.title),
    education: (education || []).filter((e) => e.institution || e.degree),
    hasAdditional: !!(additionalSection.title && additionalSection.content),
  };
}
