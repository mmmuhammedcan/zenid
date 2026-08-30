# SPEC-011 Evidence — ZenID MCP plugin

Status: Automatically verified for T001–T013 and T015. Not manually accepted;
not published.
Verified: 2026-08-30
Tested commit: parent `b54f172` (this file is the only later change)
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

## Not verified

- **T014 publication.** The package is not published to npm. That is a creator
  action; `npm run build` and the pack test show the tarball is sound.
- **Manual acceptance.** No dated creator checklist exists for using the plugin
  from a real Claude Desktop or Claude Code installation. The protocol tests use
  the official MCP client over real stdio, which is strong evidence that a
  client can drive it, but it is not the same as a person completing the
  workflow.
- **Q-005 remains open.** `zenid_validate` currently reports a deliberately
  narrow mechanical set (missing name, missing contact method, empty sections,
  a resume variant that excludes every entry in a section). Whether ZenID should
  claim more ATS analysis is a product promise left to the creator.
- **Export parity under a real browser.** Parity is asserted between the Node
  host and the browser code path executed under Node with `window`, `fetch`, and
  `btoa` stubbed. The Playwright-based comparison named in the spec's
  verification mapping is not implemented.

Synthetic identities only, per the repository rule.
