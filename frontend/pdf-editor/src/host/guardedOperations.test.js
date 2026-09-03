// SPEC-011 T005/T006 — the guarded operation layer.
//
// These tests are the product promise in D-026: an agent may rewrite how the
// user's history reads, but it may not quietly rewrite what the history says,
// and it may not publish anything the user did not choose to publish. They are
// written against the guarded layer directly because that layer, not the MCP
// protocol wrapper, is where the rules live.

import assert from "node:assert/strict";
import test from "node:test";

import {
  addFact,
  applyPortfolioSettings,
  assertPublicationNotWidened,
  editFact,
  PublicationGuardError,
  PresentationBoundaryError,
  resetWording,
  setItemSelection,
  setWording,
} from "./guardedOperations.js";
import {
  CURRENT_SCHEMA_VERSION,
  createEmptyProject,
  materializeResumeData,
  normalizeProject,
} from "../resume/projectSchema.js";

function syntheticProject(overrides = {}) {
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      personalInfo: {
        fullName: "Ada Yılmaz",
        title: "Software Engineer",
        email: "ada@example.test",
        phone: "+90 555 000 0000",
        city: "Ankara",
      },
      experience: [
        {
          id: "experience-labs",
          company: "Example Labs",
          role: "Software Engineering Intern",
          startDate: "2025-06",
          endDate: "2025-08",
          description: "Built a local-first document workflow.",
          isCurrentlyWorking: false,
        },
      ],
      projects: [
        {
          id: "project-docs",
          name: "Local Document Workspace",
          description: "A local-first résumé workspace.",
        },
      ],
      education: [
        {
          id: "education-university",
          institution: "Example University",
          degree: "BSc Computer Engineering",
          startDate: "2021-09",
          endDate: "2025-06",
        },
      ],
      certifications: [
        {
          id: "certification-cloud",
          name: "Cloud Practitioner",
          issuer: "Example Cloud",
          credentialId: "EX-1234",
        },
      ],
    },
    resumes: [
      {
        id: "resume-general",
        name: "General Resume",
        language: "en",
        template: "minimal",
        accentColor: "#1F2A44",
        selectedItems: {},
        contentOverrides: {},
      },
    ],
    ...overrides,
  });
}

// --- AC-003: wording edits never touch the canonical profile -----------------

test("a wording edit stores an override and leaves the canonical item untouched", () => {
  const project = syntheticProject();
  const canonicalBefore = project.profile.experience[0].description;

  const result = setWording(project, {
    resumeId: "resume-general",
    field: "experience",
    itemId: "experience-labs",
    description: "Shipped a privacy-first document workflow used across the team.",
  });

  assert.equal(result.project.profile.experience[0].description, canonicalBefore);
  assert.equal(
    result.project.resumes[0].contentOverrides.experience["experience-labs"].description,
    "Shipped a privacy-first document workflow used across the team."
  );
  // The résumé the user actually exports reflects the new wording.
  const resumeData = materializeResumeData(result.project, "resume-general");
  assert.equal(
    resumeData.experience[0].description,
    "Shipped a privacy-first document workflow used across the team."
  );
  // BR-003: the change is reported concretely.
  assert.deepEqual(result.changes, [
    {
      path: "resumes.resume-general.contentOverrides.experience.experience-labs.description",
      before: canonicalBefore,
      after: "Shipped a privacy-first document workflow used across the team.",
    },
  ]);
});

test("resetting wording restores the canonical text and reports the removal", () => {
  const project = syntheticProject();
  const edited = setWording(project, {
    resumeId: "resume-general",
    field: "experience",
    itemId: "experience-labs",
    description: "Rewritten.",
  }).project;

  const result = resetWording(edited, {
    resumeId: "resume-general",
    field: "experience",
    itemId: "experience-labs",
  });

  const resumeData = materializeResumeData(result.project, "resume-general");
  assert.equal(resumeData.experience[0].description, "Built a local-first document workflow.");
  assert.equal(result.changes[0].before, "Rewritten.");
  assert.equal(result.changes[0].after, "Built a local-first document workflow.");
});

