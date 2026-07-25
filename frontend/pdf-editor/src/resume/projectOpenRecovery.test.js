import test from "node:test";
import assert from "node:assert/strict";
import { classifyProjectOpenError } from "./projectOpenRecovery.js";

const CASES = [
  ["NEWER_PROJECT", "update-required"],
  ["UNSUPPORTED_PROJECT", "unsupported-version"],
  ["INVALID_FILE", "incomplete-or-corrupt"],
  ["INVALID_PROJECT", "incomplete-or-corrupt"],
  ["INVALID_ARCHIVE", "incomplete-or-corrupt"],
  ["INVALID_PROJECT_JSON", "incomplete-or-corrupt"],
  ["MISSING_MANIFEST", "incomplete-or-corrupt"],
  ["INVALID_MANIFEST", "incomplete-or-corrupt"],
  ["MISSING_RESUME", "incomplete-or-corrupt"],
  ["INVALID_RESUME", "incomplete-or-corrupt"],
  ["INVALID_PROFILE", "incomplete-or-corrupt"],
  ["MISSING_PROJECT_FILE", "incomplete-or-corrupt"],
  ["MISSING_MEDIA_ASSET", "incomplete-or-corrupt"],
  ["INVALID_MEDIA_ASSET", "incomplete-or-corrupt"],
  ["INVALID_GENERATED_PDF", "incomplete-or-corrupt"],
  ["INVALID_CONTENT_OVERRIDE", "incomplete-or-corrupt"],
  ["INVALID_LEGACY_DRAFT", "incomplete-or-corrupt"],
  ["INCOMPATIBLE_PROJECT", "incomplete-or-corrupt"],
  ["PROJECT_TOO_LARGE", "safety-limit"],
  ["PROJECT_EXPANDED_SIZE_LIMIT", "safety-limit"],
  ["ARCHIVE_ENTRY_COUNT_LIMIT", "safety-limit"],
  ["ARCHIVE_ENTRY_SIZE_LIMIT", "safety-limit"],
  ["UNSAFE_ARCHIVE_PATH", "safety-limit"],
  ["DUPLICATE_ARCHIVE_ENTRY", "safety-limit"],
  ["UNSUPPORTED_ARCHIVE_CONTENT", "safety-limit"],
  ["PROJECT_WORKER_FAILED", "local-browser"],
];

test("project-open errors map to stable user recovery categories", () => {
  CASES.forEach(([code, category]) => {
    const recovery = classifyProjectOpenError({ code, message: "raw internal detail" });
    assert.equal(recovery.category, category);
    assert.equal(recovery.code, code);
    assert.equal(recovery.assurance, "Your current workspace was not changed. Nothing was uploaded.");
    assert.doesNotMatch(`${recovery.title} ${recovery.message} ${recovery.guidance}`, /raw internal detail/);
  });
});

test("unknown browser failures suppress raw details and stay actionable", () => {
  const recovery = classifyProjectOpenError(
    new DOMException("Injected quota path /private/storage", "QuotaExceededError")
  );

  assert.equal(recovery.category, "local-browser");
  assert.match(recovery.guidance, /browser storage/i);
  assert.doesNotMatch(JSON.stringify(recovery), /Injected|private\/storage|QuotaExceeded/);
});
