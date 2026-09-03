# SPEC-011 Implementation Plan

## What already exists

The plugin does not need a rewrite of ZenID's logic. The functions it needs are
already pure and host-agnostic:

- `resume/projectFile.js` — `parseProjectFileBytes` and
  `serializeProjectArchive` work on byte arrays. Only `downloadProjectFile`
  touches `Blob`, `URL.createObjectURL`, and `document`.
- `portfolio/portfolioSiteExport.js` — `serializePortfolioSite`,
  `buildPublicationReview`, and `validatePortfolioSiteArchive` are pure. Only
  `downloadPortfolioSite` touches the DOM.
- `resume/resumePdfExport.js` — `buildResumePdf` already accepts injected
  `fontData`. Only `exportResumeToPdf` fetches fonts and calls `btoa`.
- `resume/projectSchema.js` — `normalizeProject`, `migrateProject`,
  `updateResumeItemSelection`, `setResumeContentOverride`,
  `resetResumeContentOverride`, `duplicateResumeDocument`,
  `updateResumeDocument`, and `updateProjectProfile` are immutable pure
  functions that already raise `ProjectCompatibilityError` on invalid input.

The MCP tool surface is therefore mostly a typed, guarded wrapper over
functions that exist today. The genuine new work is the host adapter, the
publication guard, and the protocol layer.

## Phase 1 — Node host adapters

Add a small adapter module that supplies under Node what the browser supplies
today: the three `NotoSans` TTFs as font bytes for `buildResumePdf`, a base64
encoder that does not rely on `btoa`, and file read/write. No existing pure
function changes signature, and per Q-006 no letterhead loading is needed.

Exit condition: a Node script opens a synthetic `.zenid` fixture, produces a
résumé PDF and a portfolio ZIP, and both match the application's output for the
same input.

## Phase 2 — Guarded operation layer

Implement the D-025 and D-026 rules as one module between the tools and the
schema functions:

- classify every writable path as presentation or fact;
- refuse fact changes from wording tools with an error naming the fact tool;
- refuse any operation that would widen `contactPrivacy`, `visibleSections`,
  `hiddenItems`, portfolio media, or `portfolio.resume.enabled`;
- return the before/after values of each applied change;
- keep the working project in memory and expose one explicit save.

This layer is where the failing tests are written first, because it carries the
product promise and is testable without the protocol.

## Phase 3 — MCP server

Wrap the guarded layer in an MCP server over stdio using the official SDK, with
`zenid_describe_format` returning the editing rules so a compatible agent can
behave correctly without the rules being restated in every conversation. Ship
as an npm package runnable with `npx`, plus the client configuration snippet in
its README.

## Phase 4 — Verification and boundary documentation

Extend the round-trip script with a server-produced file, add the export-parity
case, run the protocol test with outbound sockets stubbed to throw, and state
the plugin's data boundary in `README.md` and `public/llms.txt` in the same
terms SPEC-005 uses.

## Phase 5 — Conversational creation

Expose the application's empty-project constructor through the Node session,
add a guarded operation for new factual entries, and register both as MCP tools.
The acceptance test starts with no file, creates a synthetic student's profile,
saves and reparses the `.zenid` archive, and exports a PDF over real stdio with
network access disabled.

## Packaging

D-027 places the package at `packages/zenid-mcp` as an npm workspace. Tests
import the shared modules by relative path so parity is measured against the
same source the application uses. Publication runs an esbuild bundle into the
package's `dist/`, because `npm pack` does not follow relative paths outside
the package directory, and copies the three font faces into the package.

## Risks

- Font and PDF parity under Node is the most likely source of a silent
  behavioral difference; the parity test in Phase 1 exists to catch it before
  the protocol layer hides it.
- The publication guard is the rule most likely to be weakened later by a
  convenience request. It should fail closed and be covered by its own tests.
- `zenid_describe_format` is documentation that ships as code and will drift
  from the schema unless a test asserts the schema version it reports.
- The publication bundle is a second build path. If it silently omits a module
  the source tests cover, the published package can behave differently from the
  tested one; a smoke test against the packed tarball closes this.

## Incidental finding

The header comment in `pdfLetterhead.js` states that the module is shared by
ZenPDF's raster export in `pdfExport.js`. `pdfExport.js` does not import it,
and no caller sets `letterhead: true`. The comment should be corrected or the
unused path removed under its own small change, separately from this spec.
