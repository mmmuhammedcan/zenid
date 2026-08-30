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
- [ ] T008 Add failing tests for open-summary shape (AC-001), migration
      round trip (AC-002), non-overwriting save (AC-007), and refusal on
      failed normalization (AC-010).
- [ ] T009 Implement open, validate, and save until T008 passes.
- [ ] T010 Implement the stdio MCP server and `zenid_describe_format`, with a
      protocol test asserting the tool list, one applied edit, and one refusal.
- [ ] T011 Run the protocol test with outbound sockets stubbed to throw and
      record the result as AC-011 evidence.
- [ ] T012 Extend `scripts/zenid-roundtrip-check.mjs` with a server-produced
      file.
- [ ] T013 Add the `packages/zenid-mcp` workspace and its publication bundle,
      with a smoke test that runs the packed tarball.
- [ ] T014 Publish the package and write its README client-configuration
      snippet.
- [ ] T015 State the plugin data boundary in `README.md` and
      `public/llms.txt`.
- [ ] T016 Run Reviewer and QA gates, write `evidence.md`, and add the
      capability row to `docs/verification-matrix.md`.