// --- AC-004: facts are refused by the wording tool ---------------------------

const factualWordingAttempts = [
  { name: "employer name", field: "experience", itemId: "experience-labs", patch: { company: "Better Labs" } },
  { name: "role title", field: "experience", itemId: "experience-labs", patch: { role: "Senior Engineer" } },
  { name: "start date", field: "experience", itemId: "experience-labs", patch: { startDate: "2024-01" } },
  { name: "institution name", field: "education", itemId: "education-university", patch: { institution: "Better University" } },
  { name: "credential identifier", field: "certifications", itemId: "certification-cloud", patch: { credentialId: "EX-9999" } },
];

for (const attempt of factualWordingAttempts) {
  test(`a wording edit refuses to change the ${attempt.name}`, () => {
    const project = syntheticProject();
    assert.throws(
      () =>
        setWording(project, {
          resumeId: "resume-general",
          field: attempt.field,
          itemId: attempt.itemId,
          ...attempt.patch,
        }),
      (error) => {
        assert.ok(error instanceof PresentationBoundaryError, "expected a presentation-boundary refusal");
        // AC-004: the error must be actionable, naming the tool that can do it.
        assert.match(error.message, /zenid_edit_fact/);
        assert.match(error.message, new RegExp(Object.keys(attempt.patch)[0]));
        return true;
      }
    );
  });
}

test("a wording edit on a section that has no override support is refused", () => {
  const project = syntheticProject();
  assert.throws(
    () =>
      setWording(project, {
        resumeId: "resume-general",
        field: "education",
        itemId: "education-university",
        description: "Reworded.",
      }),
    PresentationBoundaryError
  );
});

// --- AC-005: fact edits report old and new values ----------------------------

test("a fact edit applies the change and reports the field path, old value, and new value", () => {
  const project = syntheticProject();
  const result = editFact(project, {
    field: "experience",
    itemId: "experience-labs",
    changes: { company: "Example Labs GmbH", startDate: "2025-05" },
  });

  assert.equal(result.project.profile.experience[0].company, "Example Labs GmbH");
  assert.deepEqual(result.changes, [
    { path: "profile.experience.experience-labs.company", before: "Example Labs", after: "Example Labs GmbH" },
    { path: "profile.experience.experience-labs.startDate", before: "2025-06", after: "2025-05" },
  ]);
});

test("a fact edit reports personal information changes with their path", () => {
  const project = syntheticProject();
  const result = editFact(project, {
    field: "personalInfo",
    changes: { title: "Senior Software Engineer" },
  });
  assert.deepEqual(result.changes, [
    { path: "profile.personalInfo.title", before: "Software Engineer", after: "Senior Software Engineer" },
  ]);
});

test("a fact edit that changes nothing reports no changes and returns the same project", () => {
  const project = syntheticProject();
  const result = editFact(project, {
    field: "experience",
    itemId: "experience-labs",
    changes: { company: "Example Labs" },
  });
  assert.deepEqual(result.changes, []);
  assert.deepEqual(result.project, project);
});

test("a fact edit refuses an unknown item", () => {
  const project = syntheticProject();
  assert.throws(
    () => editFact(project, { field: "experience", itemId: "missing", changes: { company: "X" } }),
    /not found/i
  );
});

// --- SPEC-011 D-030: adding a brand-new profile entry -----------------------

test("addFact appends a new experience entry and reports it as added", () => {
  const project = syntheticProject();
  const result = addFact(project, {
    field: "experience",
    values: { company: "Google", role: "SWE", startDate: "2024-01" },
  });
  assert.equal(result.project.profile.experience.length, 2);
  const added = result.project.profile.experience[1];
  assert.equal(added.company, "Google");
  assert.equal(added.role, "SWE");
  assert.ok(added.id, "a new entry must get an id the caller did not have to invent");
  const factualChange = result.changes.find((change) => change.field === "experience");
  assert.equal(factualChange.itemId, added.id);
  assert.deepEqual(factualChange.after, { company: "Google", role: "SWE", startDate: "2024-01" });
  assert.ok(result.project.portfolio.hiddenItems.experience.includes(added.id));
});

