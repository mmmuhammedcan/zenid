# SPEC-001 — Open ZenID Project Locally

Status: In progress; representative-device release gate open
Owner: Creator
Last clarified: 2026-07-25

## Problem and user

A user needs to reopen an editable private ZenID workspace without uploading
the project or damaging the current browser workspace when the file is invalid.

## Scope

In scope: local `.zenid` selection, compatibility validation, profile/resume/
portfolio restoration, referenced media import, and observable error handling.

Out of scope: cloud sync, editing the selected source file, cross-device
transfer, and automatic recovery of unsupported future schemas.

## Business rules

- BR-001: Opening a file reads a local working copy; it never modifies the
  selected file.
- BR-002: A supported valid project restores all canonical project data.
- BR-003: A newer or unsupported schema is rejected rather than partially
  normalized.
- BR-004: A failed import leaves the current workspace unchanged.
- BR-005: Imported media and project state commit atomically from the user's
  perspective.
- BR-006: Opening a project performs no project-data network upload.
- BR-007: A rejected project is never repaired or opened partially. ZenID
  classifies the failure, confirms the current workspace was not changed, and
  offers another local project selection.
- BR-008: Resume and Portfolio use the same recovery categories and guidance.
  Raw stack traces, DOM exception details, and internal paths are not shown.

## Acceptance criteria

### AC-001 — Valid project

Given a valid schema-v1 `.zenid` project with referenced media, when the user
confirms opening it, then profile, resumes, portfolio, and media are restored,
the UI reports local success, and the source file remains unchanged.

### AC-002 — Newer project

Given a project created by a newer schema, when it is opened, then ZenID shows a
compatibility message and the current workspace and media remain unchanged.

### AC-003 — Unsafe or oversized archive

Given an archive with an unsafe path, invalid media, or an exceeded resource
limit, when it is opened, then ZenID rejects it without partial persistence.

### AC-004 — No upload

Given any local project open attempt, when the operation completes or fails,
then no HTTP request contains project bytes, profile data, or media.

### AC-005 — Actionable recovery guidance

Given a project is newer, unsupported, corrupt/incomplete, blocked by a safety
limit, or cannot be persisted by the local browser, when opening fails, then an
accessible recovery panel shows the matching category, states that the current
workspace was not changed and nothing was uploaded, and offers **Open another
project** and **Continue with current workspace**.

### AC-006 — Shared recovery surfaces

Given the same failure in Resume or Portfolio, when recovery guidance appears,
then both surfaces use the same classification and actions while their current
profile and media remain unchanged.

## Non-functional requirements

- Compressed input limit: 25 MB.
- Per-media limit: 8 MB.
- Expanded-data processing must enforce a safe upper bound without first
  materializing an unbounded archive.
- Error messages must be actionable and must not expose stack traces.

## Resolved decisions

- Q-001: A project with a missing or invalid referenced media item fails
  atomically. The current workspace remains unchanged. See D-005.
- D-006: A released ZenID reader supports its current schema plus the previous
  three schema versions for at least 18 months after each schema's release. A
  schema leaves support only after both conditions are true. Older readers
  reject newer schemas without partial recovery and direct the user to update.
- D-007: ZIP extraction and project validation run in a Web Worker. The
  existing named-machine baseline showed a 250–280 ms near-limit scheduler
  delay on the main thread; the worker reduced the same proxy to 10 ms while
  preserving every archive limit and the prepare-then-commit boundary.

## Open questions

- Q-002: Is the current 75 MB pre-materialization browser memory budget
  appropriate on the minimum supported physical device? Owner: Engineering.
  The responsiveness decision is resolved by D-007; a real lower-bound device
  measurement is still required before release to validate the memory budget
  and either retain or lower the 75 MB limit.

## Verification mapping

- AC-001: `projectFile.test.js`, `projectSchema.test.js`, and
  `e2e/spec001-open-project.spec.js`.
- AC-002: `projectSchema.test.js` and
  `e2e/spec001-open-project.spec.js` verify strict rejection, update guidance,
  and workspace preservation for a newer schema.
- AC-003: `projectFile.test.js` covers missing/invalid media, unsafe and
  duplicate paths, compressed/expanded limits, entry count, per-entry size, and
  inconsistent stored-entry metadata.
- AC-004: `e2e/spec001-open-project.spec.js` observes request bodies during
  local import.
- AC-005: `projectOpenRecovery.test.js` maps controlled error codes without
  exposing raw details; `e2e/spec001-open-project.spec.js` verifies visible
  categories, focus, actions, and workspace preservation.
- AC-006: Resume and Portfolio browser cases use the shared recovery component.

## Delivery artifacts

- Technical approach: `plan.md`
- Executable work: `tasks.md`
- Verified results and open evidence: `evidence.md`
