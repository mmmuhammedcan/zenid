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

## Missing evidence

- Peak-memory/crash behavior and the resulting 75 MB limit decision on the
  minimum supported physical device. The Web Worker resolves the observed
  main-thread responsiveness problem but is not evidence of memory suitability.

## Acceptance status

- Implemented: Yes for the current atomic-import, bounded archive-extraction,
  worker-responsiveness, and named-environment performance-baseline contract.
- Automatically verified: Yes for AC-001 through AC-004 at `d67dd8c`.
- Manually accepted: Yes — 2026-07-24 creator acceptance recorded above.

Release readiness remains open until T046 supplies the physical-device evidence
needed to retain or lower the 75 MB limit.
