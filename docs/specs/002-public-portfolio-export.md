# SPEC-002 — Export a Public Portfolio Package

## Problem and user

A user needs to publish a static portfolio without accidentally disclosing
private profile fields, hidden items, private project JSON, or unrelated media.

## Scope

In scope: publication review, explicit contact/item selection, local ZIP
generation, referenced public assets, root/subpath hosting compatibility.

Out of scope: ZenID-hosted deployment, analytics, authentication, and private
project backup.

## Business rules

- BR-001: Only explicitly public contacts and items enter the package.
- BR-002: Hidden item text and media never enter HTML or ZIP files.
- BR-003: Private source JSON and `.zenid` data never enter the public package.
- BR-004: Publication requires a final review listing public contacts and files.
- BR-005: The exported site has no runtime JavaScript/CSS network dependency.

## Acceptance criteria

- AC-001: A private phone number and hidden project are absent from every
  exported file.
- AC-002: Published text is HTML-escaped.
- AC-003: Every local reference resolves to a file in the ZIP at root and
  subpath hosts.
- AC-004: The review dialog lists every public contact and packaged file before
  export.
- AC-005: Cancelling review creates no download.

## Verification mapping

- AC-001–AC-004: partially covered by `portfolioSiteExport.test.js`.
- AC-004 UI and AC-005: browser E2E missing.
