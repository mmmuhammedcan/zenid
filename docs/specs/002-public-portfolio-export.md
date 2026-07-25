# SPEC-002 — Export a Public Portfolio Package

Status: Automatically verified
Owner: Creator
Last clarified: 2026-07-25

## Problem and user

A user needs to publish a static portfolio without accidentally disclosing
private profile fields, hidden items, private project JSON, or unrelated media.

## Scope

In scope: publication review, explicit contact/item selection, local ZIP
generation, referenced public assets, root/subpath hosting compatibility.

Out of scope: ZenID-hosted deployment, provider accounts or tokens, analytics,
authentication, and private project backup. A provider integration — an
automated or one-click publish that talks to a hosting provider on the user's
behalf — still requires a separate follow-up spec and decision.

Static, informational publishing instructions are in scope as of 2026-07-25
(BR-007/AC-006), scoped to GitHub Pages only. They are bundled text with an
outbound link to GitHub's own documentation; ZenID makes no request to any
provider and needs no account or token.

A copyable prompt that the user pastes into their own AI assistant is also in
scope as of 2026-07-25 (BR-008/AC-007), covering GitHub Pages, Netlify, and
Cloudflare Pages. This exists because static screenshots or per-provider
step-by-step UI walkthroughs go stale as provider dashboards change; an
external AI assistant can adapt to the provider's current screen instead.
ZenID does not call, embed, or connect to any AI model — the prompt is inert
text copied to the clipboard, and the user's own AI tool is used entirely
outside ZenID.

## Business rules

- BR-001: Only explicitly public contacts and items enter the package.
- BR-002: Hidden item text and media never enter HTML or ZIP files.
- BR-003: Private source JSON and `.zenid` data never enter the public package.
- BR-004: Publication requires a final review listing public contacts and files.
- BR-005: The exported site has no runtime JavaScript/CSS network dependency.
- BR-006: A generated résumé applies portfolio contact and hidden-item privacy.
  An uploaded résumé is an explicitly selected opaque public file whose contents
  ZenID does not rewrite.
- BR-007: The publication review dialog includes static GitHub Pages publishing
  steps. This is bundled text and one outbound documentation link; it triggers
  no automatic request and requires no provider account or token.
- BR-008: The publication review dialog offers a copyable prompt, written for a
  non-technical user, that names GitHub Pages, Netlify, and Cloudflare Pages and
  asks the user's own external AI assistant to help choose one and walk through
  publishing. Copying uses only the clipboard API; ZenID does not call any AI
  model itself.

## Acceptance criteria

- AC-001: A private phone number and hidden project are absent from ZenID-
  generated HTML and generated résumé data.
- AC-002: Published text is HTML-escaped.
- AC-003: Every local reference resolves to a file in the ZIP at root and
  subpath hosts.
- AC-004: Before download, the review dialog lists every selected public contact
  label and value plus the logical packaged-file inventory, including
  `index.html`, public assets, and the résumé when selected.
- AC-005: Choosing **Keep editing** closes the review and creates no download.
- AC-006: The review dialog shows GitHub Pages publishing steps before the ZIP
  is downloaded.
- AC-007: The review dialog offers a copyable AI-assistant prompt naming GitHub
  Pages, Netlify, and Cloudflare Pages, and copying it does not make a network
  request.

## Verification mapping

- AC-001–AC-004: `portfolioSiteExport.test.js`.
- AC-004 UI and AC-005: `e2e/spec002-public-portfolio-export.spec.js`.
- AC-006, AC-007: `e2e/spec002-public-portfolio-export.spec.js`.

## Delivery tasks

- [x] Include `index.html` in the review inventory.
- [x] Verify public-only review data and cancellation in a real browser.
- [x] Run the mapped checks and record exact commit evidence.
- [x] Add static GitHub Pages publishing instructions to the review dialog.
- [x] Add a copyable multi-provider AI-assistant prompt to the review dialog.
