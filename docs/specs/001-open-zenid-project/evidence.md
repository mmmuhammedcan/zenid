# SPEC-001 Evidence

Status: Automatically verified; representative-device release gate open
Last updated: 2026-07-25

## Evidence recorded

Implementation tested through commit `d67dd8c` on Linux with Node.js 22.15.1
and Playwright 1.61.1 Chromium:

- `npm test` — 9 test-file subtests passed on 2026-07-25.
- `npm run lint` — passed on 2026-07-25.
- `npm run build` — passed on 2026-07-25 and emitted a separate 16.18 kB
  project-import worker bundle; the existing large-chunk warning remains.
- `npm run test:e2e` — 3 Chromium tests passed on 2026-07-25.
- `npm run benchmark:project-import` — passed on 2026-07-25; its detailed
  baseline is recorded below.
- `node scripts/zenid-roundtrip-check.mjs save` — created a 101,066-byte
  synthetic `.zenid` archive.
- `node scripts/zenid-roundtrip-check.mjs restore` — restored schema v1,
  synthetic profile sections, and a one-page PDF in a fresh process.

Automated cases currently cover:

- ZIP project round trip;
- legacy JSON compatibility;
- generated PDF and portfolio-media round trips;
- missing referenced media rejection;
- invalid referenced media rejection;
- unsafe archive path rejection;
- compressed-input, expanded-output, entry-count, and per-entry limits before
  extraction output allocation;
- forged stored-entry size metadata and duplicate archive-path rejection;
- schema migration and unsupported-version behavior;
- visible valid import in Chromium;
- visible newer-schema rejection with update guidance and preservation of the
  current workspace and media in Chromium;
- no project-data request body during import;
- IndexedDB transaction abort after an injected second-write failure;
- preservation of the prior media record and visible current project after
  persistence failure;
- browser archive parsing through a module Worker with transferable input;
- controlled Worker message-failure rejection and termination.

Worker-enabled T040 follow-up on Linux x64 (kernel 6.14.0-37-generic), Intel
Core i7-10875H (16 logical CPUs), Node.js 22.15.1, and headless Chromium
149.0.7827.55:

- Small fixture (1,901-byte archive; 7 samples): 2.8 ms p95 import and a
  10 ms maximum scheduler-delay proxy before the worker. With the worker the
  p95 was 22.2 ms and the proxy remained 10 ms; both approved budgets passed
  (200 ms import, 50 ms proxy).
- Typical fixture (1,575,957-byte archive; 1,572,864 bytes expanded media;
  5 samples): 6.8 ms p95 import and a 10 ms maximum scheduler-delay proxy
  before the worker. With the worker the p95 was 24.1 ms and the proxy remained
  10 ms; both approved budgets passed (500 ms import, 100 ms proxy).
- Near-limit fixture (300,179-byte archive; 75,488,256 bytes expanded media,
  96% of the 75 MiB limit; 1 sample): the pre-worker runs recorded
  251.6–288.3 ms import and a 250–280 ms scheduler-delay proxy. Commit
  `d67dd8c` recorded 280.6 ms total import with a 10 ms proxy. The near-limit
  scenario remains explicitly measurement-only, not a pass/fail gate.

The scheduler-delay proxy uses a 10 ms browser pulse and rounds upward to 10 ms
buckets. It indicates responsiveness but is not a precise blocking duration;
pulse boundaries can under- or over-represent a stall. Headless Chromium
delivered no overlapping Long Task entries, so Long Tasks are recorded as
unavailable for corroboration rather than evidence of no blocking. The
machine-readable report includes nullable browser device-memory information;
this run reported it as unavailable/nonstandard.

T041 records a scoped, version-pinned control map in
[`asvs-5.0.0-mapping.md`](asvs-5.0.0-mapping.md). It maps only evidenced or
partial `.zenid` local-import controls to OWASP ASVS 5.0.0 and explicitly marks
unrelated authentication, server transport, operational logging, dependency,
and deployment areas as not assessed. It is not an ASVS certification or a
product-wide compliance claim.

