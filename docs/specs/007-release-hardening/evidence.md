# SPEC-007 Evidence

Status: Automatically verified at implementation commit
Date: 2026-07-26
Tested implementation commit:
`98cc92c0a9606e59472016a0f008a087919839da`

## Acceptance mapping

- AC-001: Playwright release projects exercise the critical routes,
  transactional IndexedDB workspace, single-writer ownership, legacy migration,
  and ZenPDF export in Chromium 149, Firefox 151, and WebKit 26.5.
- AC-002: `@axe-core/playwright` reports no serious or critical WCAG 2.2 A/AA
  violations on `/`, `/resume`, `/portfolio`, or `/editor` in desktop
  Chromium. The gate found and drove fixes for Resume and Portfolio contrast.
- AC-003: a Pixel 7 Chromium project verifies every core route renders and the
  document width does not exceed its mobile viewport.
- AC-004: a synthetic two-page PDF loads without upload, navigates both
  directions, exports locally, and reopens as a readable two-page PDF in all
  three desktop engines.
- AC-005: `npm run build` validates root asset references and a matching
  `404.html`; `npm run build:subpath` repeats the checks for `/zenid/`.
- AC-006: D-015 records the remaining React Router RSC advisory. Its server
  action path is absent from ZenID's static client architecture; npm audit is
  explicitly not reported as clean.

## Commit-scoped verification

From `frontend/pdf-editor`:

- `npm test` — passed, 12/12 test files including supported-accent contrast.
- `npm run lint` — passed.
- `npm run build` — passed root asset and SPA-fallback validation.
- `npm run build:subpath` — passed `/zenid/` asset and SPA-fallback validation.
- `npm run test:e2e` — 54 passed, 6 intentionally project-scoped skips, 0
  failures across 60 scheduled cases.
- `npm run benchmark:project-import` — passed: small p95 20.2 ms, typical p95
  25.7 ms, near-limit measurement 267.3 ms, scheduler-delay proxy max 10 ms.
- `.zenid` save/restore scripts — passed in fresh processes with schema 3,
  Unicode synthetic identity, all profile collections, and one restored PDF
  page.
- `git diff --check` — passed.

## Findings resolved

- Default amber primary controls and muted Portfolio guidance did not meet the
  automated WCAG contrast threshold; colors were corrected.
- Dynamic Portfolio accent badges could choose an inaccessible fixed white
  foreground; they now choose the higher-contrast dark or light foreground,
  with all supported accents unit-tested at 4.5:1 or better.
- WebKit rejected Blob/File values during IndexedDB persistence. D-014 changes
  new canonical media records to structured-clone byte arrays while retaining
  reads of legacy Blob records.
- The application build had root-only public asset URLs and no deep-link
  fallback. The Vite base, router basename, asset references, and `404.html`
  artifact are now validated for root and subpath output.

## Remaining manual/external gates

- D-016 limits the initial dated manual-acceptance matrix to Windows and
  Android. The executable checklist is in `manual-acceptance.md`; macOS, iOS,
  and iPadOS remain unaccepted rather than inferred from WebKit automation.
- Q-001 still requires the creator to choose the production provider and
  domain before an external deploy.

## Independent fresh-context review

An independent Reviewer completed T008 on 2026-07-26 and found no
release-blocking correctness, security, or privacy issue. The Reviewer reran
12/12 unit test files, lint, both production builds, and the browser matrix in
the CI-style single-worker configuration: 54 passed, 6 intentionally scoped
skips, and 0 failures.

The review confirmed D-014's byte storage and legacy Blob compatibility and
D-015's absence of RSC, data-router actions, SSR, or backend execution paths.
Two Low documentation/test-hardening observations were resolved: README now
describes the deploy checker as validating entry-point asset paths, and the
ZenPDF privacy regression uses a document-specific sentinel to reject document
content in same-origin request URLs as well as cross-origin or non-GET
requests.

Those review resolutions were committed at
`2ad6dac65a92cb3a6f491a17fb0dbdd0f14aa906`. Commit-scoped follow-up
verification passed 70/70 unit tests, lint, and 3/3 targeted ZenPDF cases in
Chromium, Firefox, and WebKit.
