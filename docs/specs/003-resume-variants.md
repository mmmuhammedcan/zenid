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

This slice adds per-variant inclusion for Experience and Projects. Targeted
wording through `contentOverrides` remains deferred.

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

## Open questions

- Q-001 — Resolved: The next slice includes per-variant Experience and Project
  selection.
- Q-002 — Deferred: Should a content override replace a whole item, individual fields, or
  store a patch against the canonical item?
- Q-003: Must the Modern design preview have a matching non-ATS PDF, or is the
  explicitly presented single-column ATS export the only download?

## Verification mapping

- AC-001–AC-005 and AC-007–AC-008: schema, migration, materialization, and
  round-trip unit tests.
- AC-005–AC-007: browser E2E for variant switching, output parity, and local
  `.zenid` reopen.
- Future override behavior and Q-003: not part of this slice.
