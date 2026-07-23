# SPEC-003 — Resume Variants from One Profile

## Problem and user

A user needs multiple targeted resumes without duplicating reusable facts or
accidentally changing another document's presentation.

## Current scope

Implemented today: variant name, template, accent color, and section order over
one shared profile.

Not implemented: per-variant item selection and `contentOverrides`.

## Business rules

- BR-001: Editing a shared factual field updates the canonical profile.
- BR-002: Renaming, recoloring, reordering, or changing one resume template
  affects only that resume.
- BR-003: Duplicating a resume copies presentation configuration and creates a
  new stable ID.
- BR-004: A project always contains at least one resume.
- BR-005: Future targeted wording must be stored as an explicit override and
  must never overwrite the shared factual source silently.

## Acceptance criteria

- AC-001: Two variants can have different names, templates, colors, and section
  orders while sharing one profile.
- AC-002: Changing a shared company name is visible in both variants.
- AC-003: Deleting the last resume is rejected.
- AC-004: Duplicating a resume preserves presentation but creates a new ID.

## Open questions

- Q-001: Does the next release require per-variant item selection?
- Q-002: Should a content override replace a whole item, individual fields, or
  store a patch against the canonical item?
- Q-003: Must the Modern design preview have a matching non-ATS PDF, or is the
  explicitly presented single-column ATS export the only download?

## Verification mapping

- AC-001–AC-004: utility coverage exists in `projectSchema.test.js`.
- Full user workflow and future override behavior: missing.