test("addFact supports every array section in the canonical profile", () => {
  const cases = [
    ["domains", { text: "Backend systems" }, "text", "Backend systems"],
    ["skills", { category: "Cloud", items: "AWS, GCP" }, "category", "Cloud"],
    ["projects", { name: "Campus App", techStack: "React" }, "name", "Campus App"],
    ["achievements", { title: "Hackathon finalist" }, "title", "Hackathon finalist"],
    ["certifications", { title: "Cloud Practitioner", issuer: "Example Cloud" }, "issuer", "Example Cloud"],
    ["education", { institution: "METU", degree: "BSc" }, "institution", "METU"],
  ];

  for (const [field, values, assertedKey, assertedValue] of cases) {
    const result = addFact(syntheticProject(), { field, values });
    assert.ok(result.project.profile[field].some((item) => item[assertedKey] === assertedValue));
  }
});

test("addFact replaces the blank scaffold row in a newly created project", () => {
  const project = createEmptyProject();
  assert.equal(project.profile.experience.length, 1);

  const result = addFact(project, {
    field: "experience",
    values: { company: "Example Labs", role: "Intern" },
  });

  assert.equal(result.project.profile.experience.length, 1);
  assert.equal(result.project.profile.experience[0].company, "Example Labs");
});

test("addFact preserves a sole skill row whose category was user-authored", () => {
  const project = createEmptyProject();
  project.profile.skills[0].category = "Databases";

  const result = addFact(project, {
    field: "skills",
    values: { category: "Programming", items: "JavaScript" },
  });

  assert.equal(result.project.profile.skills.length, 2);
  assert.equal(result.project.profile.skills[0].category, "Databases");
});

test("addFact keeps a newly added skill private until the user publishes it", () => {
  const result = addFact(createEmptyProject(), {
    field: "skills",
    values: { category: "Programming", items: "JavaScript" },
  });

  assert.equal(result.project.portfolio.visibleSections.skills, false);
  assert.ok(
    result.changes.some(
      (change) => change.path === "portfolio.visibleSections.skills" && change.after === false
    )
  );
});

test("addFact refuses an unknown section", () => {
  const project = syntheticProject();
  assert.throws(() => addFact(project, { field: "notASection", values: {} }), /unknown/i);
});

test("addFact refuses a key that is not part of the item shape", () => {
  const project = syntheticProject();
  assert.throws(
    () => addFact(project, { field: "experience", values: { company: "Google", notARealField: "x" } }),
    /notARealField/
  );
});

test("addFact refuses empty and incorrectly typed entries", () => {
  const project = syntheticProject();
  assert.throws(
    () => addFact(project, { field: "experience", values: {} }),
    /non-empty/i
  );
  assert.throws(
    () => addFact(project, { field: "experience", values: { company: 42 } }),
    /value type/i
  );
  assert.throws(
    () => addFact(project, { field: "experience", values: [] }),
    /values object/i
  );
  assert.throws(
    () => addFact(project, { field: "experience", values: { isCurrentlyWorking: true } }),
    /non-empty/i
  );
});

test("addFact never lets the caller pick the new item's id", () => {
  const project = syntheticProject();
  const result = addFact(project, {
    field: "experience",
    values: { company: "Google", id: "attacker-chosen-id" },
  });
  const added = result.project.profile.experience[1];
  assert.notEqual(added.id, "attacker-chosen-id");
});

// --- AC-006: the publication scope cannot be widened -------------------------

test("enabling a contact privacy flag is refused and the project is unchanged", () => {
  const project = syntheticProject();
  assert.throws(
    () => applyPortfolioSettings(project, { contactPrivacy: { email: true } }),
    (error) => {
      assert.ok(error instanceof PublicationGuardError);
      assert.match(error.message, /contactPrivacy\.email/);
      return true;
    }
  );
  assert.equal(project.portfolio.contactPrivacy.email, false);
});

