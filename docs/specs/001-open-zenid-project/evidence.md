# SPEC-001 Evidence

Status: Partial — browser atomicity and archive resource containment verified;
feature gate remains open
Last updated: 2026-07-24

## Evidence recorded

Implementation tested through commit `42cd828` on Linux with Node.js 22.15.1
and Playwright 1.61.1 Chromium:

- `npm test` — 9 test-file subtests passed on 2026-07-24.
- Focused `projectFile.test.js` run — 16 tests passed on 2026-07-24.
- `npm run lint` — passed on 2026-07-24.
- `npm run build` — passed on 2026-07-24.
- `npm run test:e2e` — 2 Chromium tests passed on 2026-07-24.
- `npm run benchmark:project-import` — passed on 2026-07-24; its detailed
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
- no project-data request body during import;
- IndexedDB transaction abort after an injected second-write failure;
- preservation of the prior media record and visible current project after
  persistence failure.

T040 baseline on Linux x64 (kernel 6.14.0-37-generic), Intel Core i7-10875H
(16 logical CPUs), Node.js 22.15.1, and headless Chromium 149.0.7827.55:

- Small fixture (1,901-byte archive; 7 samples): 2.8 ms p95 import and a
  10 ms maximum scheduler-delay proxy; both approved budgets passed
  (200 ms import, 50 ms proxy).
- Typical fixture (1,575,957-byte archive; 1,572,864 bytes expanded media;
  5 samples): 6.8 ms p95 import and a 10 ms maximum scheduler-delay proxy;
  both approved budgets passed (500 ms import, 100 ms proxy).
- Near-limit fixture (300,179-byte archive; 75,488,256 bytes expanded media,
  96% of the 75 MiB limit; 1 sample): 288.3 ms import and a 280 ms
  scheduler-delay proxy. This is explicitly measurement-only, not a pass/fail
  gate.

The scheduler-delay proxy uses a 10 ms browser pulse and rounds upward to 10 ms
buckets. It indicates responsiveness but is not a precise blocking duration;
pulse boundaries can under- or over-represent a stall. Headless Chromium
delivered no overlapping Long Task entries, so Long Tasks are recorded as
unavailable for corroboration rather than evidence of no blocking. The
machine-readable report includes nullable browser device-memory information;
this run reported it as unavailable/nonstandard.

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

## Missing evidence

- Browser-level unsupported-future-schema message.
- Near-limit responsiveness on representative supported devices and the
  resulting Web Worker decision for Q-002.
- Dated manual creator acceptance.
- Independent reviewer sign-off.

## Acceptance status

- Implemented: Yes for the current atomic-import, bounded archive-extraction,
  and named-environment performance-baseline contract.
- Automatically verified: No.
- Manually accepted: No.

This file must be updated with exact commands, environment, tested commit, and
results before either verification status changes.
