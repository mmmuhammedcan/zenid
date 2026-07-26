# SPEC-008 — Turkish and English Workspace Localization

Status: Implemented, automatically verified, and creator accepted
Owner: Creator
Last clarified: 2026-07-26

## Problem and user

ZenID currently presents an English-only interface and emits English fixed
labels even though users can enter Unicode Turkish content. A user who wants a
Turkish résumé or portfolio should not have to translate application controls,
dates, or generated section labels, and a user who wants English should retain
the established English behavior.

The language choice must not pretend to translate user-authored professional
claims. ZenID preserves what the user writes and localizes only application
copy, fixed output labels, and locale-aware formatting.

## Scope

In scope:

- an accessible Turkish/English application-language control;
- browser-language initialization and a device-local remembered preference;
- Turkish application navigation and the core Resume, Portfolio, and ZenPDF
  workflows;
- an independent output language on each résumé document and portfolio;
- localized résumé preview/PDF and portfolio preview/static ZIP chrome;
- lazy per-document content overrides that reuse canonical profile facts and
  appear only when the user creates or edits a language variant;
- preservation of existing English `.zenid` projects and exports.

Out of scope:

- automatic or hosted translation;
- language detection or policing of user-authored text;
- translating company, school, product, skill, or proper names;
- requiring both language versions before export;
- locale-specific legal or résumé-content advice.

## Business rules

- BR-001: The interface language and each document's output language are
  independent choices.
- BR-002: Changing language never sends project data to a server.
- BR-003: ZenID localizes its own labels and formatting but preserves
  user-authored text exactly.
- BR-004: Canonical facts are entered once. A résumé or portfolio may override
  only language-dependent text while continuing to reference stable canonical
  item identifiers.
- BR-005: Language-specific fields are progressive disclosure. A user preparing
  one language is not required to populate or view another.
- BR-006: Existing projects without an explicit supported language continue as
  English without data loss.
- BR-007: Unsupported language values normalize safely to English.
- BR-008: A generated page declares the chosen language so assistive
  technologies use the appropriate pronunciation rules.

## Acceptance criteria

- AC-001: A keyboard and screen-reader operable TR/EN control changes the
  application and document-root language and survives reload on the same
  device. Résumé and portfolio output languages remain independent explicit
  choices.
- AC-002: English remains the fallback for an existing project or unsupported
  locale.
- AC-003: A Turkish résumé preview and PDF use Turkish fixed section labels,
  Turkish month names, and `Devam ediyor`; English output remains unchanged.
- AC-004: A Turkish portfolio preview and static ZIP use Turkish navigation,
  calls to action, empty states, and `lang="tr"`; English output remains
  unchanged.
- AC-005: Changing a résumé or portfolio output language does not rewrite
  user-authored profile content.
- AC-006: A language variant can override supported narrative fields by stable
  item ID without duplicating neutral facts, and reset falls back to the shared
  profile value.
- AC-007: `.zenid` save/open round trips preserve interface-independent résumé
  and portfolio language selections and localized overrides.
- AC-008: Core TR/EN routes retain the existing automated accessibility,
  privacy, build, and browser regression gates.

## Resolved questions

- Q-001: D-021 selects lazy localized overlays rather than duplicate profiles.
- Q-002: User-authored language is not validated or automatically translated.
