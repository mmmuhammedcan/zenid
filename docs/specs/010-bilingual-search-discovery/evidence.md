# SPEC-010 Evidence — Bilingual Search and AI Discovery

Status: Automatically verified and deployed; Search Console submission pending
Implementation commit: `ead3ecaea6dfff05547cc8e7997942bc5c70ea65`
Deployment source commit: `f2a772eadd815e9179d1ce92bbb7f15dc5922f69`
Verified: 2026-07-27

## Acceptance mapping

| Acceptance criteria | Evidence |
| --- | --- |
| AC-001–AC-002 | Static-shell tests verify the six built routes, language, unique metadata, canonical URLs, H1s, and useful pre-JavaScript content. |
| AC-003–AC-004 | Browser tests verify capability-specific copy and the Resume, Portfolio, and PDF Editor calls to action. |
| AC-005 | Regression assertions preserve the root title, strapline, and canonical URL. |
| AC-006–AC-008 | Build tests verify reciprocal `hreflang`, sitemap entries, `WebApplication` JSON-LD, `llms.txt`, and the OAI-SearchBot/GPTBot distinction. |
| AC-009 | Unit, lint, build, browser, round-trip, and benchmark commands passed at the implementation commit. |
| AC-010 | All six canonical URLs, sitemap, robots, and `llms.txt` returned HTTPS 200 in the production smoke. Search Console submission remains open. |

## Test-first record

The first root test run failed because the new static-shell module did not yet
exist. The next run exposed an incomplete helper export. The implementation was
then added and the same assertions passed. This records the intended red-to-green
sequence rather than treating code presence as acceptance.

## Automated verification

Commands were run from the repository root unless otherwise noted.

- `npm test`: 7 passed.
- `npm test --prefix frontend/pdf-editor`: 82 passed.
- `npm run lint --prefix frontend/pdf-editor`: passed.
- `npm run build`: passed.
- `npm run build --prefix frontend/pdf-editor`: passed; deploy-output check
  confirmed the canonical origin, SPA fallback, sitemap, robots file, and
  `llms.txt`.
- `npm run test:e2e --prefix frontend/pdf-editor`: 63 passed, 6 skipped across
  Chromium, Firefox, WebKit, and mobile Chromium.
- Focused localization and SPEC-010 browser run after the language-navigation
  correction: 8 passed.
- `node scripts/zenid-roundtrip-check.mjs save` and `restore`: passed with
  schema version 3, synthetic Ada Yılmaz data, one resume, and one restored PDF
  page.
- Project benchmark: small p95 42.8 ms against 200 ms; typical p95 57.4 ms
  against 500 ms; near-limit measurement-only p95 391.5 ms.
- `git show --check --oneline ead3eca`: passed.

The complete E2E suite initially could not bind its local server inside the
restricted sandbox (`EPERM` on `127.0.0.1:4173`). It passed unchanged when run
with the required local-server permission; this was an environment restriction,
not a product failure.

## Manual visual review

The Turkish CV page, English portfolio page, and Turkish PDF page at mobile
width were inspected. Typography, content hierarchy, calls to action, and
responsive layout were readable. This review found the Turkish page initially
showing English as the selected language; route-aware Turkish/English links
were implemented and the focused browser suite passed afterward.

## Privacy and crawler review

- Discovery pages introduce no analytics, cookies, accounts, or remote personal
  data flow.
- Only public product facts are exposed. Private workspace data remains in the
  browser and is not included in the discovery surface.
- `OAI-SearchBot` is allowed for public search discovery while `GPTBot` remains
  disallowed for model training.
- `llms.txt` is documented as supplemental orientation, not as a ranking
  guarantee or substitute for people-first HTML.

## Known non-blocking output

- The production bundle still emits the existing chunk-size warning for files
  over 500 kB.
- The existing dependency audit reports two high-severity findings already
  dispositioned under D-015; this verification does not claim an audit-clean
  dependency tree.

## Production evidence

- The exact pushed source was saved as Sites version 8 and deployed
  successfully to the existing rollback site.
- The same `dist/client` artifact was deployed to the `getzenid` Cloudflare
  Pages production branch; Cloudflare reported deployment
  `https://c5b8b993.getzenid.pages.dev`.
- `https://getzenid.com/` remained the durable canonical origin.
- Each of the six discovery routes returned HTTPS 200 and exposed the expected
  language, unique title, self-canonical URL, H1, and `WebApplication` JSON-LD.
- `sitemap.xml`, `robots.txt`, and `llms.txt` returned HTTPS 200. The sitemap
  contained all six URLs and reciprocal language alternates. The live robots
  response allowed `OAI-SearchBot`, disallowed `GPTBot`, allowed general search
  crawling, and linked the sitemap.
- A few edge requests briefly returned 404 immediately after deployment, then
  returned 200 on the completed propagation check. No persistent route failure
  remained.
