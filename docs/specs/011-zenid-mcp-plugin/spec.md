# SPEC-011 — ZenID MCP Plugin

Status: Implemented and automatically verified (T001-T013, T015-T018);
not published and not manually accepted. See evidence.md.
Owner: Creator
Last clarified: 2026-09-03
Implements: SPEC-005 deferred decisions (Q-001, Q-002, Q-003)

## Problem and user

SPEC-005 accepted that a user should be able to ask an AI they already use to
prepare or review a résumé without ZenID hosting a model, holding an API key,
or receiving the user's professional data. It deferred how that plugin is
delivered.

Today the only path is manual: the user exports a `.zenid` file, attaches it to
a chat, describes the `.zenid` format from scratch, and pastes the result back.
The agent has no reliable way to read the format, no way to make a bounded
edit, and no way to produce a file ZenID will reopen.

The user in scope is someone who already works with a local agent client — for
example Claude Desktop or Claude Code — and wants to say "target my ZenID
résumé at this job posting" without opening the application first. They want
the application afterwards, to look at the result and export it.

## Scope

In scope:

- an npm-published MCP server package, `zenid-mcp`, run by the user's own agent
  client over local stdio;
- read, typed edit, validate, save, and export tools operating on `.zenid`
  files and export outputs on the local filesystem;
- a format-description tool that teaches a compatible agent the project model
  and ZenID's editing rules;
- a Node-side adapter for font bytes, base64 encoding, and file reading and
  writing, so the already-pure serialization and PDF-building functions run
  unchanged under Node;
- documentation of the plugin's data boundary in `README.md` and `llms.txt`.

Out of scope: a ZenID-hosted or remote MCP server; ChatGPT and other
remote-only MCP clients; a ZenID-held model-provider API key; an in-application
assistant; model-generated factual verification; job listing or matching, which
SPEC-005 assigns to a possible separate opt-in product; any change to the
browser application's storage boundary under D-012.

## Business rules

- BR-001: The server runs on the user's machine over stdio and makes no network
  request. Project data reaches a model provider only through the client the
  user chose, under that provider's terms, exactly as stated in SPEC-005.
- BR-002: The server reads and writes `.zenid` files through the existing
  `projectFile.js` reader/writer and the existing `projectSchema.js`
  normalization and migration path. It defines no second project format.
- BR-003: Every edit tool is typed and per-field, and returns the concrete
  before and after values of what it changed (D-025).
- BR-004: Persisting is a separate explicit tool call. It revalidates the
  project and writes to a new path unless the caller explicitly requests
  overwrite of the opened path.
- BR-005: Wording tools write only résumé presentation text through
  `setResumeContentOverride` and, where applicable under D-021, locale
  overrides. They never modify canonical profile facts (D-026).
- BR-006: Changing an employer name, institution name, date, or credential
  identifier requires the distinct fact-edit tool, which names the field and
  reports the old and new value.
- BR-007: No tool may set a `contactPrivacy` or `visibleSections` flag to
  true, remove an entry from `hiddenItems`, attach media to the public
  portfolio, or enable `portfolio.resume.enabled` (D-026).
- BR-008: Export tools refuse to run on a project that fails
  `normalizeProject`, and surface the existing `ProjectCompatibilityError` code.
- BR-009: The server accesses only paths the caller supplies. It does not scan
  the filesystem for `.zenid` files and does not read `creator_docs/`.
- BR-010: Reading a project returns a structural summary by default. Full
  section content is returned only by an explicit section read, so an agent
  does not pull an entire professional history into its context to change one
  bullet.
- BR-011: The server calls the same serialization, PDF, and portfolio functions
  the browser application calls. It supplies Node implementations only of the
  host-specific inputs those functions already accept — font bytes, base64
  encoding, and file reading and writing. A behavioral difference between
  application export and server export is a defect, not a supported variation.

## Acceptance criteria

- AC-001: Given a valid schema-v3 `.zenid` file, the open tool returns résumé
  variant names and identifiers, section item counts, locale, and portfolio
  publication state, and does not return full section text.
- AC-002: Given a schema-v1 or v2 fixture, the open tool migrates it through
  the existing path and a subsequent save produces a file the browser
  application reopens without a compatibility error.
- AC-003: Given a wording edit on an existing experience item, the saved
  project stores a résumé content override and the canonical profile item text
  is byte-identical to its previous value.
- AC-004: Given an attempt to change an employer name through a wording tool,
  the call is refused with an actionable error naming the fact-edit tool.
- AC-005: Given a fact edit, the tool result contains the field path, the old
  value, and the new value.
- AC-006: Given any tool call that would set a `contactPrivacy` or
  `visibleSections` flag to true, remove a `hiddenItems` entry, or enable
  `portfolio.resume.enabled`, the call is refused and the project is unchanged.
- AC-007: Given a save without an explicit overwrite request, the opened file is
  unmodified and a new file is created.
- AC-008: Given a résumé export request, the produced PDF contains selectable
  text for the résumé's headings and body, and is byte-comparable in structure
  to the application's export for the same project and résumé.
- AC-009: Given a portfolio export request, the produced ZIP contains no
  profile field that the project's publication settings exclude.
- AC-010: Given a project that fails normalization, every export and save tool
  refuses with the originating `ProjectCompatibilityError` code and writes no
  file.
- AC-011: During a full session covering open, edit, validate, save, and both
  exports, the server process makes no outbound network connection.
- AC-012: The format-description tool returns the current schema version, the
  section model, the presentation-versus-fact distinction, and the publication
  rules in BR-007.
