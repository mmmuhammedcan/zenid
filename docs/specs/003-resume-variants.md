# SPEC-003 — Resume Variants from One Profile

Status: In progress
Owner: Creator
Last clarified: 2026-07-25

## Problem and user

A user needs multiple targeted resumes without duplicating reusable facts or
accidentally changing another document's presentation.

## Current delivery scope

Implemented today: variant name, template, accent color, and section order over
one shared profile.

Per-variant inclusion for Experience and Projects is automatically verified.
The current slice adds targeted wording for only Experience and Project
descriptions.

## Business rules

- BR-001: Editing a shared factual field updates the canonical profile.
- BR-002: Renaming, recoloring, reordering, or changing one resume template
  affects only that resume.
- BR-003: Duplicating a resume copies presentation configuration and creates a
  new stable ID.
- BR-004: A project always contains at least one resume.
- BR-005: Future targeted wording must be stored as an explicit override and
  must never overwrite the shared factual source silently.
- BR-006: Editing always uses the complete canonical profile. Variant
  selections filter preview and export output only; hiding an item must not
  delete or rewrite it.
- BR-007: A missing selection key means every canonical item is included. An
  explicit empty list means no item in that section is included. Canonical item
  order is preserved.
- BR-008: A newly created item remains visible in the active variant. Other
  variants with explicit allowlists do not gain it automatically; variants
  without an allowlist continue to include all items.
- BR-009: Activating selection semantics requires schema v2 and a sequential
  v1-to-v2 migration so older ZenID releases reject the newer behavior instead
  of silently producing different output.
- BR-010: A wording override is a sparse field-level replacement keyed by the
  canonical item's stable ID. The first allowlist contains only
  `experience[id].description` and `projects[id].description`.
- BR-011: Missing override properties use the current canonical description. A
  present string, including an empty string, replaces it only in that variant's
  output. **Use shared wording** removes the property.
- BR-012: Canonical and targeted descriptions remain visibly separate in the
  editor. Company, role, dates, tools, project name, technology, metrics, and
  links cannot be overridden in this slice.
- BR-013: Output applies supported overrides before item selection. Deleting a
  canonical item removes its override from every résumé; imported orphan
  overrides are retained but ignored.
- BR-014: Activating override semantics requires schema v3 and a sequential
  v2-to-v3 migration. Newly semantic Experience/Project override branches from
  v2 are reset while unknown future branches remain preserved.

## Acceptance criteria

- AC-001: Two variants can have different names, templates, colors, and section
  orders while sharing one profile.
- AC-002: Changing a shared company name is visible in both variants.
- AC-003: Deleting the last resume is rejected.
- AC-004: Duplicating a resume preserves presentation but creates a new ID.
- AC-005: Experience and Project inclusion can differ between two variants
  without changing the canonical profile or the other variant.
- AC-006: Variant selection is identical in design preview, ATS PDF
  preview/export, generated project PDFs, and a generated portfolio résumé.
- AC-007: Saving and reopening a `.zenid` project preserves each variant's
  selections; migrated v1 projects include all existing items.
- AC-008: Duplicating a variant copies its selections while assigning a new ID
  and generated name.
- AC-009: A non-empty or explicitly empty Experience/Project description
  override changes only the active variant output and never the canonical
  profile or another variant.
- AC-010: The UI shows the current shared description beside targeted wording,
  and **Use shared wording** returns output to the latest canonical value.
- AC-011: Duplicate/save/reopen preserve overrides; deleting the canonical item
  removes its overrides from all variants.
- AC-012: Design preview, ATS PDF preview/export, archived generated PDFs, and
  the selected generated portfolio résumé use the same override, while
  portfolio page content remains canonical.

## Open questions

- Q-001 — Resolved: The next slice includes per-variant Experience and Project
  selection.
- Q-002 — Resolved: Overrides are allowlisted field-level replacements keyed by
  stable item ID. The first slice supports only Experience and Project
  descriptions.
- Q-003: Must the Modern design preview have a matching non-ATS PDF, or is the
  explicitly presented single-column ATS export the only download?

## Verification mapping

- AC-001–AC-005 and AC-007–AC-011: schema, migration, materialization, and
  round-trip unit tests.
- AC-005–AC-007 and AC-009–AC-012: browser E2E for variant switching, output
  parity, targeted/shared reset, and local `.zenid` reopen.
- Q-003: not part of this slice.
