# SPEC-006 Evidence

Status: Working-tree verification complete; immutable commit evidence pending
Date: 2026-07-26

## Acceptance evidence

- AC-001/AC-002: existing SPEC-001 browser fixtures migrate current and legacy
  project state; the Portfolio recovery case additionally verifies the
  `zenid.project` key is removed after the IndexedDB workspace commit. A
  SPEC-006 injected migration failure verifies the legacy value remains and no
  canonical workspace is falsely created.
- AC-003: `spec001-open-project.spec.js` injects both media-store and
  workspace-store failures. The visible project stays unchanged and incoming
  assets are absent after transaction rollback.
- AC-004: `spec006-indexeddb-workspace.spec.js` commits a media add, injects a
  workspace request failure during replacement and verifies both stores roll
  back, then commits removal of both the reference and asset.
- AC-005: the SPEC-006 ZenPDF case migrates synthetic signature and initials
  strings, reads them from `private-data`, and verifies both legacy keys are
  absent.
- AC-006: the SPEC-006 upgrade case seeds a version-1 `assets` store, opens the
  application at database version 2, and verifies the asset plus all three
  stores.
- AC-007: the SPEC-006 route case edits Resume, navigates through the React
  router to Portfolio, and verifies the same value in the UI and canonical
  workspace record.
- AC-008: project import tests inspect every request after selection. The
  ZenPDF migration case observes the complete page request set and permits only
  GET requests to the local test origin; synthetic private markers never enter
  a URL.
- AC-009: the two-page SPEC-006 case verifies that the first tab renders Resume,
  the second renders only a waiting alert, and closing the first automatically
  transfers ownership and hydrates Portfolio. A separate case removes Web Locks
  support and verifies that ZenID fails closed without rendering an editor.

## Working-tree verification

From `frontend/pdf-editor`:

- `npm test` — passed, 11/11 test files.
- `npm run lint` — passed with no diagnostics.
- `npm run build` — passed after the final review change. Existing chunk-size
  warning remains: application entry about 1,487 kB minified / 455 kB gzip and
  PDF worker about 2,210 kB.
- `npm run test:e2e` — final full run passed 19/19 Chromium cases.
- `npm run benchmark:project-import` — passed: small p95 19.7 ms, typical p95
  23.4 ms, near-limit measurement 262.3 ms, maximum scheduler-delay proxy
  10 ms.
- `node scripts/zenid-roundtrip-check.mjs save` and `restore` — passed in fresh
  processes; schema 3, synthetic Unicode identity, every profile collection,
  one résumé, and one restored PDF page survived.
- `git diff --check` — passed.

This is repeatable working-tree evidence, not acceptance for an immutable
commit. T009 stays open until the final full suite, import benchmark, `.zenid`
round trip, and fresh review are recorded against the resulting commit.

## Reviewer pass

The post-implementation review checked:

- version-1 store preservation during upgrade;
- commit-before-cleanup migration ordering and cleanup retry;
- native rollback for bundle import and portfolio media changes;
- absence of canonical `localStorage` write paths;
- collision-safe reuse of existing media identifiers;
- explicit hydration failure instead of an editable empty fallback;
- exclusive ownership before hydration, queued automatic transfer on owner
  close, and fail-closed behavior without Web Locks.

No blocking defect remains in this pass. D-012 resolves SPEC-006 Q-001 by
preventing multi-tab concurrent editing rather than attempting synchronization.
