# SPEC-011 Evidence — ZenID MCP plugin

Status: Automatically verified for T001–T013 and T015–T020. Published to npm
as `zenid-mcp@0.1.0`; D-030 is prepared as `0.1.1` but is not yet published.
Not yet manually accepted from a real Claude Desktop or Claude Code installation.
Verified: 2026-09-03
Tested commit: HEAD at commit time (see T017 section for the incremental diff)
Environment: Node v22.15.1, Linux x86_64

## Verification commands

From `frontend/pdf-editor`:

```bash
npm test          # 120 passed, 0 failed
npm run lint      # oxlint: 0 warnings, 0 errors
npm run build     # succeeded; deploy-output check passed
node scripts/zenid-roundtrip-check.mjs save
node scripts/zenid-roundtrip-check.mjs restore
```

From `packages/zenid-mcp`:

```bash
npm test          # 6 passed, 0 failed (includes the packed-tarball smoke test)
npm run build     # writes dist/server.js and dist/assets/fonts
```

From the repository root:

```bash
npm test          # 7 passed, 0 failed
npm run test:mcp  # 6 passed, 0 failed
```

## Acceptance criteria mapping

| AC | Evidence | State |
|---|---|---|
| AC-001 structural open summary | `src/host/projectSession.test.js` — "opening a project returns a structural summary and no section prose"; asserts the summary contains neither the experience description nor the employer name | Automatically verified |
| AC-002 migration round trip | same file — "an older-schema project migrates on open and saves as a current file"; a v1 fixture migrates and the saved file reparses at v3 | Automatically verified |
| AC-003 wording leaves facts intact | `src/host/guardedOperations.test.js` — canonical description unchanged, override applied, `materializeResumeData` reflects the new text | Automatically verified |
| AC-004 wording refuses a fact | same file, 5 cases (employer, role, start date, institution, credential id) plus the protocol-level case in `packages/zenid-mcp/test/protocol.test.js`; the error names `zenid_edit_fact` | Automatically verified |
| AC-005 fact edits report old/new | same file — asserts exact `{ path, before, after }` triples | Automatically verified |
| AC-006 publication cannot widen | same file, one case per protected group: `contactPrivacy`, `visibleSections`, `hiddenItems`, `media`, `portfolio.resume.enabled`, plus `assertPublicationNotWidened` as a standalone check | Automatically verified |
| AC-007 non-overwriting save | `src/host/projectSession.test.js` — the opened file's bytes are compared before and after; a second save does not clobber the first; explicit overwrite is honoured | Automatically verified |
| AC-008 resume export parity | `src/host/exportParity.test.js` — application and Node PDFs compared byte-for-byte with only the jsPDF creation date and document ID normalized; size assertion rules out a silent helvetica fallback | Automatically verified |
| AC-009 portfolio excludes unpublished data | `packages/zenid-mcp/test/protocol.test.js` asserts the exported ZIP does not contain the unpublished contact email. Confirmed non-vacuous: with `contactPrivacy.email` true the same email does appear in the ZIP | Automatically verified |
| AC-010 refuse on failed normalization | `src/host/projectSession.test.js` — save rejects with `MISSING_RESUME` and the target path does not exist afterwards | Automatically verified |
| AC-011 no outbound network | `packages/zenid-mcp/test/no-network.js` stubs `net`, `tls`, `dns`, `http`, `https`, `fetch`, and `WebSocket` to throw, loaded with `--import` into the server subprocess; a full session covering open, edit, validate, save, and both exports passes | Automatically verified |
| AC-012 format description | `packages/zenid-mcp/test/protocol.test.js` — asserts the live `CURRENT_SCHEMA_VERSION`, the fact-tool reference, the never-widen rule, and the save default | Automatically verified |
| AC-016 conversational creation | `packages/zenid-mcp/test/protocol.test.js` — with no project open, creates a named project, sets synthetic personal information, adds experience/skills/education, reads and validates it, saves to an explicit path, reparses the archive, then exports and verifies a `%PDF` file over real stdio with outbound sockets disabled | Automatically verified |

## Mutation checks

An assertion that never fails is not evidence, so each guard was deliberately
broken and the suite re-run:

| Mutation | Result |
|---|---|
| Font face mismapped in `nodeHost.js` | export-parity 4/5, 1 failed |
| Publication guard disabled | guarded ops 15/21, 6 failed |
| Presentation/fact boundary disabled | guarded ops 16/21, 5 failed |
| Save made to overwrite by default | project session 9/11, 2 failed |
| One deliberate `fetch` added to the server | protocol 0/5, 5 failed |
| D-028 date checks disabled (`findUndatedAndInconsistentDates` call removed) | project session 17/20, 3 failed |