- AC-013: Given a project missing a header location or every professional
  link (LinkedIn, GitHub, and portfolio all empty), containing an experience
  or education entry with no start date, or mixing `YYYY-MM` and free-text
  dates across entries, the validate tool reports one finding per issue naming
  the concrete field or item, and reports none of these findings when the
  corresponding document property is present and consistent.
- AC-014: The playbook tool returns the evidence formula, the structure
  checklist, and the four AI-collaboration prompts as data, and issues no
  verdict, score, or ranking of the user's content.
- AC-015: Given the same project, `zenid_validate`'s `atsScore` reports the
  same percentage and pass/fail breakdown across repeated calls with no
  intervening edit, is computed from exactly the seven named criteria in
  D-029, and each failed criterion carries one concrete recommended action.

## Proposed tool surface

Names are indicative; the contract that matters is BR-003 through BR-008.

| Tool | Purpose | Backed by |
|---|---|---|
| `zenid_describe_format` | Teach the agent the project model and editing rules | SPEC-005 plugin purpose |
| `zenid_open_project` | Load a `.zenid` path, return the structural summary | `parseProjectFileBytes`, `migrateProject` |
| `zenid_read_section` | Return one section's items on request | `materializeResumeData` |
| `zenid_list_resumes` | List résumé variants and their selections | `project.resumes` |
| `zenid_create_resume_variant` | Duplicate a résumé for a target role | `duplicateResumeDocument` |
| `zenid_set_item_selection` | Include or exclude an item from a variant | `updateResumeItemSelection` |
| `zenid_set_wording` | Write a presentation override | `setResumeContentOverride` |
| `zenid_reset_wording` | Restore canonical wording | `resetResumeContentOverride` |
| `zenid_edit_fact` | Explicit, reported factual change | `updateProjectProfile` |
| `zenid_validate` | Report normalization result and ATS-mechanical findings | `normalizeProject` |
| `zenid_resume_playbook` | Return the evidence formula, structure rules, and AI-collaboration prompts for the agent to apply | `zenid-resume-checklist.pdf` |
| `zenid_save_project` | Write a validated `.zenid` | `serializeProjectArchive` |
| `zenid_export_resume_pdf` | Write a résumé PDF | `buildResumePdf` |
| `zenid_export_portfolio_zip` | Write a portfolio package | `serializePortfolioSite` |

## Verification mapping

- Schema, migration, edit constraints, and refusals: pure Node tests over the
  existing serialization and schema functions, extending the current
  `src/resume/*.test.js` pattern.
- Protocol conformance: a Node test that drives the server over stdio with an
  MCP client and asserts the tool list, one successful edit, and one refusal.
- Export parity between browser and server: the same synthetic project exported
  in a Playwright browser case and in a Node case, compared structurally.
- Publication boundary: a portfolio ZIP produced by the server asserted against
  the existing `portfolioSiteExport.test.js` privacy expectations.
- Network boundary: the protocol test runs with outbound sockets stubbed to
  throw, and passes.
- Round trip: `node scripts/zenid-roundtrip-check.mjs save` and `restore`
  extended with a server-produced file.

Synthetic identities only, under the existing repository rule.

## Resolved questions

- Q-001: D-024 selects a locally run stdio MCP server as the first packaging
  format, and excludes remote-only clients including ChatGPT from this spec.
- Q-002: D-025 selects typed per-field edits over a validated in-memory project
  with an explicit separate save, rather than whole-file return.
- Q-003: D-026 defines the enforceable checks: presentation-versus-fact
  separation, reported factual edits, an un-wideable publication scope, and
  normalization as the gate before any write or export.
- Q-004: D-027 places the plugin at `packages/zenid-mcp` in this repository as
  an npm workspace, importing the shared modules by relative path and bundling
  them for publication.
- Q-006: No Node letterhead loader is required. `buildResumePdf` defaults
  `letterhead` to `false` and no application caller sets it to `true`, so the
  server passes the same value and export parity holds without loading the
  asset. If the application later exposes a letterhead option, enabling it in
  server exports becomes part of that feature's spec, together with the
  branding question of whether a ZenID wordmark belongs on a user's résumé.
- Q-005: D-028 expands `zenid_validate`'s mechanical findings to the
  binary-checkable rules from `zenid-resume-checklist.pdf`'s structure section
  (a missing header location, no professional link present, an undated
  experience or education entry, inconsistent date formatting across
  entries), and adds `zenid_resume_playbook`, a read-only data tool exposing
  the checklist's evidence formula, structure rules, and four
  AI-collaboration prompts so the connected agent can coach the user through
  their own real content. Neither tool scores, ranks, or judges the user's
  career; every finding names a concrete, checkable property of the document,
  and the playbook data is reference material for the agent to apply, not a
  verdict the server renders itself. The checklist's own subjective judgment
  calls (bullet strength, keyword relevance, evidence quality) are
  deliberately left to the agent conversation, consistent with `plan.md`
  keeping "AI resume analysis and prioritized suggestions" out of what the
  server itself asserts.
- Q-007: D-029 adds a deterministic `atsScore` to `zenid_validate` (a
  percentage over the seven D-028 mechanical criteria, with a recommended
  action per failed one) so the user gets a real, auditable score today.
  Job-specific content screening — whether a resume would pass a real
  recruiter's AI screen for a particular posting — stays a live capability of
  the connected agent using `zenid_read_section` and the playbook's
  `relevance_review` prompt, because the server has no model-provider access
  to render that judgment itself (BR-001).

## Open questions

None open.
