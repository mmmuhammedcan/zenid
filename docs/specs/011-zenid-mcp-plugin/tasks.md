# SPEC-011 Tasks

- [x] T001 Record D-024, D-025, and D-026 and update SPEC-005 to point at this
      spec for its resolved questions. (D-024…D-027 are in
      `docs/decision-log.md`; SPEC-005 "Deferred decisions" now resolves to
      this spec.)
- [x] T002 Add a Node host adapter for font bytes, base64, and file I/O,
      without changing any existing pure function signature.
      (`frontend/pdf-editor/src/host/nodeHost.js`)
- [x] T003 Add a failing export-parity test comparing an application-produced
      and adapter-produced résumé PDF and portfolio ZIP for one synthetic
      project. (`frontend/pdf-editor/src/host/exportParity.test.js`; the
      browser side runs the real `loadFontDataFromAssets` path under stubbed
      `window`/`fetch`/`btoa`.)
- [x] T004 Implement the adapter until T003 passes. (5/5 host tests pass;
      confirmed failing when a font face is deliberately mismapped.)
- [x] T005 Add failing tests for the presentation-versus-fact boundary
      (AC-003, AC-004, AC-005).
      (`frontend/pdf-editor/src/host/guardedOperations.test.js`)
- [x] T006 Add failing tests for the publication guard (AC-006), one per
      protected field group: contactPrivacy, visibleSections, hiddenItems,
      media, and portfolio.resume.enabled.
- [x] T007 Implement the guarded operation layer until T005 and T006 pass.
      (`frontend/pdf-editor/src/host/guardedOperations.js`; 21/21 pass.
      Disabling the publication guard fails 6 cases and disabling the
      fact boundary fails 5, so both rules are load-bearing.)
- [x] T008 Add failing tests for open-summary shape (AC-001), migration
      round trip (AC-002), non-overwriting save (AC-007), and refusal on
      failed normalization (AC-010).
      (`frontend/pdf-editor/src/host/projectSession.test.js`)
- [x] T009 Implement open, validate, and save until T008 passes.
      (`frontend/pdf-editor/src/host/projectSession.js`; 11/11 pass. Making
      save overwrite by default fails 2 cases.) `validateProject` reports
      only mechanical findings pending Q-005.
- [x] T010 Implement the stdio MCP server and `zenid_describe_format`, with a
      protocol test asserting the tool list, one applied edit, and one refusal.
      (`packages/zenid-mcp/src/{server,tools}.js`,
      `packages/zenid-mcp/test/protocol.test.js`; 5/5 pass.)
- [x] T011 Run the protocol test with outbound sockets stubbed to throw and
      record the result as AC-011 evidence.
      (`packages/zenid-mcp/test/no-network.js`, loaded with `--import` into the
      server subprocess. Adding one deliberate outbound call fails all 5.)
- [x] T012 Extend `scripts/zenid-roundtrip-check.mjs` with a server-produced
      file. (`save` writes `Synthetic_Server_Project.zenid` through the tool
      layer; `restore` asserts the override survives and the canonical text
      did not change.)
- [x] T013 Add the `packages/zenid-mcp` workspace and its publication bundle,
      with a smoke test that runs the packed tarball.
      (`scripts/build.mjs`, `test/pack.test.js`. The test found two real
      publication defects: a duplicated shebang, and a bin entry guard that
      failed under npm's symlink so the published server exited without
      serving.)
- [x] T014 Publish the package (creator action). Published as `zenid-mcp@0.1.0`
      on 2026-09-03. `npm publish` first failed on the registry's mandatory
      2FA/granular-token requirement (403); the creator enabled it and
      republished. Verified post-publish, not just pre-publish: a clean
      `npm install zenid-mcp` in a scratch directory, then the installed
      `node_modules/.bin/zenid-mcp` binary driven over real stdio with the
      MCP SDK client, listing all 15 tools and successfully calling
      `zenid_resume_playbook`. README client-configuration snippets for
      Claude Desktop and Claude Code now describe a package that exists.
- [x] T015 State the plugin data boundary in `README.md` and
      `public/llms.txt`.
- [x] T016 Run Reviewer and QA gates, write `evidence.md`, and add the
      capability row to `docs/verification-matrix.md`. (See `evidence.md` for
      the AC mapping, the mutation checks, and what remains unverified.)
- [x] T017 D-028: expand `zenid_validate`'s mechanical findings with four
      checklist-grounded checks and add `zenid_resume_playbook`. (Tests:
      `frontend/pdf-editor/src/host/projectSession.test.js` — 20/20, 9 new;
      `frontend/pdf-editor/src/resume/writingGuidance.test.js` — 6/6, new;
      `packages/zenid-mcp/test/protocol.test.js` — 8/8, 2 new; the packed-
      tarball tool count updated to 15. All green.)
- [x] T018 D-029: add a deterministic `atsScore` to `zenid_validate` (seven
      equal-weight binary criteria over D-028's findings, percent, and a
      recommendation per failed criterion), and document that job-specific
      AI screening stays a live agent capability rather than a server-side
      claim, because the server has no model-provider access (BR-001). Tests:
      `frontend/pdf-editor/src/host/projectSession.test.js` — 25/25, 5 new;
      `packages/zenid-mcp/test/protocol.test.js` — 8/8, extended. Mutation
      check: hardcoding a fake 100% score drops project-session tests from
      25/25 to 22/25 passing (3 failed).
- [x] T019 Add the missing `LICENSE` file (package.json already claimed MIT)
      and publish metadata (`author`, `homepage`, `repository`, `bugs`) ahead
      of T014. `npm pkg fix` corrected a `bin` path normalization warning
      (`"./dist/server.js"` -> `"dist/server.js"`); re-verified with a clean
      `npm pack --dry-run` showing no warnings and the same 8-file, 827.7 kB
      tarball.
