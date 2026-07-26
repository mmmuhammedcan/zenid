# SPEC-007 — Browser Release Hardening

Status: Implemented and automatically verified
Owner: Creator
Last clarified: 2026-07-26

## Problem

ZenID's core local workflows are implemented and Chromium-verified, but release
confidence is still uneven across browser engines, mobile viewports,
accessibility checks, ZenPDF navigation/export, and static application hosting.

## Scope

In scope:

- repeatable Chromium, Firefox, and WebKit browser projects;
- a focused mobile Chromium release project;
- automated WCAG 2.2 A/AA serious/critical checks on the four application
  routes;
- ZenPDF multi-page navigation and local export regression coverage;
- root and configurable-subpath production builds;
- a documented SPA fallback artifact for static hosts.

Out of scope: selecting or mutating a production hosting account, custom
domains, analytics, cloud persistence, and physical low-memory validation
deferred by D-013.

## Business rules

- BR-001: Cross-browser failures are release evidence, not optional diagnostics.
- BR-002: Accessibility automation supplements rather than replaces manual
  keyboard, screen-reader, zoom, and contrast acceptance.
- BR-003: Browser tests use only synthetic documents and identities.
- BR-004: ZenPDF export remains local and preserves the source page count.
- BR-005: One source build supports root hosting and an explicit subpath without
  hard-coded root asset URLs.
- BR-006: Deep links have a deployable SPA fallback artifact; a successful Vite
  build alone is not provider acceptance.
- BR-007: ZenPDF remains desktop-first. A narrow viewport may change the initial
  canvas scale and layout containment, but must not change the normal desktop
  initial scale or authoring controls.

## Acceptance criteria

- AC-001: The critical release suite passes in Chromium, Firefox, and WebKit.
- AC-002: Core routes have no serious or critical automated WCAG 2.2 A/AA
  violations in desktop Chromium.
- AC-003: Core routes render without horizontal document overflow at the
  supported mobile viewport.
- AC-004: A synthetic two-page PDF loads locally, navigates between pages, and
  exports a readable two-page PDF without a request containing document data.
- AC-005: Root and `/zenid/` production builds reference assets under their
  configured bases and contain an SPA fallback.
- AC-006: Dependency audit findings are either fixed or explicitly mapped to
  unreachable application features with a dated decision.
- AC-007: A newly opened ZenPDF page fits within a supported mobile viewport
  without horizontal page clipping, while the desktop release viewport still
  opens the page at 100%.

## Deployment decision

- Q-001: Resolved by D-018 for initial acceptance. ChatGPT Sites is the
  provider, its generated owner-only address is the initial URL, and a custom
  domain remains deferred. Provider-ready artifacts alone still do not prove
  production acceptance.
