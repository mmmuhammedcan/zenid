# SPEC-009 Evidence

Status: Automatically verified for the apex and `www` deployment; Search
Console gate open
Implementation commit: `7ef9d5b49696455574ed7d0ac4cd5ea31c2f0039`
Verified: 2026-07-27

## Automated repository evidence

The implementation commit was clean and matched both remote `main` and
`agent/spec-driven-zenid-baseline` when checked with `git ls-remote`.

The following checks passed from the repository root or
`frontend/pdf-editor`, as applicable:

- repository adapter tests: 1 passed;
- frontend unit tests: 14 passed;
- `npm run lint`;
- root and `/zenid/` production builds;
- deployment-output assertions for canonical metadata, `robots.txt`,
  `sitemap.xml`, and `_redirects`;
- Playwright release suite: 57 passed and 6 intentionally skipped across
  Chromium, Firefox, WebKit, and mobile Chromium projects;
- `.zenid` save and fresh-process restore, including one restored PDF page;
- import benchmark: small p95 47.2 ms against a 200 ms budget, typical p95
  52.4 ms against a 500 ms budget, and a measurement-only near-limit result of
  448.8 ms.

The build adapter produced static route shells under `dist/client/resume/`,
`dist/client/portfolio/`, and `dist/client/editor/`. Cloudflare Pages must be
deployed from `dist/client/`; deploying the lower-level Vite output preserves
the application shell but causes direct routes to return HTTP 404 through
`404.html`.

## Cloudflare Pages evidence

Project: `getzenid`

The creator-owned Pages project was already present and associated with
`getzenid.com`. The verified `dist/client` artifact was deployed from the
implementation commit on 2026-07-27:

- deployment ID: `3d8ef5e2`;
- deployment URL: `https://3d8ef5e2.getzenid.pages.dev`;
- environment: Production;
- branch: `main`;
- source: `7ef9d5b`.

Live HTTPS checks against `https://getzenid.com` produced:

| Request | Result |
|---|---|
| `/` | HTTP 200 |
| `/resume` | HTTP 308 to `/resume/`, then HTTP 200 |
| `/portfolio` | HTTP 308 to `/portfolio/`, then HTTP 200 |
| `/editor` | HTTP 308 to `/editor/`, then HTTP 200 |
| `/robots.txt` | HTTP 200 |
| `/sitemap.xml` | HTTP 200 |

TLS verification returned zero for the apex and all tested apex routes. The
three direct route shells were byte-identical to the reviewed built
`index.html`.

The live root declares the approved title, description, and
`https://getzenid.com/` canonical URL. The live robots response permits search
indexing and names the canonical sitemap. Cloudflare also prepends its managed
content-signal policy, which allows search indexing while reserving AI-training
use; the reviewed ZenID rules remain present.

No Pages Functions or server-side project-data endpoint was deployed. The
production artifact contains only the reviewed static client files.

## Open external gates

- `www.getzenid.com` was associated with the Pages project through the
  Cloudflare Pages API. The creator added a proxied CNAME named `www` targeting
  `getzenid.pages.dev` on 2026-07-27. Public resolvers return Cloudflare A and
  AAAA addresses. Pages domain, validation, and verification statuses are
  active.
- `https://www.getzenid.com/` returns HTTP 200 with successful TLS
  verification and declares `https://getzenid.com/` as canonical.
- The `www` `/resume`, `/portfolio`, and `/editor` requests redirect once to
  their trailing-slash forms and then return HTTP 200 with successful TLS
  verification.
- Google Search Console ownership verification and root sitemap submission
  remain pending until the domain cutover is complete.
- The previously accepted Sites deployment remains publicly available at
  `https://zenid-local-workspace.cosmican.chatgpt.site` as the rollback path.
  Its current live version is version 7 from commit `3b2c948`; a connector
  source-head mismatch prevented saving the later metadata commit, so no
  unverified Sites version was deployed.

## Acceptance interpretation

- AC-001: Automatically verified.
- AC-002: Automatically verified.
- AC-003: Automatically and live-environment verified.
- AC-004: Automatically verified by localization and release tests.
- AC-005: Automatically and live-environment verified.
- AC-006: Automatically and live-environment verified.
- AC-007: Open — creator Search Console action is required.

This record does not claim creator acceptance for the incomplete Search
Console gate.
