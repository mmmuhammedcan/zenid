# SPEC-010 — Bilingual Search and AI Discovery

Status: Implemented and automatically verified; production and Search Console gates open
Owner: Creator
Last clarified: 2026-07-27

## Problem and user

ZenID has a durable public domain and a distinctive brand promise, but every
application route identifies the canonical root and the site has no
capability-specific public content. People searching in Turkish or English for
CV/resume preparation, portfolio creation, or private PDF editing cannot yet
discover a page whose primary language and useful content match that intent.
Search-backed AI assistants also need crawlable, accurate public product facts
that remain separate from model-training permission.

ZenID must preserve the public brand:

> ZenID — Your local identity workspace.

The first search-discovery slice should help Turkish and English users
understand and open ZenID's three existing local, account-free workflows.

## Scope

In scope:

- Turkish pages for `/tr/cv-hazirlama/`, `/tr/portfolyo-hazirlama/`, and
  `/tr/pdf-duzenleme/`;
- English pages for `/en/resume-builder/`, `/en/portfolio-builder/`, and
  `/en/private-pdf-editor/`;
- unique language-matched titles, descriptions, canonicals, headings, and
  social metadata;
- useful capability-specific content explaining each workflow and its privacy
  boundary;
- direct calls to action into the existing `/resume`, `/portfolio`, and
  `/editor` applications;
- a static build shell that remains meaningful before JavaScript runs;
- reciprocal language alternates, sitemap inclusion, and internal discovery;
- accurate `WebApplication` structured data;
- an optional `/llms.txt` product summary using the emerging convention;
- explicit search-crawler access without granting AI-training permission;
- automated build and browser evidence plus a production smoke test.

Out of scope:

- guaranteeing indexing position or first-page ranking;
- keyword stuffing, doorway-page networks, bought links, or deceptive copy;
- changing the ZenID name or “Your local identity workspace.” strapline;
- analytics, cookies, accounts, or server-side personal-data processing;
- claims that `llms.txt` is an official ranking factor or universally consumed;
- editorial content beyond the six bounded workflow pages.

## Business rules

- BR-001: The root page retains the approved ZenID brand title and strapline.
- BR-002: Search copy describes only shipped behavior: account-free local
  editing, ATS-friendly PDF output, reusable professional profile data, and
  user-owned `.zenid` projects.
- BR-003: Every page is written for a person completing that workflow, not for
  a search crawler. Target phrases appear naturally in useful headings and
  copy.
- BR-004: The landing page collects no data and introduces no remote runtime
  dependency.
- BR-005: “Ücretsiz” describes the current free local product and must be
  revised if that product boundary changes.
- BR-006: Search Console submission is evidence of a discovery request, not
  ranking acceptance.
- BR-007: Search-oriented crawlers may read public product pages. GPTBot and
  equivalent training-oriented access remain disallowed; private workspace
  data is never public or crawlable.
- BR-008: `llms.txt` is supplemental machine-readable orientation, not a
  substitute for useful HTML, sitemap discovery, or crawler access.

## Acceptance criteria

- AC-001: All six discovery routes have the correct `lang`, unique descriptive
  titles and descriptions, and self-referencing canonical HTTPS URLs in built
  HTML.
- AC-002: Every built route contains a meaningful language-matched H1 and
  capability-specific helpful content before JavaScript executes.
- AC-003: CV/resume pages explain ATS-friendly preparation; portfolio pages
  explain explicit publication controls; PDF pages accurately describe local
  fill-and-sign behavior. Copy contains no unsupported claims or repetitive
  keyword stuffing.
- AC-004: Clear calls to action open `/resume`, `/portfolio`, or `/editor`
  without creating an account or server data flow.
- AC-005: The root page retains “ZenID — Your local identity workspace.” and
  `https://getzenid.com/` as canonical.
- AC-006: Each Turkish/English page pair declares reciprocal `hreflang`
  alternates and all six canonical URLs appear in the sitemap.
- AC-007: Built pages contain accurate `WebApplication` structured data.
- AC-008: `/llms.txt` returns a concise bilingual product summary and canonical
  links while robots explicitly allows OAI-SearchBot and disallows GPTBot.
- AC-009: Automated unit/build and browser tests verify static shells,
  metadata, content, CTAs, crawler files, and existing application regressions.
- AC-010: All deployed routes return HTTPS 200 and the creator can submit the
  updated sitemap and request indexing in Search Console.

## Deferred decisions

- Q-001: Whether later editorial guidance belongs inside the application or a
  separate content section.
- Q-002: Whether additional languages have enough creator-reviewed copy to
  justify their own paired pages.
