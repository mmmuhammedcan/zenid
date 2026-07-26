import test from "node:test";
import assert from "node:assert/strict";
import {
  detectInitialLocale,
  formatDocumentDate,
  getPortfolioCopy,
  getResumeCopy,
  normalizeLocale,
  translate,
  uppercaseDocumentLabel,
} from "./localization.js";

test("normalizes supported locale variants and falls back safely to English", () => {
  assert.equal(normalizeLocale("tr-TR"), "tr");
  assert.equal(normalizeLocale("en-GB"), "en");
  assert.equal(normalizeLocale("de-DE"), "en");
  assert.equal(normalizeLocale(undefined), "en");
});

test("prefers a stored locale then supported browser languages", () => {
  assert.equal(detectInitialLocale({ storedLocale: "tr", browserLocales: ["en-US"] }), "tr");
  assert.equal(detectInitialLocale({ storedLocale: null, browserLocales: ["de-DE", "tr-TR"] }), "tr");
  assert.equal(detectInitialLocale({ storedLocale: null, browserLocales: ["de-DE"] }), "en");
});

test("translates application copy without changing unknown user-authored text", () => {
  assert.equal(translate("tr", "Build Resume"), "CV Hazırla");
  assert.equal(translate("tr", "Unregistered user sentence"), "Unregistered user sentence");
  assert.equal(translate("en", "Build Resume"), "Build Resume");
});

test("localizes resume labels and dates independently", () => {
  assert.equal(getResumeCopy("tr").sections.experience, "Profesyonel Deneyim");
  assert.equal(getResumeCopy("tr").present, "Devam ediyor");
  assert.equal(getResumeCopy("en").sections.experience, "Professional Experience");
  assert.equal(formatDocumentDate("2026-07", "tr"), "Tem 2026");
  assert.equal(formatDocumentDate("2026-07", "en"), "Jul 2026");
  assert.equal(formatDocumentDate("Present", "tr"), "Devam ediyor");
  assert.equal(uppercaseDocumentLabel("Profesyonel deneyim", "tr"), "PROFESYONEL DENEYİM");
});

test("provides Turkish and English portfolio output chrome", () => {
  assert.equal(getPortfolioCopy("tr").navigation.projects, "Projeler");
  assert.equal(getPortfolioCopy("tr").downloadResume, "CV’yi indir");
  assert.equal(getPortfolioCopy("en").navigation.projects, "Projects");
});
