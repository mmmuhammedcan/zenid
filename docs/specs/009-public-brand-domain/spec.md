# SPEC-009 — Public Brand, Domain, and Search Foundation

Status: Implemented and automatically verified; Search Console gate open
Owner: Creator
Last clarified: 2026-07-26

## Problem and user

ZenID has completed cross-device acceptance on a generated hosting URL, but
that address is not suitable as the product's durable public identity. The
creator wants to preserve the intentionally selected ZenID name, publish from
an independently controlled hosting account, use a short HTTPS domain, and
give search engines a clear, indexable description of the product.

The brand is:

> ZenID — Your local identity workspace.

The canonical public domain is `https://getzenid.com/`.

## Scope

In scope:

- a creator-owned Cloudflare Pages production project;
- `getzenid.com` as the canonical apex domain and `www.getzenid.com` as a
  redirect or alias;
- automatic HTTPS through the hosting provider;
- indexable title, description, canonical, social metadata, `robots.txt`, and
  a root sitemap;
- preservation of the local-only privacy model and all root SPA routes;
- keeping the accepted generated Sites deployment available until the custom
  domain cutover is verified.

Out of scope:

- guaranteeing a particular Google ranking or indexing time;
- renaming ZenID;
- analytics, tracking scripts, cookies, advertising, accounts, or a backend;
- buying SEO links or using deceptive search practices;
- publishing private `.zenid` project data.

## Business rules

- BR-001: ZenID remains the product name. The public strapline is “Your local
  identity workspace.”
- BR-002: The canonical public origin is `https://getzenid.com`.
- BR-003: Hosting remains stateless. Resume, portfolio, PDF, and project data
  stay in the visitor's browser.
- BR-004: Search metadata may describe product capabilities but must not add
  analytics, trackers, remote fonts, or other runtime dependencies.
- BR-005: The generated Sites URL remains a rollback path until the creator
  accepts the custom-domain deployment.
- BR-006: Search Console submission is a discovery request, not evidence of a
  guaranteed ranking.

## Acceptance criteria

- AC-001: The built root document declares the approved title, description,
  canonical HTTPS origin, and social sharing metadata.
- AC-002: The production bundle contains a permissive `robots.txt` that names
  the canonical sitemap and a valid sitemap containing the canonical root URL.
- AC-003: `/`, `/resume`, `/portfolio`, and `/editor` remain directly
  loadable on Cloudflare Pages without changing local workspace behavior.
- AC-004: The dashboard presents the approved strapline accessibly in English
  and an equivalent localized line in Turkish.
- AC-005: The Cloudflare Pages deployment contains only the reviewed static
  application artifact and does not introduce a server-side project-data
  endpoint.
- AC-006: `getzenid.com` and `www.getzenid.com` serve the accepted deployment
  over HTTPS, with one canonical variant.
- AC-007: The creator can verify domain ownership in Google Search Console and
  submit the root sitemap after DNS cutover.

## Resolved questions

- Q-001: Keep the ZenID name despite unrelated projects using the same name.
- Q-002: Use `getzenid.com`; a product descriptor differentiates the brand in
  search without narrowing the product name to CV creation.
- Q-003: Use Cloudflare Pages instead of Netlify or GitHub Pages for the
  creator-owned static deployment; static asset requests fit the free Pages
  model and the provider can be replaced later.
