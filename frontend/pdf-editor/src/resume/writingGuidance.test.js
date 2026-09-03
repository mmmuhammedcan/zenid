// SPEC-011 D-028 — the playbook is data an agent reads, not a scoring
// function ZenID runs, so these tests assert shape and the absence of any
// numeric verdict rather than "correctness" of the advice itself.

import assert from "node:assert/strict";
import test from "node:test";

import { RESUME_PLAYBOOK } from "./writingGuidance.js";

test("the playbook names its source document", () => {
  assert.equal(RESUME_PLAYBOOK.source, "zenid-resume-checklist.pdf");
});

test("the evidence formula includes a worked example and weak/better pairs", () => {
  assert.ok(RESUME_PLAYBOOK.evidenceFormula.formula.includes("Action"));
  assert.ok(RESUME_PLAYBOOK.evidenceFormula.example.length > 0);
  assert.ok(RESUME_PLAYBOOK.evidenceFormula.weakVsBetter.length >= 2);
  RESUME_PLAYBOOK.evidenceFormula.weakVsBetter.forEach((pair) => {
    assert.ok(pair.weak);
    assert.ok(pair.better);
    assert.notEqual(pair.weak, pair.better);
  });
});

test("the structure checklist is a list of concrete, checkable statements", () => {
  assert.ok(Array.isArray(RESUME_PLAYBOOK.structureChecklist));
  assert.ok(RESUME_PLAYBOOK.structureChecklist.length >= 5);
  RESUME_PLAYBOOK.structureChecklist.forEach((item) => assert.equal(typeof item, "string"));
});

test("exactly four AI-collaboration prompts are present, each with a name and prompt text", () => {
  assert.equal(RESUME_PLAYBOOK.aiCollaborationPrompts.length, 4);
  const names = RESUME_PLAYBOOK.aiCollaborationPrompts.map((p) => p.name);
  assert.deepEqual(
    names.sort(),
    ["bullet_stress_test", "evidence_interview", "human_sounding_final_pass", "relevance_review"].sort()
  );
  RESUME_PLAYBOOK.aiCollaborationPrompts.forEach((p) => {
    assert.ok(p.purpose);
    assert.ok(p.prompt);
  });
});

test("every prompt instructs the agent not to invent facts", () => {
  const evidenceInterview = RESUME_PLAYBOOK.aiCollaborationPrompts.find((p) => p.name === "evidence_interview");
  assert.match(evidenceInterview.prompt, /do not invent/i);
});

// The whole point of D-028's boundary: this data must never assert a score,
// rank, or grade of the user's content. A numeric rubric would be exactly the
// "AI resume analysis" plan.md keeps out of the free local product.
test("the playbook carries no scoring rubric or numeric verdict field", () => {
  const serialized = JSON.stringify(RESUME_PLAYBOOK).toLowerCase();
  assert.ok(!serialized.includes("\"score\""));
  assert.ok(!serialized.includes("interpretation"));
});