## Defects found by the tests during implementation

1. The MCP schema layer strips undeclared keys, so an agent's attempt to
   rewrite an employer name through the wording tool was silently dropped
   rather than refused. Silent success on a factual edit is worse than a
   refusal, because the user is never told. The factual keys are now declared
   on the tool so the guard sees and refuses them.
2. The esbuild bundle emitted a second shebang on top of the one esbuild
   already preserves, which is a syntax error. The published package would not
   have started.
3. The direct-execution guard compared `process.argv[1]` with
   `import.meta.url`. npm installs the bin as a symlink, so the two never match
   and the published server exited immediately without serving. Both were found
   only by the packed-tarball test, not by any source test.

## T017 — D-028 mechanical findings and the resume playbook

Verified: 2026-09-03

- AC-013: `frontend/pdf-editor/src/host/projectSession.test.js` adds 9 cases
  for `NO_LOCATION`, `NO_PROFESSIONAL_LINK`, `UNDATED_ITEM` (experience and
  education), and `INCONSISTENT_DATE_FORMAT`, each with a positive and a
  negative case; 20/20 pass. `packages/zenid-mcp/test/protocol.test.js` adds a
  case driving the same findings over the live protocol; 8/8 pass.
- AC-014: `frontend/pdf-editor/src/resume/writingGuidance.test.js` (6/6)
  asserts the playbook's shape — the evidence formula, weak/better pairs, the
  structure checklist, and exactly the four named AI-collaboration prompts —
  and asserts the serialized data contains no `"score"` key or
  `"interpretation"` text, so the checklist's 0-16 scoring rubric cannot
  silently reappear. `protocol.test.js` confirms the tool answers with no
  project open and returns the same shape over stdio.
- Mutation check: removing the call to `findUndatedAndInconsistentDates`
  drops project-session tests from 20/20 to 17/20, confirming the new checks
  are load-bearing rather than vacuous.
- A real defect found while writing the tests: the first `UNDATED_ITEM`
  implementation flagged `normalizeProject`'s default placeholder row (an
  entirely empty scaffold entry every new section starts with) as an undated
  item. Fixed by only evaluating entries the user has actually started
  writing, using the same "filled" definition `getFilledSections` already
  uses in the browser application, so the two surfaces agree on what counts
  as a real entry.
- The packed-tarball tool count in `test/pack.test.js` was updated from 14 to
  15 tools; the pack test (`npm test` in `packages/zenid-mcp`, full run) still
  passes, so the new tool travels through publication packaging correctly.
- Full re-run after these changes: frontend 135/135, zenid-mcp package 8/8,
  root 7/7, `test:mcp` 8/8, lint clean, build clean, roundtrip save+restore
  pass.

## T018 — D-029 deterministic ATS score

Verified: 2026-09-03

- AC-015: `frontend/pdf-editor/src/host/projectSession.test.js` adds 5 cases
  — a project passing all seven criteria scores 100 with no recommendations,
  a bare project scores below 100 with a recommendation on every failed
  criterion, the score is byte-identical across two calls on an unedited
  project (`assert.deepEqual`), the criteria set is exactly the seven named
  keys, and the `location` criterion's pass/fail is checked against the
  `NO_LOCATION` finding it is derived from. 25/25 pass.
  `packages/zenid-mcp/test/protocol.test.js` extends the existing D-028
  finding test to also assert `atsScore.percent < 100`, exactly 7 criteria,
  and a recommendation on the failed `location` criterion, over the live
  stdio protocol. 8/8 pass.
- The score is computed as arithmetic over the same `mechanicalFindings`
  values `zenid_validate` already returns (plus one direct check for
  non-empty experience and skills), not a second independent judgment. All
  seven criteria are equal-weight by design; weighting them would itself be
  an unstated opinion about which gap matters more, which the decision
  record (D-029) states directly.
- Mutation check: replacing the real `computeAtsScore` call with a
  hardcoded `{ percent: 100, passed: 7, total: 7, criteria: [] }` drops
  project-session tests from 25/25 to 22/25, confirming the score
  computation is load-bearing rather than a pass-through constant.