T043 used an independent, read-only Claude Sonnet review of the complete
SPEC-001 contract and its curated security, test, performance, and evidence
packet. The final structured report returned no concrete findings. The review
did not by itself close the then-recorded future-schema messaging or
representative-device Q-002 gaps, and does not establish product-wide security
assurance. The future-schema browser case was subsequently added at `e7e7c02`.

A fresh-context reviewer examined the Worker change and reported one Medium
missing `messageerror` cleanup path plus Low controlled-error and test gaps.
Commit `d67dd8c` adds idempotent termination, handles worker, message, and
synchronous post failures through a controlled compatibility error, and adds a
message-failure regression. The reviewer found no change to the security limits
or atomic commit boundary.

Creator acceptance recorded 2026-07-24 (browser name not recorded): a valid
downloaded ZenID project reopened successfully; a deliberately invalid project
left the visible current workspace unchanged; and the user found the messages
understandable. A PDF selected through the Open Project flow was rejected while
a `.zenid` resume/project file opened successfully, with no observed behavior
issue.

A read-only Claude Sonnet security review of T013–T014 reported one confirmed
Medium issue: duplicate ZIP names could be decompressed and silently overwrite
an earlier materialized entry. Commit `c5e0201` adds a real duplicate-entry
regression and rejects the second record before materialization. A Low
unsupported-compression observation was not accepted as a defect because
`parseArchiveBundle` already catches `fflate` extraction errors and maps them
to the controlled `INVALID_ARCHIVE` path. This was a targeted review of
T013–T014, not the feature-wide independent sign-off required by T043.

The production build reported an existing large-chunk warning. This does not
fail the build, but route-level code splitting remains a performance follow-up.

## Recovery guidance verified at `df48301`

Commit `df48301` adds BR-007, BR-008, AC-005, and AC-006 with a shared
`ProjectOpenNotice` panel and a `projectOpenRecovery` classifier. Verified on
2026-07-25 on Linux x64 (kernel 6.14.0-37-generic), Intel Core i7-10875H
(16 logical CPUs), Node.js 22.15.1, Playwright 1.61.1, headless Chromium
149.0.7827.55:

- `npm test` — 63 subtests across 10 test files passed. `projectOpenRecovery.test.js`
  is new and contributes "project-open errors map to stable user recovery
  categories" and "unknown browser failures suppress raw details and stay
  actionable".
- `npm run lint` — passed.
- `npm run build` — passed; the existing large-chunk warning remains.
- `npm run test:e2e` — 7 Chromium tests passed across spec001–spec003.
  `df48301` adds "guides recovery from a corrupt project and can open another
  local backup" and "shows the shared recovery panel in Portfolio when
  referenced media is missing".
- `npm run benchmark:project-import` — passed. Small fixture p95 29.4 ms against
  the 200 ms budget; typical fixture p95 37.2 ms against the 500 ms budget; both
  recorded a 10 ms maximum scheduler-delay proxy. The near-limit single sample
  measured 311.7 ms import with a 10 ms proxy and remains measurement-only.
- `node scripts/zenid-roundtrip-check.mjs save` — created a 101,067-byte
  synthetic `.zenid` archive.
- `node scripts/zenid-roundtrip-check.mjs restore` — restored schema v3 and a
  one-page synthetic PDF in a fresh process.

T051 browser coverage maps to Chromium cases as follows: corrupt to "guides
recovery from a corrupt project"; newer-schema to "rejects a newer project with
update guidance and keeps the current workspace"; missing-media to "shows the
shared recovery panel in Portfolio when referenced media is missing"; and
browser-storage to "rolls back media and keeps the current project when
IndexedDB persistence fails".

## Reviewer gate at `df48301` — open

