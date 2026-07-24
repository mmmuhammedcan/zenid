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
