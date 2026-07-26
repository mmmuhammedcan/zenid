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
  perspective. An imported media identifier that already exists is reused only
  when its stored media is identical; conflicting content is rejected before
  any existing media is overwritten.
- BR-006: Opening a project performs no project-data network upload.
- BR-007: A rejected project is never repaired or opened partially. ZenID
  classifies the failure, confirms the current workspace was not changed, and
  offers another local project selection.
- BR-008: Resume and Portfolio use the same recovery categories and guidance.
  Raw stack traces, DOM exception details, and internal paths are not shown.
  Only messages authored for users are displayed; any other failure is replaced
  by a shared fallback sentence.
- BR-009: An import is not reported as opened until the project is stored in the
  browser. A failed store is a failed import and is classified like any other
  local-browser failure.
- BR-010: Recovery guidance takes focus once when it appears. It does not take
  focus again on re-render or navigation, and a notice that carries no recovery
  action never takes focus and is always dismissible.

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
project** and **Continue with current workspace**. The panel's accessible
description carries the workspace assurance, and the panel is discarded when the
user navigates to another resume surface instead of following it there.

### AC-006 — Shared recovery surfaces

Given the same failure in Resume or Portfolio, when recovery guidance appears,
then both surfaces use the same classification and actions while their current
profile and media remain unchanged. An unavailable browser store is reported with
one shared sentence on both surfaces.

## Non-functional requirements

- Compressed input limit: 25 MB.
- Per-media limit: 8 MB.
- Expanded-data processing must enforce a safe upper bound without first
  materializing an unbounded archive.
- Error messages must be actionable and must not expose stack traces.

## Resolved decisions

- Q-001: A project with a missing or invalid referenced media item fails
  atomically. The current workspace remains unchanged. See D-005.
- D-007: A released ZenID reader supports its current schema plus the previous
  three schema versions for at least 18 months after each schema's release. A
  schema leaves support only after both conditions are true. Older readers
  reject newer schemas without partial recovery and direct the user to update.
- D-008: ZIP extraction and project validation run in a Web Worker. The
  existing named-machine baseline showed a 250–280 ms near-limit scheduler
  delay on the main thread; the worker reduced the same proxy to 10 ms while
  preserving every archive limit and the prepare-then-commit boundary.
- D-009 and D-010 document the former split-store import architecture and its
  collision mitigation. Both are superseded by D-011.
- D-011: Project JSON and media now commit together in one native IndexedDB
  transaction. Byte-identical records may be reused and identifier conflicts
  still fail closed, but a rejected import cannot leave new orphan media.

D-007 and D-008 were previously numbered D-006 and D-007 inside this spec,
which collided with the decision-log entry D-006. They now match
`docs/decision-log.md`.

## Open questions

- Q-002: Is the current 75 MB pre-materialization browser memory budget
  appropriate on the minimum supported physical device? Owner: Engineering.
  The responsiveness decision is resolved by D-008; a real lower-bound device
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
- AC-004: `e2e/spec001-open-project.spec.js` observes every request during
  local import. It rejects non-GET methods, external origins, and sensitive
  profile markers in request URLs while allowing only local runtime assets.
- AC-005: `projectOpenRecovery.test.js` maps controlled error codes without
  exposing raw details and pins the authored-versus-raw notice rule.
  `e2e/spec001-open-project.spec.js` verifies the visible category in the
  corrupt, newer-schema, missing-media, browser-storage, and
  blocked-project-store cases, and asserts the workspace-preservation
  assurance sentence in all of those except browser-storage, which verifies
  preservation behaviorally instead (the full name field is unchanged and the
  rejected asset is absent from storage). It also asserts the panel's
  accessible description in the corrupt case. Browser coverage of focus is
  partial: focus-on-appear is asserted in the corrupt case and in the
  navigation case, and focus-return-after-dismiss only in the newer-schema case.
  The safety-limit and unsupported-version categories have unit coverage but no
  browser case.
- AC-006: Resume and Portfolio browser cases use the shared recovery component.
  `projectOpenRecovery.test.js` pins the shared unavailable-store sentence used
  by both surfaces.
- BR-009: `projectImport.test.js` proves the browser commit persists before the
  visible workspace changes and that a failed store rejects the import;
  `e2e/spec001-open-project.spec.js` proves a blocked store reports recovery
  guidance instead of success.
- BR-005/D-010: `e2e/spec001-open-project.spec.js` proves that a rejected import
  with a conflicting stable media identifier preserves the current stored
  media instead of overwriting it.
- BR-010: `e2e/spec001-open-project.spec.js` proves a recovery panel is
  discarded across a resume surface swap and that an autosave warning neither
  takes focus nor lacks a dismiss control.

## Delivery artifacts

- Technical approach: `plan.md`
- Executable work: `tasks.md`
- Verified results and open evidence: `evidence.md`