A fresh-context read-only reviewer examined `df48301` against the SPEC-001
contract, D-005, and the AGENTS.md privacy rules on 2026-07-25. It confirmed
that all 25 import-reachable `ProjectCompatibilityError` codes are classified
exactly once, that the classifier never copies `message`, `stack`, or `name`
into user-facing output, that archive validation completes before any
persistence, and that Resume and Portfolio genuinely share the classifier and
panel on the open path. It reported the following unresolved findings:

- Medium — `ResumeApp.jsx` does not clear `projectNotice` across the
  TemplateSelector/BuilderView swap, and the focus effect runs on every mount,
  so an abandoned recovery panel re-steals focus during unrelated navigation.
- Medium — the imported project is persisted only by the autosave effect, whose
  failure is swallowed by `console.warn` after a success status has rendered. A
  blocked or full browser store therefore reports success and silently discards
  the import. `PortfolioApp.jsx` surfaces the same failure family through an
  unshared notice string, which is an AC-006 asymmetry.
- Medium — `ProjectOpenNotice` is also rendered for notices without a `recovery`
  object, producing a focus-stealing `role="alert"` banner with no action and no
  dismiss path.
- Low — the panel exposes no `aria-describedby` for the AC-005 assurance
  sentence, so its announcement is not guaranteed.
- Low — `PortfolioApp.jsx` still renders raw `error.message` on the save and
  publish paths, which BR-008 forbids on the surfaces AC-006 governs.
- Low — media persistence precedes project commit, so the "workspace was not
  changed" assurance currently depends on `commitProject` never throwing. No
  live trigger exists today; recorded as a latent ordering weakness.
- Low — the AC-005 verification mapping in `spec.md` overstated the committed
  browser evidence; corrected in this commit.

These findings are tracked as T053. T052 remains open because the gate has not
returned clean and no QA sign-off can be recorded against unresolved Medium
findings.

## T053 Reviewer findings resolved

Each `df48301` finding was closed as follows, with BR-009 and BR-010 added to the
spec so the new behavior is contractual rather than incidental:

- Resume clears `projectNotice` before any user-driven surface change (template
  chosen, template reopened, resume variant switched), and the shared panel now
  takes focus at most once per notice through a `WeakSet` of already-announced
  notices, so a remount cannot re-steal focus.
- Both surfaces import through `commitProjectToBrowser`, which writes the project
  to browser storage before the visible workspace changes. A blocked store now
  fails the import and reaches the shared classifier instead of rendering
  success. Resume also reports an unavailable store, using the same sentence
  Portfolio uses.
- An error notice without a `recovery` object renders as a dismissible
  `role="alert"` line that never takes focus.
- The panel exposes `aria-describedby` over its message, guidance, and assurance,
  and its element ids come from `useId` instead of one hardcoded id.
- The Portfolio save, publish, and media paths no longer print `error.message`.
  `noticeTextForError` shows only errors marked by `userFacingError`, so the
  authored publishing guidance survives while raw DOM exceptions fall back to a
  shared sentence.
- Persist-before-commit ordering is accepted as D-009. The residual unreferenced
  media a rejected import could leave was tracked as T054 and was eliminated by
  the transactional SPEC-006 architecture.

The two spec-local decisions previously numbered D-006 and D-007 collided with
the decision-log entry D-006. They are now recorded in `docs/decision-log.md` as
D-007 and D-008, and the spec references match.

Verified on 2026-07-25 on Linux x64 (kernel 6.14.0-37-generic), Intel Core
i7-10875H (16 logical CPUs), Node.js 22.15.1, Playwright 1.61.1, headless
Chromium 149.0.7827.55:

- `npm test` — 67 subtests across 10 test files passed, up from 63.
  `projectOpenRecovery.test.js` adds "notice text keeps authored guidance and
  replaces raw failure details" and "both surfaces describe an unavailable
  browser store with one shared sentence". `projectImport.test.js` adds "browser
  commit persists the project before the visible workspace changes" and "a
  failed browser commit rejects the import and never shows the project as
  opened".
