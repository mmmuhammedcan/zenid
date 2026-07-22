import { createStableId } from "./ids.js";

// Order the reorderable main-content sections appear in. Personal Information
// is always first and isn't part of this list. Matches the "Experienced"
// sequence from common resume checklists (Skills -> Experience -> Projects ->
// Achievements -> Certifications -> Education) since that's the safest
// default; users can reorder via the move up/down controls in the sidebar.
export const DEFAULT_SECTION_ORDER = [
  "domains",
  "skills",
  "experience",
  "projects",
  "achievements",
  "certifications",
  "education",
  "additionalSection",
];

export const SECTION_LABELS = {
  domains: "Domain/Functional Areas",
  skills: "Key Skills",
  experience: "Professional Experience",
  projects: "Projects",
  achievements: "Achievements",
  certifications: "Certifications",
  education: "Education",
  additionalSection: "Additional Section",
};

export const createInitialResumeData = () => ({
  personalInfo: {
    fullName: "",
    title: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    portfolio: "",
    linkedin: "",
    github: "",
    summary: "",
  },
  sectionOrder: [...DEFAULT_SECTION_ORDER],
  domains: [
    { id: createStableId(), text: "" },
  ],
  skills: [
    { id: createStableId(), category: "Programming Languages", items: "" },
  ],
  experience: [
    { id: createStableId(), company: "", role: "", startDate: "", endDate: "", description: "", tools: "", isCurrentlyWorking: false },
  ],
  projects: [
    { id: createStableId(), name: "", domain: "", techStack: "", startDate: "", endDate: "", description: "", link: "", githubUrl: "", liveUrl: "", isCurrentProject: false },
  ],
  achievements: [
    { id: createStableId(), title: "", description: "", date: "" },
  ],
  certifications: [
    { id: createStableId(), title: "", issuer: "", date: "", credentialId: "", description: "", link: "" },
  ],
  education: [
    { id: createStableId(), institution: "", degree: "", field: "", startDate: "", endDate: "", gpa: "", isCurrentlyStudying: false },
  ],
  additionalSection: {
    title: "",
    content: "",
    link: "",
  },
});

export const emptyDomain = () => ({
  id: createStableId(),
  text: "",
});

export const emptyExperience = () => ({
  id: createStableId(),
  company: "",
  role: "",
  startDate: "",
  endDate: "",
  description: "",
  tools: "",
  isCurrentlyWorking: false,
});

export const emptySkill = () => ({
  id: createStableId(),
  category: "",
  items: "",
});

export const emptyProject = () => ({
  id: createStableId(),
  name: "",
  domain: "",
  techStack: "",
  startDate: "",
  endDate: "",
  description: "",
  link: "",
  githubUrl: "",
  liveUrl: "",
  isCurrentProject: false,
});

export const emptyAchievement = () => ({
  id: createStableId(),
  title: "",
  description: "",
  date: "",
});

export const emptyEducation = () => ({
  id: createStableId(),
  institution: "",
  degree: "",
  field: "",
  startDate: "",
  endDate: "",
  gpa: "",
  isCurrentlyStudying: false,
});

export const emptyCertification = () => ({
  id: createStableId(),
  title: "",
  issuer: "",
  date: "",
  credentialId: "",
  description: "",
  link: "",
});
