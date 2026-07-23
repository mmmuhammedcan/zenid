# SPEC-004 — ZenPDF Fill and Sign

## Problem and user

A user needs to fill a job, internship, university, or onboarding form locally
and export it without flattening or damaging the original PDF content.

## Scope

In scope: PDF/image input, click-to-place text/marks/images/visual signatures,
per-page annotations, undo/redo, page navigation, and local export.

Out of scope: certificate-backed signatures, AcroForm editing, collaboration,
page management, and editable cross-device sessions.

## Business rules

- BR-001: A normal PDF export preserves source pages and adds transparent
  overlays.
- BR-002: A saved page's annotations must finish restoring before the page is
  reported ready or exported.
- BR-003: Only one page transition or export may mutate/read the live document
  canvas at a time.
- BR-004: Replacing a document with annotations requires confirmation.
- BR-005: Drawn signatures are described as visual marks, not secure digital
  signatures.

## Acceptance criteria

### AC-001 — Restore before ready

Given page 2 has multiple saved annotations, when the user navigates to page 2,
then all annotations are restored before the status becomes “Document ready”
and before export is enabled.

### AC-002 — Prevent concurrent transition

Given a page transition is in progress, when the user activates another page
navigation control, then no second transition starts.

### AC-003 — Export preservation

Given a PDF with selectable text, dimensions, and existing form data, when
annotations are exported, then the source page count/dimensions/content remain
and the overlay is visible.

### AC-004 — Restore failure

Given saved Fabric JSON cannot be restored, when the page is opened, then the
UI shows an error, export remains unavailable for that transition, and ZenPDF
does not report the page ready.

## Verification mapping

- AC-001/AC-002/AC-004: async unit regression plus future browser E2E.
- AC-003: partial utility coverage in `pdfExport.test.js`; browser acceptance
  remains missing.
