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

## Deferred decisions

- Which AI clients and plugin packaging formats are supported first?
- Does the AI return a complete new `.zenid` file or a smaller change proposal?
- Which factual and privacy checks are required before an AI-edited project is
  accepted?

These decisions will be clarified only when this deferred feature reaches its
implementation phase.
