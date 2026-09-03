// SPEC-011 D-028 — structured data from `zenid-resume-checklist.pdf`.
//
// This module holds no logic. It is the checklist's own actionable framework
// (the evidence formula, the structure checklist, and the four prompts it
// gives for using an AI editor) transcribed as data, so the ZenID MCP plugin
// can hand it to a connected agent instead of asking every user to open and
// re-read a five-page PDF before getting help.
//
// Deliberately excluded: the checklist's scoring rubric ("Your evidence
// score", 0-16) and any language that ranks or grades content. This module is
// reference material for a conversation about the user's own real
// experience, not a function that judges it (D-026, D-028).

export const RESUME_PLAYBOOK = {
  source: "zenid-resume-checklist.pdf",
  standard:
    "A resume is a targeted evidence document, not a biography or a keyword container. " +
    "Every line should help a reader answer: can this person do the work, at the level " +
    "and scale needed, for this specific role.",

  evidenceFormula: {
    formula: "Action + object/problem + method/constraints + result/learning",
    example:
      "Reduced API p95 latency from 480ms to 190ms by profiling N+1 queries and adding " +
      "indexed batch reads, improving checkout completion during peak traffic.",
    weakVsBetter: [
      {
        weak: "Responsible for building dashboards for sales.",
        better:
          "Built five Power BI dashboards integrating CRM and billing data, cutting weekly " +
          "reporting preparation from four hours to 35 minutes for 18 sales managers.",
      },
      {
        weak: "Worked on a web application using React.",
        better:
          "Implemented an accessible React onboarding flow with schema-based validation and " +
          "event tracking; reduced incomplete registrations by 21% in an A/B test.",
      },
    ],
    bulletStressTest:
      "For each bullet, identify the Action, the Context, the Method, and the Result. " +
      "A bullet missing one of these is a candidate to revise or cut. When a metric is " +
      "unavailable, scale proxies are legitimate evidence: users, requests, records, latency, " +
      "accuracy, cycle time, failure rate, coverage, cost, adoption, or team scope.",
  },

  structureChecklist: [
    "Use a single-column reading order for the safest parsing and fastest scanning.",
    "Use familiar section headings: Experience, Education, Projects, Skills, Publications.",
    "Keep dates, locations, capitalization, punctuation, and verb tense consistent.",
    "Lead each section with its strongest, most relevant item, not strict chronology alone.",
    "State ownership explicitly: designed, implemented, led, analyzed, migrated, automated.",
    "Use present tense for ongoing work and past tense for completed work.",
    "Remove routine responsibilities and generic objective statements that add no signal.",
    "Keep critical contact information in the document body, not only in a header parsers " +
      "may treat inconsistently.",
  ],

  sectionOrderByProfile: {
    studentOrNewGrad: "Header -> Education or Skills -> Experience -> Projects -> Leadership/Awards",
    experiencedHire: "Header -> Summary (only if useful) -> Experience -> Skills -> Projects/Education",
    careerTransition:
      "Header -> Targeted Summary -> Transferable Skills -> Relevant Experience/Projects -> " +
      "Earlier Experience -> Education",
    researchHeavy:
      "Header -> Research Focus -> Education -> Research Experience -> Publications/Presentations -> Skills",
  },

  tailoringWithoutFabricating: [
    "Identify the role's recurring problems, required capabilities, and level signals.",
    "Map each priority to evidence the candidate genuinely possesses.",
    "Reorder sections and bullets so the strongest matches appear early.",
    "Use the employer's terminology only where it accurately describes the candidate's work.",
    "Close real gaps with context or a relevant project. Never invent experience.",
  ],

  // The checklist's own instructions for using an AI editor responsibly: an
  // interview to gather real facts first, then critique against the page as
  // written, never inventing what wasn't supplied.
  aiCollaborationPrompts: [
    {
      name: "evidence_interview",
      purpose: "Turn a vague draft bullet into specific, factual detail before writing anything.",
      prompt:
        "I am targeting [role]. Interview me about this experience: [draft]. Ask one question " +
        "at a time about the problem, my decisions, tools, scale, constraints, collaborators, " +
        "and measurable result. Do not invent facts. After my answers, propose three concise " +
        "bullets and mark every assumption.",
    },
    {
      name: "relevance_review",
      purpose: "Find what is unclear, unsupported, buried, or irrelevant, without keyword stuffing.",
      prompt:
        "Act as a technical recruiter for [job description]. Evaluate my resume only against " +
        "the evidence on the page. Identify: (1) unclear target, (2) unsupported claims, " +
        "(3) buried proof, (4) irrelevant content, (5) missing but truthful keywords. Rank " +
        "revisions by interview impact. Do not reward keyword stuffing.",
    },
    {
      name: "bullet_stress_test",
      purpose: "Check each bullet against the evidence formula and flag what's missing.",
      prompt:
        "For each bullet, label Action, Context, Method, and Result. Flag vague verbs, " +
        "unverifiable metrics, and missing ownership. Suggest a tighter rewrite using only " +
        "the facts I supplied. If evidence is missing, ask a question instead of filling the gap.",
    },
    {
      name: "human_sounding_final_pass",
      purpose: "Edit for clarity without losing the candidate's own voice or inflating claims.",
      prompt:
        "Edit for clarity, specificity, and natural professional English. Preserve facts, " +
        "technical meaning, and my voice. Remove inflated adjectives, repetitive sentence " +
        "patterns, and generic AI phrasing. Return a change log explaining every material edit.",
    },
  ],

  integrityChecks: [
    "Every metric, title, date, tool, and claim can be explained in an interview.",
    "No confidential, security-sensitive, or personally identifying third-party data appears.",
    "AI-generated text has been fact-checked and rewritten in the candidate's own voice.",
    "Employment gaps and overlapping dates are accurate and consistently represented.",
  ],
};
