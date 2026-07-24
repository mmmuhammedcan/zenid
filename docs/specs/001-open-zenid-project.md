# SPEC-001 — Open ZenID Project Locally

## Problem and user

A user needs to reopen an editable private ZenID workspace without uploading
the project or damaging the current browser workspace when the file is invalid.

## Scope

In scope: local `.zenid` selection, compatibility validation, profile/resume/
portfolio restoration, referenced media import, and observable error handling.

Out of scope: cloud sync, editing the selected source file, cross-device
transfer, and automatic recovery of unsupported future schemas.

## Business rules

- BR-001: Opening a file reads a local working copy; it never modifies the
  selected file.
- BR-002: A supported valid project restores all canonical project data.
- BR-003: A newer or unsupported schema is rejected rather than partially
  normalized.
- BR-004: A failed import leaves the current workspace unchanged.
- BR-005: Imported media and project state commit atomically from the user's
  perspective.
- BR-006: Opening a project performs no project-data network upload.

## Acceptance criteria

### AC-001 — Valid project

Given a valid schema-v1 `.zenid` project with referenced media, when the user
confirms opening it, then profile, resumes, portfolio, and media are restored,
the UI reports local success, and the source file remains unchanged.

### AC-002 — Newer project

Given a project created by a newer schema, when it is opened, then ZenID shows a
compatibility message and the current workspace and media remain unchanged.

### AC-003 — Unsafe or oversized archive

Given an archive with an unsafe path, invalid media, or an exceeded resource
limit, when it is opened, then ZenID rejects it without partial persistence.

### AC-004 — No upload

Given any local project open attempt, when the operation completes or fails,
then no HTTP request contains project bytes, profile data, or media.

## Non-functional requirements

- Compressed input limit: 25 MB.
- Per-media limit: 8 MB.
- Expanded-data processing must enforce a safe upper bound without first
  materializing an unbounded archive.
- Error messages must be actionable and must not expose stack traces.

## Resolved decisions

- Q-001: A project with a missing or invalid referenced media item fails
  atomically. The current workspace remains unchanged. See D-005.

## Open questions

- Q-002: What browser memory budget should replace the current post-unzip
  75 MB check? Owner: Engineering.

## Verification mapping

- AC-001: `projectFile.test.js`, `projectSchema.test.js`, future browser E2E.
- AC-002: `projectSchema.test.js`, future import atomicity test.
- AC-003: `projectFile.test.js` covers missing/invalid media and unsafe paths;
  expanded-data resource-limit coverage remains missing.
- AC-004: missing browser network-observation test.