- Scope boundary made explicit in code, README, and the spec: job-specific
  screening ("would this pass a real recruiter's AI filter for this
  posting") is not computed by `zenid_validate`. The server has no
  model-provider access (BR-001, verified by the no-network test), so it
  cannot render that judgment; the tool description and README both point
  the caller at `zenid_read_section` plus `zenid_resume_playbook`'s
  `relevance_review` prompt for that conversation instead.
- Full re-run after these changes: frontend 140/140 (stable across 3
  consecutive runs after one transient failure attributable to a
  concurrent build), zenid-mcp package 8/8, root 7/7, `test:mcp` 8/8, lint
  clean, build clean, roundtrip save+restore pass.

## T019/T014 — npm publication

Verified: 2026-09-03

- Added `packages/zenid-mcp/LICENSE` (MIT text; the package already declared
  `"license": "MIT"` but shipped no license file) and publish metadata:
  `author`, `homepage`, `repository`, `bugs`.
- `npm publish` first failed with `403 Two-factor authentication or granular
  access token with bypass 2fa enabled is required`, the registry's mandatory
  publisher-security policy. The creator enabled 2FA on their npm account and
  republished.
- `npm publish` also warned `"bin[zenid-mcp]" script name was cleaned`
  because the `bin` path was written as `"./dist/server.js"`; modern npm
  normalizes bin paths without a leading `./`. Fixed with `npm pkg fix`, then
  re-verified with a clean `npm pack --dry-run`: no warnings, same 8 files,
  827.7 kB, LICENSE present in the tarball contents.
- Published as `zenid-mcp@0.1.0`. `npm view zenid-mcp` against the live
  registry confirms the package, matching shasum, and "published a minute
  ago by mmmuhammedcan."
- Verified as a real consumer would experience it, not just that the publish
  command succeeded: `npm init` in a scratch directory, `npm install
  zenid-mcp` from the real registry (118 packages installed), then the
  installed `node_modules/.bin/zenid-mcp` binary driven over real stdio with
  the MCP SDK client — `listTools` returns all 15 tools including
  `zenid_resume_playbook` and the D-029 `atsScore`-bearing `zenid_validate`,
  and a live call to `zenid_resume_playbook` returns the expected payload.
  This closes T014.

## T020 — D-030 conversational project creation

Verified: 2026-09-03

- `frontend/pdf-editor/src/host/guardedOperations.test.js` covers addition in
  every canonical array section, generated identifiers, unknown-section and
  unknown-field refusal, and replacement of the browser's blank scaffold row.
- `frontend/pdf-editor/src/host/projectSession.test.js` covers a named empty
  project, refusal to save it without a target, and an explicit save that
  reparses through `parseProjectFileBytes`.
- `packages/zenid-mcp/test/protocol.test.js` drives AC-016 over real stdio with
  outbound networking disabled: create, personal facts, three new entries,
  section read, validation, explicit first save, shared-parser reopen, and PDF
  export. The package advertises 17 tools.
- Exact rerun: frontend `npm test` 152/152; `npm run lint` 0 warnings/errors;
  `npm run build` passed its deploy-output check; MCP package `npm test` 10/10,
  including the clean packed-tarball session; root `npm test` 7/7 and
  `npm run test:mcp` 10/10; roundtrip save and restore both passed.
- New facts do not silently widen the public portfolio: experience, project,
  and certification additions enter `hiddenItems`, while a newly populated
  skills section is made non-public because the schema has no per-skill list.
- Browser regression: Chromium 33 passed, 1 intentionally skipped. The broken
  Playwright Firefox cache was repaired by removing only the disposable
  `firefox-1532` browser directory and reinstalling Firefox 151. The configured
  `firefox-release` project then completed successfully: 12 passed and 2
  intentionally skipped. This exercises critical routes, IndexedDB migration
  and locking, shared workspace hydration, and local synthetic PDF export in a
  second real browser engine.
- A fresh-context Reviewer found and the Developer closed four issues before
  commit: uncoded export failure before first save, a user-authored empty skill
  category being mistaken for scaffold data, boolean-only blank entries being
  accepted as content, and an underspecified add-fact MCP input schema. Tests
  now cover the three behavioral cases and the advertised string/boolean types.
- `npm pack --dry-run --json` produced the warning-free 8-file
  `zenid-mcp@0.1.1` tarball (829,689 bytes) with the server and all three fonts.
  Registry publication remains a creator action because npm requires publisher
  authentication/2FA.

### Live client acceptance observation

The locally registered `zenid` server was exercised through Jcode's real MCP
client interface after the automated suite, rather than by importing its source
or calling a test helper:

1. The client listed all 17 live tools, including `zenid_create_project` and
   `zenid_add_fact`.
2. `zenid_create_project` created a Turkish résumé named
   `Gerçek MCP Kabul CV` with schema 3 and zero filled sections.
3. The client set a synthetic person's header and added one company experience,
   one skill group, and one education entry. Each call reported its concrete
   factual change. The experience was also placed in `hiddenItems`, and skills
   were made non-public, confirming the publication boundary through the public
   tool result.
4. `zenid_validate` observed `valid: true`, no findings, and a deterministic
   ATS result of 100% (7/7 criteria) for the completed synthetic record.
5. The client saved
   `$JCODE_SCRATCH_DIR/zenid-d030-acceptance/deniz-kaya.zenid` (2,346 bytes),
   exported the default PDF beside it (226,094 bytes), and reopened the saved
   project through `zenid_open_project`. The reopened summary observed exactly
   one skill, one experience, one education entry, and one hidden experience.
   Independent file inspection identified a valid ZIP whose four entries pass
   `unzip -t`, and a PDF 1.3 document containing one page.

This is representative evidence for the installed local MCP workflow and its
filesystem boundary. It is not a claim that npm `0.1.1` is live: registry
publication remains externally blocked on the publisher's interactive 2FA.

The npm registry's public `zenid-mcp/latest` endpoint was fetched directly on
2026-09-03 after this observation. It returned `version: 0.1.0`, tarball
`zenid-mcp-0.1.0.tgz`, and the previously recorded eight-file distribution.
Therefore the public installation boundary was exercised and the limitation is
concrete: local `0.1.1` behavior is validated, but users running
`npx -y zenid-mcp` still receive `0.1.0` until the publisher completes the
authenticated release. The spec must not report `0.1.1` as publicly delivered
before that registry response changes.

### Final whole-result acceptance replay

After the Firefox environment repair, the complete result was replayed through
the registered `zenid` MCP server rather than through source imports or test
helpers. The client listed 17 tools, created a fresh schema-3 English workspace,
added one synthetic experience, one skill group, and one education record, and
set synthetic contact facts. The first validation usefully reported three
mechanical issues caused by noncanonical location/link aliases and inconsistent
date formats. After the same public fact-edit tool changed those values to the
canonical fields and `YYYY-MM` dates, `zenid_validate` reported `valid: true`,
no findings, and ATS 100% (7/7). This demonstrates that the score reacts to
actual corrections rather than returning a constant result.

The public save tool then wrote
`$JCODE_SCRATCH_DIR/zenid-final-acceptance/final-public-interface.zenid`
(2,332 bytes), the default PDF export wrote a PDF 1.3 document with one page
(152,898 bytes), and the public open tool reparsed the archive with exactly one
skill, experience, and education entry. `unzip -t` independently passed all
four archive members. The reopened publication summary retained the privacy
defaults: the experience remained hidden and the skills section remained
non-public.

The direct-paste forum artifact was also checked in its delivery form:
`docs/marketing/zenid-forum-post.txt` is 352 words, has no Markdown heading or
code fence, and contains both the ZenID site and npm package links. Opening it
in the desktop UI was attempted, but the session harness suppressed file/URL
opening. Posting it to the real forum or WhatsApp remains a creator action, so
the delivery-format checks are representative rather than a claim of manual
publication acceptance.

## Not verified

- **Manual acceptance.** No dated creator checklist exists for using the plugin
  from a real Claude Desktop or Claude Code installation. The protocol tests use
  the official MCP client over real stdio, which is strong evidence that a
  client can drive it, but it is not the same as a person completing the
  workflow.
- **Export parity under a real browser.** Parity is asserted between the Node
  host and the browser code path executed under Node with `window`, `fetch`, and
  `btoa` stubbed. The Playwright-based comparison named in the spec's
  verification mapping is not implemented.
- **The playbook's advice quality.** `zenid_resume_playbook` is transcribed
  reference data, verified for shape and for the absence of a scoring field
  (T017). Whether the checklist's own guidance is good career advice is not,
  and cannot be, something an automated test establishes.
- **What the atsScore correlates with.** T018 verifies the score is
  correctly computed, stable, and auditable arithmetic over the D-028
  criteria. It does not verify, and cannot verify, that a 100% score
  predicts a real ATS product's parse success or a recruiter's decision;
  that claim is deliberately not made anywhere in the tool description,
  README, or spec.

Synthetic identities only, per the repository rule.
