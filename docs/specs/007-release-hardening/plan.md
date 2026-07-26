# SPEC-007 Implementation Plan

Status: Implemented; commit-scoped evidence pending
Updated: 2026-07-26

1. Add focused release tests before changing browser/deploy behavior.
2. Add Playwright Firefox, WebKit, and mobile projects with bounded test
   selection so the full Chromium functional suite remains the primary gate.
3. Add axe-based route checks and repair release-blocking findings.
4. Add synthetic ZenPDF navigation/export evidence.
5. Parameterize the Vite base, React router basename, and public asset paths.
6. Generate `404.html` from the built application as a provider-neutral static
   SPA fallback and verify both root and subpath output.
7. Run unit, lint, builds, browser suites, benchmark, and round-trip gates.
