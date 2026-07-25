# SPEC-001 Implementation Plan

Status: Automatically verified; representative-device release gate open
Updated: 2026-07-25

## Technical context

The active product is the browser-only React application under
`frontend/pdf-editor`. Project metadata is stored in localStorage, larger media
is stored in IndexedDB, and portable `.zenid` projects are ZIP archives parsed
with `fflate`.

No backend endpoint participates in opening a project.

## Implementation strategy

Opening a project has two explicit stages:

1. Prepare: read bytes locally, enforce compressed and expanded resource
   limits, validate archive paths and content, parse every referenced JSON
   document, validate schema compatibility, and verify every referenced media
   asset.
2. Commit: persist all imported media in one IndexedDB transaction, then replace
   the in-memory project only after that transaction completes successfully.

Preparation must not mutate localStorage, IndexedDB, React state, or the source
file. A preparation or media-transaction failure must leave the current
workspace unchanged.

## Security and privacy controls

- Reject absolute paths, parent traversal, backslashes, null bytes, unknown
  archive content, duplicate archive paths and asset IDs, invalid signatures,
  unsupported media types, and unsupported future schemas.
- Enforce compressed-file, expanded-data, and per-asset limits.
- Do not recover partially in the initial contract.
- Verify with browser network observation that project bytes and profile/media
  data are not transmitted.
- Use a scoped OWASP ASVS 5.0.0 control mapping in the final evidence rather
  than claiming general ASVS compliance.

## Test strategy

- Node tests: deterministic schema, archive, signature, path, and limit cases.
- IndexedDB integration: prove a failed media transaction rolls back and does
  not invoke the project-state commit.
- Playwright Chromium: test user-visible success/failure behavior with isolated
  browser storage and network request observation.
- Manual acceptance: open a sanitized creator fixture and record the browser,
  date, result, and observed recovery behavior.

Playwright tests will use user-facing locators, web-first assertions, isolated
state, and trace-on-first-retry in CI.

## Performance strategy

Measure import duration and main-thread blocking for small, typical, and
near-limit synthetic fixtures before deciding whether ZIP parsing belongs in a
Web Worker.

Archive extraction now applies entry-count, per-entry, and cumulative expanded
limits through `fflate`'s central-directory filter before each entry's output
buffer is allocated. T040 established a 250–280 ms near-limit scheduler-delay
proxy on the named i7 environment, which was sufficient evidence to move ZIP
extraction and validation to a Web Worker. Commit `d67dd8c` reduced that proxy
to 10 ms while retaining the same limits and atomic commit boundary.

The worker is a responsiveness boundary, not a replacement for archive limits
or physical-device memory evidence. Before release, T046 must validate the
75 MB budget on the minimum supported physical device. If that measurement
shows memory pressure, crashes, or unacceptable import behavior, lower the
expanded-data limit rather than describing the worker as a memory control.

## Schema lifecycle policy

Each released reader supports its current schema plus the previous three schema
versions for at least 18 months after each schema release. A version is retired
only when it is both outside that four-version window and older than 18 months.
An older reader never partially recovers a newer schema; it rejects it and
directs the user to update.

## Delivery gates

Automatically Verified requires:

- every acceptance criterion mapped to a repeatable check;
- all relevant Node and Playwright tests passing;
- lint and production build passing;
- resource limits and performance baseline recorded;
- sanitized evidence updated for the tested commit.

Manually Accepted additionally requires a dated creator checklist. Neither gate
may be inferred from implementation alone.
