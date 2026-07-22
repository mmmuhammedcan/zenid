import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { materializeResumeData, normalizeProject } from "../src/resume/projectSchema.js";
import { parseProjectFileBytes, serializeProjectArchive } from "../src/resume/projectFile.js";
import { buildResumePdf } from "../src/resume/resumePdfExport.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../..");
const artifactsDirectory = path.join(repositoryRoot, "artifacts");
const projectPath = path.join(artifactsDirectory, "Muhammed_Can_Ozdemir_ZenID_Project.zenid");
const originalPdfPath = path.join(artifactsDirectory, "Muhammed_Can_Ozdemir_Resume.pdf");
const restoredPdfPath = path.join(artifactsDirectory, "Muhammed_Can_Ozdemir_Restored_Resume.pdf");

function fixtureProject() {
  return normalizeProject({
    schemaVersion: 1,
    profile: {
      personalInfo: {
        fullName: "Muhammed Can Özdemir",
        title: "Computer Engineering Student | Software, AI & Cloud",
        email: "can.ozdemir_01@metu.edu.tr",
        phone: "+90 539 788 7814",
        city: "Ankara",
        state: "Turkey",
        portfolio: "",
        linkedin: "",
        github: "",
        summary:
          "METU Computer Engineering student focused on system architecture and low-level programming. Experienced in building cloud-native, ML-enhanced applications using Go, C++, and Python, integrating deep-learning models into scalable systems, and optimizing high-performance software with OOP principles and design patterns.",
      },
      domains: [
        { id: "domain-ai", text: "Artificial Intelligence & Machine Learning" },
        { id: "domain-software", text: "Software Engineering & Automation" },
        { id: "domain-cloud", text: "Cloud Computing (AWS)" },
      ],
      skills: [
        { id: "skill-programming", category: "Programming Languages", items: "C, C++, Go (learning), Python, SQL" },
        { id: "skill-tools", category: "Tools & Technologies", items: "Pandas, NumPy, Scikit-learn, XGBoost, MATLAB, Docker, Git, Apache Airflow, AWS" },
        { id: "skill-languages", category: "Languages", items: "Turkish (native), English (fluent), German (basic)" },
      ],
      experience: [
        {
          id: "experience-ave",
          company: "AVE Bilişim — Ankara",
          role: "Software Engineering Intern",
          startDate: "2024-08",
          endDate: "2024-09",
          description:
            "Developed a Python–Superset automation system that reduced formatting errors to 0%, standardizing official reports across departments.\nReduced manual reporting work by 90% through Airflow DAGs and a Dockerized Superset integration.",
          tools: "Apache Superset, Apache Airflow, Docker, Python",
          isCurrentlyWorking: false,
        },
        {
          id: "experience-commerce",
          company: "T.C. Ministry of Commerce — Ankara",
          role: "Data Analysis Intern",
          startDate: "2024-07",
          endDate: "2024-07",
          description:
            "Analyzed 500+ inspection records in the Electronic Systems & Data Analysis unit to support product-safety compliance.\nAutomated TAREKS reporting workflows, reducing data-preparation time by 30% while improving report accuracy.",
          tools: "Python, SQL, TAREKS",
          isCurrentlyWorking: false,
        },
        {
          id: "experience-gamelab",
          company: "Gamelab — Istanbul",
          role: "C++ / AI Intern",
          startDate: "2023-08",
          endDate: "2023-09",
          description:
            "Applied C++ programming to AI workloads and developed algorithms that improved model performance and execution efficiency.",
          tools: "C++, Algorithm Optimization, Object-Oriented Programming",
          isCurrentlyWorking: false,
        },
      ],
      projects: [
        {
          id: "project-damage",
          name: "Car Damage Detection",
          techStack: "Python / PyTorch / TorchVision / Streamlit",
          startDate: "2025-09",
          endDate: "2025-09",
          description:
            "Built a ResNet-based vehicle-damage detector with ImageNet transfer learning and Optuna hyperparameter tuning.\nDeployed the trained model as an interactive Streamlit application with Matplotlib visualizations.",
          link: "",
          isCurrentProject: false,
        },
        {
          id: "project-credit",
          name: "Credit Risk Modeling",
          techStack: "Python / Scikit-learn / Streamlit",
          startDate: "2025-08",
          endDate: "2025-08",
          description:
            "Achieved 85% classification accuracy and reduced false negatives by 12% using logistic regression, decision trees, and ensemble methods.\nBuilt a Streamlit dashboard that cut manual risk-evaluation time by 40%.",
          link: "",
          isCurrentProject: false,
        },
        {
          id: "project-healthcare",
          name: "Healthcare Premium Prediction",
          techStack: "Python / Scikit-learn / Streamlit",
          startDate: "2025-08",
          endDate: "2025-09",
          description:
            "Engineered a regression model with an R² score of 0.82 and improved prediction accuracy by 15% over baseline.\nDeployed an application that generated premium estimates in two seconds.",
          link: "",
          isCurrentProject: false,
        },
        {
          id: "project-uav",
          name: "UAV Avionics & Flight Planning — TEKNOFEST",
          techStack: "Mission Planner / MATLAB",
          startDate: "2022-09",
          endDate: "2023-04",
          description:
            "Designed avionics subsystems and autonomous missions that supported two successful UAV test flights.\nValidated navigation and control logic on 5+ simulated missions before physical testing.",
          link: "",
          isCurrentProject: false,
        },
      ],
      achievements: [
        {
          id: "achievement-teknofest",
          title: "TEKNOFEST UAV Competition Participant — HUTECH Team, METU",
          description:
            "Contributed to avionics development and autonomous mission planning, supporting two successful UAV test flights.",
          date: "2023",
        },
      ],
      certifications: [
        { id: "cert-ml", title: "Master Machine Learning for Data Science & AI: Beginner to Advanced", issuer: "Codebasics", date: "", link: "" },
        { id: "cert-sql", title: "SQL Beginner to Advanced for Data Professionals", issuer: "Codebasics", date: "", link: "" },
        { id: "cert-python", title: "Python: Beginner to Advanced for Data Professionals", issuer: "Codebasics", date: "", link: "" },
        { id: "cert-math", title: "Math and Statistics for AI and Data Science", issuer: "Codebasics", date: "", link: "" },
        { id: "cert-deep", title: "Deep Learning: Beginner to Advanced", issuer: "Codebasics", date: "Aug 2025", link: "" },
        { id: "cert-aws", title: "AWS Certified Cloud Practitioner", issuer: "Amazon Web Services", date: "Mar 2026", link: "" },
      ],
      education: [
        {
          id: "education-ceng",
          institution: "Middle East Technical University — Ankara, Turkey",
          degree: "Bachelor of Science (B.Sc.)",
          field: "Computer Engineering",
          startDate: "2023-10",
          endDate: "",
          gpa: "2.88",
          isCurrentlyStudying: true,
        },
        {
          id: "education-ee",
          institution: "Middle East Technical University — Ankara, Turkey",
          degree: "Bachelor of Science",
          field: "Electrical & Electronics Engineering",
          startDate: "2020-09",
          endDate: "2023-06",
          gpa: "3.27",
          isCurrentlyStudying: false,
        },
      ],
      additionalSection: { title: "", content: "", link: "" },
    },
    resumes: [
      {
        id: "resume-general",
        name: "Muhammed Can Özdemir — General Resume",
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

async function exportProject() {
  await mkdir(artifactsDirectory, { recursive: true });
  const project = fixtureProject();
  const originalPdf = new Uint8Array(await readFile(originalPdfPath));
  const archive = serializeProjectArchive(project, {
    exportedAt: "2026-07-21T00:00:00.000Z",
    generatedPdfs: [{ resumeId: project.resumes[0].id, bytes: originalPdf }],
  });
  await writeFile(projectPath, archive);
  process.stdout.write(`${JSON.stringify({ stage: "saved", projectPath, bytes: archive.byteLength }, null, 2)}\n`);
}

async function restoreProject() {
  const archive = new Uint8Array(await readFile(projectPath));
  const restored = parseProjectFileBytes(archive);
  const expected = fixtureProject();
  assert.deepEqual(restored, expected, "The restored ZenID project differs from the saved project");

  const resume = restored.resumes[0];
  const resumeData = materializeResumeData(restored, resume.id);
  const fontDirectory = path.join(repositoryRoot, "frontend/pdf-editor/public/assets/fonts");
  const fontData = {
    normal: (await readFile(path.join(fontDirectory, "NotoSans-Regular.ttf"))).toString("base64"),
    bold: (await readFile(path.join(fontDirectory, "NotoSans-Bold.ttf"))).toString("base64"),
    italic: (await readFile(path.join(fontDirectory, "NotoSans-Italic.ttf"))).toString("base64"),
  };
  const pdf = await buildResumePdf({ resumeData, accentColor: resume.accentColor, fontData });
  const pdfBytes = new Uint8Array(pdf.output("arraybuffer"));
  await writeFile(restoredPdfPath, pdfBytes);

  process.stdout.write(
    `${JSON.stringify(
      {
        stage: "restored-in-fresh-process",
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
