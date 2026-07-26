# SPEC-008 Evidence

Status: Automatically verified and creator accepted

Tested implementation commit:
`4b025d506066b06b52ef27de0aebe7373b8b10d7`

## Acceptance mapping

- AC-001: Chromium changes the document-root `lang` through the accessible
  TR/EN control, retains the device-local choice across reload, and presents
  Turkish Dashboard, Portfolio, and ZenPDF route chrome.
- AC-002: normalization tests prove supported regional tags collapse to `tr`
  or `en` and unsupported/missing document values fall back to English.
- AC-003: unit and browser export cases prove Turkish résumé headings, `Tem
  2026`, `Devam ediyor`, and the `_CV.pdf` filename while retaining English
  output as the default.
- AC-004: the static portfolio ZIP test proves `lang="tr"`, Turkish navigation,
  calls to action, headings, and contact chrome. The visible React preview uses
  the same output-copy source.
- AC-005: schema and browser tests retain exact synthetic user-authored text
  while changing résumé and portfolio output language.
- AC-006: the existing per-résumé stable-ID targeted-wording layer remains the
  lazy override surface for Experience and Project descriptions. Language
  selection does not duplicate the canonical profile or require an override.
- AC-007: schema normalization, project-file regression tests, and fresh-process
  `.zenid` save/restore retain the schema-3 project boundary. Existing projects
  without supported language values normalize to English.
- AC-008: the complete browser matrix, accessibility gate, root/subpath builds,
  unit suite, and lint pass.

## Commit-scoped verification

From `frontend/pdf-editor`:

- `npm test` — passed, 14/14 test files.
- `npm run lint` — passed with no findings.
- `npm run build` — passed root build, asset-path, and SPA-fallback checks.
- `npm run build:subpath` — passed `/zenid/` build, asset-path, and SPA-fallback
  checks.
- `npm run test:e2e -- --workers=1` — 57 passed, 6 intentionally
  project-scoped skips, 0 failures across 63 scheduled cases.
- Targeted SPEC-008 Chromium journey — 2/2 passed.
- `.zenid` save/restore scripts — passed in fresh processes with schema 3,
  Unicode synthetic identity, all profile collections, and one restored PDF
  page.
- `git diff --check` — passed.

## Finding resolved during QA

The first full browser matrix found one serious automated contrast failure on
the selected 12 px language button: white text on the initial amber background
measured 3.19:1. The selected background was darkened, the targeted WCAG gate
then passed, and the complete 63-case matrix passed on rerun.

## Creator acceptance

On 2026-07-26 the creator exercised the implementation from the local
development deployment on their computer and reported that the TR/EN behavior
worked, looked good, and was ready in its current form. The browser and version
were not captured and are not inferred.

This is creator acceptance of the localized interface and observed behavior. It
does not claim an independent professional translation audit or change the
production deployment, which remains on Sites version 6 pending explicit
deployment approval.
