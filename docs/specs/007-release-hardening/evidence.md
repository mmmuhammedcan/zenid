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
- AC-007: follow-up commit
  `ac912238508c96457bfd5535bbbff3e94ed3a727` fits a newly opened ZenPDF page
  inside the Pixel 7 viewport while retaining the 100% initial desktop scale.
  The same regression places text, navigates both pages, and exports locally.

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
- D-018 resolves Q-001 for initial acceptance with an owner-only generated
  address. A custom domain and public access remain deferred.

## Initial production deployment

- Provider: ChatGPT Sites
- Access: temporarily public under D-019
- Source commit: `2b04ddf0aa8782365d5afed8afb56d5a067628cc`
- Saved version: 5
- Deployment status: succeeded on 2026-07-26
- URL: `https://zenid-local-workspace.cosmican.chatgpt.site`

The provider build accepted `dist/client/`, `dist/server/index.js`, and the
hosting metadata produced by the repository-root adapter. The Worker behavior
is unit-tested and constrained by D-017 to static application files and SPA
fallback only.

## Owner-only production smoke acceptance

The creator manually accepted the owner-only production deployment on
2026-07-26 from Ubuntu. The browser name/version was not captured and is not
inferred. The creator reported successful:

- navigation across the application surfaces;
- local `.zenid` project opening;
- editing settings and project data;
- PDF opening and export;
- ZenPDF fill behavior.

This closes T010 for the initial owner-only deployment. It does not close D-016
Windows/Android accessibility acceptance, public-access acceptance, or the
deferred Apple-platform matrix.

## Supplemental Ubuntu Orca smoke

On 2026-07-26 the creator exercised the application on Ubuntu with Orca 46.1
and reported that Orca operated and the exercised behavior appeared correct.
The browser and version were not captured and are not inferred. Orca announced
the interface in English, which matches the current English interface and page
language. The creator stopped Orca after finding its default verbosity
unnecessary for further personal testing.

This is useful supplemental accessibility evidence only. It does not satisfy
the D-016 Windows NVDA or Android TalkBack acceptance matrix and does not close
T009.

## Windows Chrome, Firefox, and NVDA acceptance

On 2026-07-26 the creator used a family member's Windows computer and the
temporary NVDA copy started by the official downloaded launcher. The creator
reported that the required Windows behavior passed in Chrome and Firefox and
that NVDA read the site's content and controls correctly in Chrome. No
application failure was observed. Windows, Chrome, Firefox, and NVDA versions
were not captured and are not inferred.

Chrome's built-in page translation displayed the live interface in Turkish,
but the downloaded resume retained English default section labels. This is
expected for the current English release: browser translation changes the
rendered interface and does not select a resume output locale. Native Turkish
UI and resume defaults remain deferred under the Language and Locale Direction
in `plan.md`.

The creator accepted the Windows functional matrix. Exact environment versions
remain uncaptured metadata. Android Chrome and TalkBack acceptance remains open
under T009.

## Public route smoke

After the creator authorized temporary public access, anonymous HTTP checks
passed for the application shell. The hosting asset layer canonicalizes the
three application paths with a trailing slash; version 5 preserves each route
and returns HTML with status 200:

- `/resume` -> `/resume/` -> 200
- `/portfolio` -> `/portfolio/` -> 200
- `/editor` -> `/editor/` -> 200

The earlier provider behavior redirected unknown paths to `/`. The tested
static build adapter now emits a route shell for every known application route
instead of depending on a request that the provider handles before the Worker.
Manual anonymous-browser acceptance remains part of D-016.

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

## T012 mobile ZenPDF containment

Physical Android acceptance identified that ZenPDF remained functional but was
needlessly difficult to navigate because the desktop-size PDF canvas began
outside the phone viewport. The pre-implementation Pixel 7 regression measured
the rendered canvas at `x = -240px` and failed.

D-020 keeps ZenPDF desktop-first while requiring a bounded mobile baseline.
Implementation commit `ac912238508c96457bfd5535bbbff3e94ed3a727`:

- retains the 100% initial scale at the desktop release viewport;
- calculates an initial narrow-viewport fit without changing PDF/Fabric
  document coordinates;
- gives the scaled page a matching layout box, removing invisible transformed
  overflow;
- keeps later user zoom and page navigation behavior unchanged.

Commit-scoped verification:

- `npm test` — 13/13 test files passed, including four responsive-zoom cases.
- `npm run lint` — passed.
- `npm run build` — passed the production build, root asset, and SPA fallback
  checks.
- `npm run test:e2e -- --workers=1` — 55 passed, 6 intentionally scoped skips,
  0 failures across 61 scheduled cases.
- Targeted desktop Chromium and Pixel 7 ZenPDF follow-up — 2/2 passed after
  strengthening both paths to place text before navigation and local export.
- `git diff --check` — passed.

An independent fresh-context Reviewer found no blocker and passed the T012
gate. The Reviewer confirmed that the scaled layout box removes ghost width,
Fabric continues to derive pointer and toolbar coordinates from rendered
bounds, no focus or accessible-name behavior changed, and the normal desktop
initial zoom remains 100%. The initial review's Low test-hardening note was
resolved by asserting the exact 42% Pixel 7 scale and text placement in both
mobile and desktop paths.

This automated result does not claim desktop-equivalent precision authoring on
touchscreens. Physical Android TalkBack acceptance under T009 remains open.
