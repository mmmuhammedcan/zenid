# SPEC-003 Tasks

Status: In progress
Last updated: 2026-07-25

## Contract and compatibility

- [x] Decide the first selection scope: Experience and Projects.
- [x] Define missing-key, empty-list, ordering, duplication, and new-item
  behavior.
- [x] Add schema v2 and a sequential v1-to-v2 migration.
- [x] Add migration and `.zenid` round-trip fixtures.

## Behavior

- [x] Separate complete editor data from selection-filtered output data.
- [x] Add pure per-variant selection helpers.
- [x] Add one **Included in this resume** control for Experience and Projects.
- [x] Keep design preview, ATS PDF, saved generated PDFs, and portfolio résumé
  output consistent.

## Evidence

- [x] Add failing unit and browser tests before implementation.
- [x] Run a fresh-context Reviewer audit.
- [x] Run the required QA matrix and record exact commit evidence.

## Deferred

- Selection controls for other repeatable sections.
- A non-ATS PDF matching the Modern design preview.

## Targeted wording slice

- [x] Resolve Q-002 with stable-ID field-level replacements.
- [x] Limit the first allowlist to Experience and Project descriptions.
- [x] Add schema v3 and the sequential v2-to-v3 migration.
- [x] Add override normalization, apply/reset, materialization, deletion, and
  round-trip tests before implementation.
- [x] Add a separate **Targeted wording** control with shared text always
  visible.
- [x] Verify preview, direct PDF, archived PDF, generated portfolio résumé, and
  canonical portfolio-page parity.
- [x] Run a fresh-context Reviewer gate.
- [x] Run the full QA matrix and record exact evidence.

Deferred from targeted wording: summary/title, factual-field overrides,
structured bullet IDs, automatic factuality checks, diff/rebase, and AI rewrite.
