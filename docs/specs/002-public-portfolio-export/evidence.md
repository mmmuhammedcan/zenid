# SPEC-002 Evidence

Status: Automatically verified; manual host acceptance open
Last updated: 2026-07-25

## Evidence recorded

Implementation commit `acfdb9e7b915d37d38efa71888392bafe7b62ce2` was
tested on Linux with Node.js 22.15.1:

- `npm test` — passed; 9 test-file subtests.
- `npm run lint` — passed with no diagnostics.
- `npm run build` — passed; the existing large-chunk warning remains.
- `npm run test:e2e` — passed; 4 Chromium tests, including the SPEC-002
  publication-review and no-download cancellation case.
- `node scripts/zenid-roundtrip-check.mjs save` — passed with a synthetic
  101,066-byte `.zenid` project.
- `node scripts/zenid-roundtrip-check.mjs restore` — passed with the synthetic
  schema-v1 project and one-page PDF restored in a fresh process.
- `git diff --check` — passed, and the tested worktree was clean.

The first sandboxed Playwright web-server start was blocked from binding
`127.0.0.1:4173` with `EPERM`. The permitted local-loopback rerun passed 4/4;
the initial failure was an execution-environment restriction, not a product
test failure.

Automated evidence covers AC-001 through AC-005:

- generated HTML and résumé data exclude a private phone and hidden project;
- published text is HTML-escaped;
- every local ZIP reference exists and resolves from root and subpath bases;
- the review contains selected contact values and the complete logical file
  inventory, including `index.html`, public media, and the selected résumé;
- **Keep editing** closes the review without creating a download.

A fresh-context Reviewer found and then confirmed the fix for a generated
résumé privacy leak: portfolio contact settings and hidden
experience/project/certification items are now applied to the publication-only
résumé copy used by both preview and final export. The private `.zenid` profile
is not modified. The Reviewer approved the corrected change with no remaining
actionable findings.

## Creator acceptance on real static hosts — 2026-07-25

The creator deployed a portfolio ZIP exported from ZenID to two real static
hosts and confirmed the site loaded and functioned correctly on both:

- **GitHub Pages** (project-page subpath deployment, e.g.
  `username.github.io/repo`).
- **Netlify** (root deployment via a temporary drop link).

This satisfies AC-003's root-and-subpath compatibility claim with real-host
evidence rather than only the automated reference-integrity tests. No specific
URL or repository name is recorded here to avoid publishing the creator's
personal deployment details in a shared spec file.

## Missing evidence

- Broader assistive-technology and mobile review of the publication dialog.

No new automated evidence was recorded by this update; this is manual creator
acceptance evidence.
