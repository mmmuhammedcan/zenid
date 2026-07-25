# SPEC-002 — Export a Public Portfolio Package

Status: In progress
Owner: Creator
Last clarified: 2026-07-25

## Problem and user

A user needs to publish a static portfolio without accidentally disclosing
private profile fields, hidden items, private project JSON, or unrelated media.

## Scope

In scope: publication review, explicit contact/item selection, local ZIP
generation, referenced public assets, root/subpath hosting compatibility.

Out of scope: ZenID-hosted deployment, provider accounts or tokens, analytics,
authentication, and private project backup. Publishing instructions or a
provider integration require a separate follow-up spec and decision.

## Business rules

- BR-001: Only explicitly public contacts and items enter the package.
- BR-002: Hidden item text and media never enter HTML or ZIP files.
- BR-003: Private source JSON and `.zenid` data never enter the public package.
- BR-004: Publication requires a final review listing public contacts and files.
- BR-005: The exported site has no runtime JavaScript/CSS network dependency.
- BR-006: A generated résumé applies portfolio contact and hidden-item privacy.
  An uploaded résumé is an explicitly selected opaque public file whose contents
  ZenID does not rewrite.

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

## Verification mapping

- AC-001–AC-004: `portfolioSiteExport.test.js`.
- AC-004 UI and AC-005: `e2e/spec002-public-portfolio-export.spec.js`.

## Delivery tasks

- [x] Include `index.html` in the review inventory.
- [x] Verify public-only review data and cancellation in a real browser.
- [ ] Run the mapped checks and record exact commit evidence.
