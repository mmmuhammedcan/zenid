# SPEC-006 — Transactional Local Workspace Storage

Status: Implemented and automatically verified
Owner: Creator
Last clarified: 2026-07-26

## Problem and user

ZenID currently stores canonical project JSON in `localStorage` and media in
IndexedDB. Those stores cannot share a transaction. A media write can therefore
succeed before the project write fails, producing an orphan record and forcing
application-level recovery logic. ZenPDF visual signatures and initials are
also personal image data stored as `localStorage` strings.

A privacy-first local workspace needs one browser database boundary for
canonical user data, with native transaction rollback and lossless migration
for existing users.

## Scope

In scope:

- canonical project JSON, portfolio media, uploaded résumé PDFs, ZenPDF visual
  signatures, and initials in one versioned IndexedDB database;
- atomic `.zenid` project-and-media import;
- atomic portfolio media add, replace, and remove operations;
- one-time migration from the current and legacy `localStorage` keys;
- asynchronous application hydration with an explicit loading/failure state;
- preservation of the portable `.zenid` format and schema migrations.

Out of scope: cloud synchronization, server persistence, cross-device state,
provider deployment, collaborative editing, and certificate-backed signatures.

## Business rules

- BR-001: IndexedDB is the canonical persistence boundary for private ZenID
  user data. `localStorage` is not a canonical project or image store.
- BR-002: Project JSON and imported media commit in one native IndexedDB
  transaction. Any request or transaction failure rolls back both.
- BR-003: Adding, replacing, or removing portfolio media commits the updated
  project reference and affected media records in one native transaction.
- BR-004: Existing IndexedDB media stays in place during the database-version
  upgrade.
- BR-005: Existing `zenid.project`,
  `zenid.resume-builder.draft.v1`, `pdfEditorSignature`, and
  `pdfEditorInitials` values migrate locally. Legacy keys are removed only
  after their IndexedDB writes complete successfully.
- BR-006: A failed migration leaves the legacy values available for retry and
  never silently starts an empty canonical workspace over recoverable data.
- BR-007: Application UI does not render an editable empty project before
  asynchronous hydration resolves.
- BR-008: Storage operations make no network request.
- BR-009: At most one same-origin ZenID tab may hold writable workspace
  ownership. Other tabs must not hydrate or mutate private workspace data until
  they acquire the exclusive browser lock.
- BR-010: A waiting tab automatically continues after the owning tab closes.
  Lack of Web Locks support fails closed with actionable browser guidance.

## Acceptance criteria

- AC-001: Given no existing data, first hydration creates and returns one valid
  schema-v3 workspace record in IndexedDB.
- AC-002: Given a current or legacy project in `localStorage`, hydration
  migrates it without losing Unicode content or presentation, commits it to
  IndexedDB, and only then removes the migrated project keys.
- AC-003: Given an imported bundle whose workspace-store request fails, neither
  the incoming project nor any incoming media remains stored and the visible
  workspace is unchanged.
- AC-004: Given a portfolio media add, replacement, or removal, the project
  reference and asset mutation either both commit or both roll back.
- AC-005: Given legacy ZenPDF signature/initial strings, ZenPDF migrates and
  reuses them from IndexedDB and removes the legacy keys only after persistence.
- AC-006: Given an existing version-1 media database, upgrading to version 2
  preserves every media record.
- AC-007: Resume and Portfolio share one hydrated in-memory project for the
  lifetime of the React application and persist edits through the IndexedDB
  repository.
- AC-008: No migration, autosave, import, or private-data operation sends user
  data over the network.
- AC-009: Given two ZenID tabs, the first renders the editable application and
  the second renders a non-editable waiting state. Closing the first transfers
  ownership and the second then hydrates the existing workspace.

## Verification mapping

- Repository and migration decisions: pure Node tests plus Playwright browser
  storage inspection.
- Native rollback, upgrade preservation, and media lifecycle: Playwright with
  injected IndexedDB request failures.
- Shared Resume/Portfolio hydration: route-transition Playwright case.
- Single-writer ownership: two-page Playwright case plus an injected
  unsupported-Web-Locks browser case.
- Network boundary: browser request observation during migration and import.
- Full regression: unit tests, lint, production build, Chromium E2E, import
  benchmark, and `.zenid` save/restore.

## Resolved questions

- Q-001: D-012 selects single-writer ownership. Multi-tab concurrent editing is
  not a ZenID feature.
