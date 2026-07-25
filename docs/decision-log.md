# ZenID Decision Log

Decisions are append-only. Superseded decisions stay here and point to their
replacement so historical context remains explainable.

## D-001 — ZenID workspace is the primary product

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Creator
- Context: The repository contained two conflicting visions: a general PDF SaaS
  and a local professional identity workspace.
- Decision: The local professional identity workspace is authoritative. Resume,
  portfolio, and the private `.zenid` project form the primary journey. ZenPDF
  is a supporting fill-and-sign tool.
- Consequence: The Python OCR/backend and vanilla pages are legacy experiments.
  New work there requires a separate product decision.

## D-002 — Real creator data is valid manual acceptance material

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Creator
- Context: Synthetic fixtures prove repeatability but cannot replace the
  creator's visual review of a real CV and portfolio.
- Decision: Real creator data is kept under ignored `creator_docs/`. Tracked
  automated tests and shared scripts use synthetic identities.
- Consequence: Personal acceptance remains possible without publishing personal
  data in repository history.

## D-003 — Completion status must name its evidence level

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Creator
- Decision: Roadmap items use Implemented, Automatically verified, and Manually
  accepted as separate states.
- Consequence: A passing build or existing code is not by itself product
  acceptance.

## D-004 — Saved ZenPDF pages must finish restoring before use

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Engineering
- Context: Fabric `loadFromJSON` is asynchronous. Page navigation previously
  reported readiness before the saved annotations had finished loading.
- Decision: Page rendering awaits annotation restoration. Concurrent page
  transitions and export are guarded as document-busy operations.
- Consequence: Users cannot export or start another page transition against a
  partially restored canvas.

## D-005 — ZenID project imports are atomic

- Date: 2026-07-24
- Status: Accepted
- Decision owner: Creator
- Context: A structurally valid `.zenid` archive may still reference a missing,
  invalid, or unsupported media asset.
- Decision: Reject the entire import when any referenced project file or media
  asset is missing or invalid. Keep the current browser workspace unchanged.
- Consequence: Partial recovery is not part of the initial compatibility
  contract. A documented recovery mode may be considered later if real user
  evidence demonstrates the need.

## D-006 — AI compatibility belongs to the user-owned project boundary

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Creator
- Context: Users may want Claude, Codex, or another AI they already use to
  prepare a targeted resume without ZenID hosting inference, storing project
  data, receiving API keys, or requiring accounts.
- Decision: A future plugin may teach the user's AI how to read, safely edit,
  and return a valid `.zenid` project. ZenID itself does not connect to or host
  the model.
- Consequence: Core AI compatibility remains local and optional. Job discovery,
  listing trust, matching, and application automation require a separate
  opt-in ZenID Jobs product decision.

## D-007 — A released reader supports its schema plus the previous three

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Creator
- Context: Recorded for SPEC-001 as a feature-local decision that reused a
  decision-log number already taken by D-006.
- Decision: A released ZenID reader supports its current schema plus the
  previous three schema versions for at least 18 months after each schema's
  release. A schema leaves support only after both conditions are true. Older
  readers reject newer schemas without partial recovery and direct the user to
  update.
- Consequence: Compatibility is bounded and testable. Newer projects fail
  closed with update guidance instead of degrading silently.

## D-008 — Archive extraction and validation run in a Web Worker

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Engineering
- Context: Recorded for SPEC-001 as a feature-local decision that reused a
  decision-log number already taken by D-007 in that spec.
- Decision: ZIP extraction and project validation run in a Web Worker. The
  named-machine baseline showed a 250–280 ms near-limit scheduler delay on the
  main thread; the worker reduced the same proxy to 10 ms while preserving every
  archive limit and the prepare-then-commit boundary.
- Consequence: The responsiveness question is resolved. The 75 MB
  pre-materialization memory budget is a separate open question (Q-002).

## D-009 — Media persists before the project is committed

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Engineering
- Context: A ZenID import writes media to IndexedDB, then commits the project to
  `localStorage`, then makes it the visible workspace. A failure at the commit
  step therefore leaves media records that the committed project never
  references.
- Decision: Keep this order and treat a failed commit as a rejected import.
  Persistence runs before the visible workspace changes, so a commit failure
  leaves both `localStorage` and the on-screen workspace untouched and the
  recovery panel's assurance stays true. Do not delete the already-written media
  on failure: identifiers are stable, so a re-import of a project over itself
  would target records the current workspace still references, and a rollback
  would be destructive.
- Consequence: A rejected import can leave unreferenced media records in the
  browser store. They are inert, never surfaced, and never included in an
  export. Reclaiming them needs a separate reference-counted cleanup pass, which
  is out of scope for SPEC-001.
