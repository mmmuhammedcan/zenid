# SPEC-001 Evidence

Status: Partial — browser atomicity verified; feature gate remains open
Last updated: 2026-07-24

## Evidence recorded

Implementation tested at commit `23bdbe3` on Linux with Node.js 22.15.1 and
Playwright 1.61.1 Chromium:

- `npm test` — 37 tests passed on 2026-07-24.
- `npm run lint` — passed on 2026-07-24.
- `npm run build` — passed on 2026-07-24.
- `npm run test:e2e` — 2 Chromium tests passed on 2026-07-24.
- `node scripts/zenid-roundtrip-check.mjs save` — created a 101,065-byte
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
- schema migration and unsupported-version behavior;
- visible valid import in Chromium;
- no project-data request body during import;
- IndexedDB transaction abort after an injected second-write failure;
- preservation of the prior media record and visible current project after
  persistence failure.

The production build reported an existing large-chunk warning. This does not
fail the build, but route-level code splitting remains a performance follow-up.

## Missing evidence

- Browser-level unsupported-future-schema message.
- Expanded archive and ZIP-bomb resistance before materialization.
- Import performance and main-thread blocking baseline.
- Dated manual creator acceptance.
- Independent reviewer sign-off.

## Acceptance status

- Implemented: Yes for the current atomic-import contract; resource hardening
  remains open.
- Automatically verified: No.
- Manually accepted: No.

This file must be updated with exact commands, environment, tested commit, and
results before either verification status changes.
