# SPEC-005 — AI-Compatible ZenID Projects

Status: Product direction accepted; implementation deferred
Owner: Creator
Last clarified: 2026-07-25

## Problem

A user may want Claude, Codex, or another compatible AI they already use to
help prepare a targeted resume without ZenID operating an AI model, storing the
user's professional data, creating a ZenID account, or receiving an API key.

## Accepted direction

```text
Create the professional profile in ZenID
        ↓
Save the private .zenid project
        ↓
Open it with the user's Claude/Codex through a ZenID plugin
        ↓
Ask the AI to prepare or review a resume
        ↓
Receive an updated AI-compatible .zenid project
        ↓
Open it in ZenID, review it, and export the resume/portfolio
```

ZenID does not connect to or host the model. The user's AI learns the `.zenid`
format and ZenID's editing rules.

## Plugin purpose

The future plugin should teach a compatible AI:

- how to read and produce a valid `.zenid` project;
- how profile facts, resume presentation, and portfolio publication differ;
- never to invent or silently change the user's factual history;
- how to prepare a job-specific resume from supplied evidence;
- which concrete ATS readability checks are supportable;
- how to return a project that ZenID can validate and reopen.

## Product rules

- ZenID remains fully useful without AI.
- ZenID does not require a model-provider API key or ZenID account.
- ZenID does not upload the `.zenid` project to an AI provider.
- The user chooses whether to give the file to their own AI provider.
- After that choice, the selected provider's data terms apply.
- ZenID must state this boundary briefly and clearly.
- The returned project must pass the normal `.zenid` compatibility and safety
  checks before it replaces the browser working copy.
- Job listing, matching, and fake-listing detection belong to a possible
  separate opt-in ZenID Jobs product, not the local ZenID core.

## Deferred decisions — resolved by SPEC-011

These three questions are answered in
`docs/specs/011-zenid-mcp-plugin/spec.md` and the decision log:

- Which AI clients and plugin packaging formats are supported first?
  **D-024** — a locally run stdio MCP server for the user's own agent client.
  **D-027** — shipped from `packages/zenid-mcp` in this repository.
- Does the AI return a complete new `.zenid` file or a smaller change proposal?
  **D-025** — typed per-field edits on a validated in-memory project, with an
  explicit separate save.
- Which factual and privacy checks are required before an AI-edited project is
  accepted? **D-026** — presentation edits are separated from fact edits,
  factual changes report old and new values, and no tool may widen the
  publication scope.

SPEC-011 owns the implementation of this feature. SPEC-005 remains the record
of the product direction and its privacy boundary.