test("enabling a hidden portfolio section is refused", () => {
  const project = syntheticProject();
  const hidden = applyPortfolioSettings(project, { visibleSections: { projects: false } }).project;
  assert.equal(hidden.portfolio.visibleSections.projects, false);

  assert.throws(
    () => applyPortfolioSettings(hidden, { visibleSections: { projects: true } }),
    (error) => {
      assert.ok(error instanceof PublicationGuardError);
      assert.match(error.message, /visibleSections\.projects/);
      return true;
    }
  );
});

test("un-hiding an item the user hid is refused", () => {
  const project = syntheticProject();
  const hidden = applyPortfolioSettings(project, {
    hiddenItems: { experience: ["experience-labs"] },
  }).project;
  assert.deepEqual(hidden.portfolio.hiddenItems.experience, ["experience-labs"]);

  assert.throws(
    () => applyPortfolioSettings(hidden, { hiddenItems: { experience: [] } }),
    (error) => {
      assert.ok(error instanceof PublicationGuardError);
      assert.match(error.message, /hiddenItems\.experience/);
      return true;
    }
  );
});

test("attaching media to the public portfolio is refused", () => {
  const project = syntheticProject();
  assert.throws(
    () => applyPortfolioSettings(project, { media: { profileImageId: "asset-1" } }),
    (error) => {
      assert.ok(error instanceof PublicationGuardError);
      assert.match(error.message, /media/);
      return true;
    }
  );
  assert.throws(
    () => applyPortfolioSettings(project, { media: { projectImageIds: { "project-docs": "asset-2" } } }),
    PublicationGuardError
  );
});

test("enabling the published résumé is refused", () => {
  const project = syntheticProject();
  assert.throws(
    () => applyPortfolioSettings(project, { resume: { enabled: true } }),
    (error) => {
      assert.ok(error instanceof PublicationGuardError);
      assert.match(error.message, /portfolio\.resume\.enabled/);
      return true;
    }
  );
  assert.equal(project.portfolio.resume.enabled, false);
});

test("narrowing the publication scope is allowed", () => {
  const project = syntheticProject();
  const result = applyPortfolioSettings(project, {
    visibleSections: { contact: false },
    hiddenItems: { projects: ["project-docs"] },
  });
  assert.equal(result.project.portfolio.visibleSections.contact, false);
  assert.deepEqual(result.project.portfolio.hiddenItems.projects, ["project-docs"]);
  assert.ok(result.changes.length >= 2);
});

test("editing non-publication portfolio copy is allowed", () => {
  const project = syntheticProject();
  const result = applyPortfolioSettings(project, { about: "A privacy-first engineer." });
  assert.equal(result.project.portfolio.about, "A privacy-first engineer.");
});

// The guard is a standalone check so that every future tool goes through it,
// not only the portfolio one. A new tool that forgets it is the failure mode
// this test exists to make visible.
test("the publication guard rejects any widening between two arbitrary projects", () => {
  const before = syntheticProject();
  const widened = normalizeProject({
    ...before,
    portfolio: { ...before.portfolio, resume: { ...before.portfolio.resume, enabled: true } },
  });
  assert.throws(() => assertPublicationNotWidened(before, widened), PublicationGuardError);
  assert.doesNotThrow(() => assertPublicationNotWidened(before, before));
});

// --- Selection edits still go through the guard ------------------------------

test("excluding an item from a résumé variant is allowed and reported", () => {
  const project = syntheticProject();
  const result = setItemSelection(project, {
    resumeId: "resume-general",
    field: "experience",
    itemId: "experience-labs",
    included: false,
  });
  const resumeData = materializeResumeData(result.project, "resume-general");
  assert.equal(resumeData.experience.length, 0);
  assert.equal(result.changes[0].before, true);
  assert.equal(result.changes[0].after, false);
});