- `npm run lint` — passed.
- `npm run build` — passed; the existing large-chunk warning remains.
- `npm run test:e2e` — 10 Chromium tests passed, up from 7. The new cases are
  "reports a blocked browser store instead of a false success", "clears an
  abandoned recovery panel when the user navigates the resume surfaces", and
  "warns about an unavailable browser store without stealing focus". All three
  were confirmed to fail against the pre-fix `src/` tree before the change was
  applied.
- `npm run benchmark:project-import` — passed. Small fixture p95 25.8 ms against
  the 200 ms budget; typical fixture p95 32.3 ms against the 500 ms budget; both
  recorded a 10 ms maximum scheduler-delay proxy. The near-limit single sample
  measured 278.2 ms import with a 10 ms proxy and remains measurement-only.
- `node scripts/zenid-roundtrip-check.mjs save` — created a 101,067-byte
  synthetic `.zenid` archive.
- `node scripts/zenid-roundtrip-check.mjs restore` — restored schema v3 and a
  one-page synthetic PDF in a fresh process.

## T052 fresh-context Reviewer gate — closed

A second fresh-context Reviewer independently examined the T053 commit
(`b81131b`/`0c9ff2f`) on 2026-07-25, without access to this session's reasoning.
It did not trust `evidence.md`'s prose: it read the full current state of every
touched file, re-derived each of the seven `df48301` findings from the code
directly, and reproduced the verification suite itself (`npm test`,
`npm run lint`, `npm run build`, `npm run test:e2e`) against an exported copy of
the tree. It also independently rebuilt a pre-fix tree (`df48301` `src/` plus the
new `e2e/` cases) and confirmed by direct execution — not inference — that the
three new browser cases fail without the fix.

All seven `df48301` findings were confirmed resolved:

- `projectNotice` clearing and single-focus-per-notice both hold across every
  call site, including the "Templates" back button that the original fix
  summary did not explicitly enumerate.
- `commitProjectToBrowser` genuinely persists before applying and genuinely
  rejects the import on a persistence failure, traced through the full
  exception path on both surfaces.
- The no-`recovery` alert branch cannot steal focus and is always reachable
  with a working dismiss control.
- `aria-describedby` resolves to real, stable, `useId`-scoped ids.
- Every catch block in `PortfolioApp.jsx` and `assetStore.js` was checked, not
  only the ones the commit summary named; no raw error text reaches the UI on
  any path, and `classifyProjectOpenError` never touches `error.message`.
- D-009 matches the code, and the reviewer additionally verified the
  IndexedDB-rollback e2e case relies on native transaction atomicity rather
  than application-level rollback logic — a mechanism distinct from, and
  narrower than, the ordering gap D-009 accepts.
- No dangling `D-006`/`D-007` references remain anywhere under `docs/`.

No new correctness, race-condition, or privacy regression was found. The gate
returned two new Low findings, both resolved as T055 below.

## T055 — two Low findings from the T052 gate, resolved

1. `saveProjectToBrowserStorage` (`projectSchema.js`) returned silently when no
   `localStorage` was available, instead of throwing. Because `commitProjectToBrowser`
   depends on `persistProject` throwing to reject a failed import, a browser
   context where `localStorage` evaluates to a falsy value rather than throwing on
   access would let the import report success while persisting nothing — the exact
   "false success" failure T053 fixed, through a different unavailability mode.
   `assetStore.js`'s `openDatabase()` already rejects explicitly when `indexedDB` is
   undefined; `saveProjectToBrowserStorage` now matches that pattern and throws.
2. The AC-005 mapping in `spec.md` claimed the browser-storage e2e case asserts the
   literal workspace-preservation sentence; it actually verifies preservation
   behaviorally (unchanged full name, absent rejected asset). Corrected in
   `spec.md` to state this precisely.

