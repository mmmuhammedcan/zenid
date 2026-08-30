# SPEC-012 — Sponsor Support Link

Status: Clarified; implementation in progress
Owner: Creator
Last clarified: 2026-07-27

## Problem and user

The creator wants a sustainable way to fund continued ZenID work without
compromising ZenID's local-first, no-tracking, no-payment-collection posture.
The creator has applied to and been approved for GitHub Sponsors
(`https://github.com/sponsors/mmmuhammedcan`, approval confirmed by GitHub's
"Your GitHub Sponsors profile is live" email, 2026-07-27).

## Scope

In scope:

- a `.github/FUNDING.yml` entry so GitHub renders the official "Sponsor"
  button on the repository;
- a visible, bilingual (Turkish/English) "Support ZenID" / "Projeyi Destekle"
  link in the app dashboard pointing to the GitHub Sponsors page;
- the link opens in a new tab and never collects or transmits payment,
  identity, or tax data through ZenID itself.

Out of scope:

- any in-app payment form, card handling, or stored payment data;
- iyzico Link or Buy Me a Coffee integration (rejected: iyzico charges a
  ~4.49% + 0.25 TL transaction fee and frames the payment as a product/service
  sale rather than sponsorship; Buy Me a Coffee's payout countries do not
  currently list Turkey);
- guaranteeing any sponsor count or income;
- tax or legal advice — sponsorship income tax treatment is the creator's own
  responsibility, not ZenID's.

## Business rules

- BR-001: ZenID never collects, stores, or transmits payment, banking, or tax
  data. All payment handling happens on GitHub/Stripe's side, off ZenID's
  origin.
- BR-002: The public-facing wording is "Support ZenID" / "Projeyi Destekle" —
  not "donation" / "bağış" — since GitHub Sponsors payments are not framed as
  tax-deductible charitable donations.
- BR-003: The sponsor link is a plain external anchor (`target="_blank"`,
  `rel="noopener noreferrer"`), consistent with other outbound links in the
  app, and adds no analytics, tracking pixel, or third-party script.
- BR-004: The link is available in both supported locales (`en`, `tr`) through
  the existing `localization.js` dictionary.

## Acceptance criteria

- AC-001: `.github/FUNDING.yml` contains `github: [mmmuhammedcan]`, so GitHub
  shows the built-in "Sponsor" button on the repository page.
- AC-002: The Dashboard renders a "Support ZenID" (English) / "Projeyi
  Destekle" (Turkish) link to `https://github.com/sponsors/mmmuhammedcan` with
  `target="_blank"` and `rel="noopener noreferrer"`.
- AC-003: `localization.js` maps the English source string to the correct
  Turkish string, and `localization.test.js` asserts both directions.
- AC-004: No new network request, script tag, or tracking dependency is
  introduced; the link is a static anchor.

## Resolved questions

- Q-001: GitHub Sponsors chosen over iyzico Link and Buy Me a Coffee — Turkey
  is a supported Sponsors payout country, ZenID never touches payment data,
  and there is no per-transaction fee to ZenID or the sponsor (Q-001 decided
  before this spec was written; approval confirmed 2026-07-27).
- Q-002: Wording is "Support ZenID" / "Projeyi Destekle", not "donate" /
  "bağış", to avoid implying tax-deductible charitable status.
