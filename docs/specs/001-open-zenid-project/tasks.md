# SPEC-001 Tasks

Tasks are dependency ordered. A checked item means the implementation work is
present; acceptance still depends on `evidence.md`.

## Decisions and preparation

- [x] T001 Record atomic reject-versus-recovery decision as D-005.
- [x] T002 Define observable business rules and acceptance criteria in
  `spec.md`.
- [x] T003 Document the prepare-then-commit implementation boundary in
  `plan.md`.

## Archive validation

- [x] T010 Verify valid ZIP and legacy JSON round trips.
- [x] T011 Reject missing and invalid referenced media.
- [x] T012 Reject unsafe archive paths.
- [x] T013 Add deterministic compressed, expanded, entry-count, and per-entry
  resource-limit tests.
- [x] T014 Replace or contain post-materialization `unzipSync` resource
  accounting so a ZIP bomb cannot exhaust memory before rejection.

## Atomic persistence

- [x] T020 Extract a testable project-import coordinator with explicit prepare
  and commit dependencies.
- [x] T021 Add an IndexedDB integration test proving a failed asset transaction
  leaves prior records intact.
- [x] T022 Prove project state/localStorage is not committed when media
  persistence fails.

## Browser acceptance

- [x] T030 Install and configure Playwright Chromium with isolated state and
  trace-on-first-retry.
- [x] T031 Test opening a valid `.zenid` project through the visible UI.
- [x] T032 Test that a rejected project leaves the visible current workspace
  unchanged.
- [x] T033 Observe browser requests and prove that project/profile/media bytes
  are not transmitted.

## Performance, evidence, and review

- [x] T040 Record small, typical, and near-limit import timings and main-thread
  blocking on a named environment.
- [x] T041 Map relevant controls to OWASP ASVS 5.0.0 without claiming full
  compliance.
- [x] T042 Run the complete verification command set and update `evidence.md`.
- [x] T043 Perform an independent spec/security/test review.
- [x] T044 Complete dated creator acceptance.
- [x] T045 Move archive extraction and validation to a Web Worker after the
  named-machine near-limit baseline showed user-visible main-thread blocking.
- [ ] T046 Validate the 75 MB memory budget on the minimum supported physical
  device and retain or lower the limit before release.

## Phase 4 recovery guidance

- [x] T047 Keep partial import, ZIP repair, upload, and salvage out of scope.
- [x] T048 Define shared update, unsupported, corrupt/incomplete, safety-limit,
  and local-browser recovery categories.
- [x] T049 Add failing classifier tests for every controlled error family and
  raw-detail suppression.
- [x] T050 Add one accessible shared recovery panel to Resume and Portfolio.
- [x] T051 Add browser evidence for corrupt, newer-schema, missing-media, and
  browser-storage failures with current-workspace preservation.
- [ ] T052 Run fresh Reviewer and QA gates and record exact evidence. The
  fresh-context Reviewer gate ran at `df48301` and is recorded in
  `evidence.md`; its findings are resolved by T053, so the gate must be re-run
  from fresh context against the T053 commit before QA can sign off.
- [x] T053 Resolve the Reviewer findings recorded at `df48301`: clear and
  re-scope `projectNotice` across the Resume surface swap, surface project
  persistence failure instead of reporting success, stop rendering the shared
  recovery panel for notices without a recovery object, add the AC-005
  assurance to the panel's accessible description, remove raw `error.message`
  from the Portfolio save and publish paths, and record a decision on the
  persist-before-commit ordering.
- [ ] T054 Reclaim media records left in the browser store by a rejected import.
  D-009 keeps them deliberately, so this needs a reference-counted cleanup pass
  rather than a rollback delete.
