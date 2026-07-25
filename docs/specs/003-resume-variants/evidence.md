# SPEC-003 Evidence

Status: Automatically verified; manual acceptance open
Last updated: 2026-07-25

## Evidence recorded

Implementation through commit `aed84a25dc9d9bf1a23fa80b0ca95811bb4d6ab3`
was tested on Linux with Node.js 22.15.1:

- `npm test` — passed; 9 test-file subtests.
- `npm run lint` — passed with no diagnostics.
- `npm run build` — passed; the existing large-chunk warning remains.
- `npm run test:e2e` — passed; 5 Chromium tests.
- `node scripts/zenid-roundtrip-check.mjs save` — passed with a synthetic
  101,064-byte schema-v2 `.zenid` project.
- `node scripts/zenid-roundtrip-check.mjs restore` — passed in a fresh process
  with the expected synthetic sections and one-page PDF.
- `git diff --check` — passed, and the tested worktree was clean.

The first sandboxed Playwright web-server start could not bind
`127.0.0.1:4173`. The permitted local-loopback run passed 5/5; this was an
execution-environment restriction rather than a product failure.

Automated evidence covers AC-001 through AC-008:

- two variants keep independent names, templates, colors, section orders, and
  Experience/Project selections over one canonical profile;
- a canonical company edit appears in both variants;
- the last résumé cannot be deleted;
- duplication preserves presentation and selections while assigning a new ID
  and generated name;
- hidden variant items remain in the editor, other variants, and canonical
  profile;
- the same filtered output reaches design preview, live ATS PDF preview,
  downloaded PDF, generated PDFs inside `.zenid`, and a generated portfolio
  résumé;
- save/open and fresh-process round trips retain selections;
- schema v1 migrates to v2 with all pre-existing items included, while newer
  unsupported schemas remain safely rejected.

A fresh-context Reviewer found two Medium issues: v1 placeholder selection
fields could accidentally gain v2 meaning, and output-parity evidence was too
weak. The migration now removes only the newly semantic Experience/Project
keys while preserving unknown selection fields. Tests now inspect real PDF
text from direct and archived downloads and exercise the portfolio résumé
package. The Reviewer approved the corrected change with no remaining
actionable findings.

## Missing evidence

- Dated manual acceptance of the selection controls on representative desktop
  and mobile layouts.
- Independent rendered-image content comparison for the ATS preview. The
  preview and export currently share the same filtered input and PDF builder,
  and exported PDF text is automatically inspected.

Deferred product work remains tracked separately: `contentOverrides`, selection
for other repeatable sections, and the Modern-preview/non-ATS-PDF decision.
