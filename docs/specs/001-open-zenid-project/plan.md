# SPEC-001 Implementation Plan

Status: In progress
Updated: 2026-07-24

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
Web Worker. Do not introduce a worker without measured evidence.

Archive extraction now applies entry-count, per-entry, and cumulative expanded
limits through `fflate`'s central-directory filter before each entry's output
buffer is allocated. The remaining decision is whether the current 75 MB
budget gives acceptable import duration and main-thread responsiveness on
supported devices; T040 must answer that with measurements.

## Delivery gates

Automatically Verified requires:

- every acceptance criterion mapped to a repeatable check;
- all relevant Node and Playwright tests passing;
- lint and production build passing;
- resource limits and performance baseline recorded;
- sanitized evidence updated for the tested commit.

Manually Accepted additionally requires a dated creator checklist. Neither gate
may be inferred from implementation alone.