Verified on 2026-07-25 on the same environment as above:

- `npm test` — 69 subtests passed, up from 67. `projectSchema.test.js` adds
  "saving to browser storage throws instead of silently discarding the project
  when no store exists"; `projectImport.test.js` adds "a project store that is
  absent rather than throwing still rejects the import". Both were confirmed to
  fail against the pre-fix code before the change was applied.
- `npm run lint` — passed.
- `npm run build` — passed; the existing large-chunk warning remains.
- `npm run test:e2e` — 10/10 Chromium tests passed, unaffected by this change.

T052 is closed. T053, T052, T054, and T055 are resolved; T046 remains the open
physical-device item for this spec.

## T056/T057 — collision-safe media import and independent review

Implemented on 2026-07-26 on top of `f41c820`:

- Existing media is reused only when its identifier, kind, name, MIME type, and
  bytes match the imported record.
- A conflicting stable identifier is classified as damaged/incomplete before
  any imported media is written.
- New records use IndexedDB `add`, so a concurrent identifier creation cannot
  be overwritten.
- The browser cases verify both byte-identical project reopening and preservation
  of the current stored bytes when conflicting content is rejected.
- The AC-004 browser instrumentation now examines every request's method,
  origin, and URL instead of checking only requests with bodies.

The collision browser case was added before the implementation and failed
against the unconditional-`put` path. After implementation, the complete
working-tree verification passed:

- `npm test` — 11/11 test-file subtests passed.
- `npm run lint` — passed.
- `npm run build` — passed; the existing large-chunk warning remains.
- `npm run test:e2e` — 12/12 Chromium tests passed.
- `npm run benchmark:project-import` — passed; small p95 19.8 ms, typical p95
  24.5 ms, near-limit measurement 288.9 ms, and maximum scheduler-delay proxy
  10 ms.
- `node scripts/zenid-roundtrip-check.mjs save` and `restore` — passed; schema
  v3 and a one-page synthetic PDF were restored in a fresh process.
- `git diff --check` — passed.

The implementation was committed and the complete gate was rerun at immutable
commit `3e73b4b3e3af2a4abca3ac8581f8fb6de1138870`; exact commit-scoped results are
recorded in SPEC-006 evidence.

An independent fresh-context Reviewer completed T057 on 2026-07-26. The review
found no functional, security, or privacy blocker. It independently reran 12/12
unit test files and 10/10 targeted browser cases, including identical reuse,
identifier collision with current-byte preservation, blocked-store
preservation, atomic add/replace rollback, and version-one media upgrade.
Atomic and upgrade coverage passed in Chromium, Firefox, and WebKit. The
Reviewer confirmed that the later Blob-to-`Uint8Array` storage change retains
legacy Blob reads and does not weaken T056.

The formal review closure and evidence correction were committed at
`2ad6dac65a92cb3a6f491a17fb0dbdd0f14aa906`. That commit passed 70/70 unit
tests, lint, and the strengthened ZenPDF privacy regression in Chromium,
Firefox, and WebKit.

## Missing evidence

- Peak-memory/crash behavior and the resulting 75 MB limit decision on the
  minimum supported physical device. The Web Worker resolves the observed
  main-thread responsiveness problem but is not evidence of memory suitability.
- T046 physical-device validation remains deferred under D-013 and must not be
  described as completed physical-device evidence.

## Acceptance status

- Implemented: Yes for the current atomic-import, bounded archive-extraction,
  worker-responsiveness, and named-environment performance-baseline contract.
- Automatically verified: Yes for AC-001 through AC-004 at `d67dd8c`.
- Manually accepted: Yes — 2026-07-24 creator acceptance recorded above.

T046 is not a present release blocker under creator decision D-013. The 75 MB
limit remains automatically benchmarked but is not claimed as physically
validated.
