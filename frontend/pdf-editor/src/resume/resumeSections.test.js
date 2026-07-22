import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, getFilledSections } from "./resumeSections.js";

test("formatDate handles month values, free text, and present", () => {
  assert.equal(formatDate("2024-08"), "Aug 2024");
  assert.equal(formatDate("Present"), "Present");
  assert.equal(formatDate("Spring 2026"), "Spring 2026");
  assert.equal(formatDate(""), "");
});

test("getFilledSections removes placeholder rows without losing valid content", () => {
  const filled = getFilledSections({
    domains: [{ text: "" }, { text: "Cloud Computing" }],
    skills: [{ category: "", items: "" }, { category: "Languages", items: "Go" }],
    experience: [{ company: "", role: "" }, { company: "ZenID", role: "Engineer" }],
    projects: [{ name: "" }, { name: "Resume Builder" }],
    achievements: [{ title: "" }, { title: "Finalist" }],
    certifications: [{ title: "" }, { title: "AWS" }],
    education: [{ institution: "", degree: "" }, { institution: "METU", degree: "B.Sc." }],
    additionalSection: { title: "Languages", content: "Turkish" },
  });

  assert.deepEqual(filled.domains.map((item) => item.text), ["Cloud Computing"]);
  assert.equal(filled.skills.length, 1);
  assert.equal(filled.experience.length, 1);
  assert.equal(filled.projects.length, 1);
  assert.equal(filled.achievements.length, 1);
  assert.equal(filled.certifications.length, 1);
  assert.equal(filled.education.length, 1);
  assert.equal(filled.hasAdditional, true);
});
