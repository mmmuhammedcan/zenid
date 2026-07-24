# SPEC-001 Evidence

Status: Partial — browser atomicity and archive resource containment verified;
feature gate remains open
Last updated: 2026-07-24

## Evidence recorded

Implementation tested through commit `c5e0201` on Linux with Node.js 22.15.1
and Playwright 1.61.1 Chromium:

- `npm test` — 9 test-file subtests passed on 2026-07-24.
- Focused `projectFile.test.js` run — 16 tests passed on 2026-07-24.
- `npm run lint` — passed on 2026-07-24.
- `npm run build` — passed on 2026-07-24.
- `npm run test:e2e` — 2 Chromium tests passed on 2026-07-24.
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
- Import performance and main-thread blocking baseline.
- Dated manual creator acceptance.
- Independent reviewer sign-off.

## Acceptance status

- Implemented: Yes for the current atomic-import and bounded archive-extraction
  contract.
- Automatically verified: No.
- Manually accepted: No.

This file must be updated with exact commands, environment, tested commit, and
results before either verification status changes.
