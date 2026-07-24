# ZenID Engineering Transformation Roadmap

Status: Proposed  
Created: 2026-07-23  
Execution: Not started  
Decision owner: Creator

## 1. Purpose

This document describes how ZenID can move from a fast AI-assisted prototype
into a verifiable, maintainable, privacy-first product without rewriting working
features merely to appear more "enterprise".

The transformation is intentionally incremental:

```text
Product intent
  -> Feature specification
  -> Technical plan
  -> Executable tasks
  -> Tests and implementation
  -> Independent verification
  -> Human acceptance
  -> Release evidence
```

No phase begins only because an agent says the previous phase is complete.
Every gate requires named evidence.

## 2. Is This Direction Appropriate for ZenID?

Yes, with one important qualification.

The current product direction is coherent:

- one user-owned professional profile;
- multiple resume documents derived from that profile;
- a public portfolio generated from explicitly selected information;
- a private `.zenid` project that remains on the user's device;
- ZenPDF as a supporting local fill-and-sign capability.

This is a defensible local-first product boundary. It has a clearer user job and
privacy promise than a broad collection of unrelated PDF/OCR/payment/browser
extension features.

However, describing the Python backend as "legacy" is a classification, not a
deletion decision. The backend must pass through the disposition gate in
Section 5 before it is archived, removed, or revived.

## 3. Transformation Principles

### P-001 — Product behavior is specified before implementation

Feature specs define the user problem, scope, rules, observable acceptance
criteria, failure behavior, privacy behavior, and non-functional requirements.
Technical choices belong in the implementation plan.

### P-002 — One source of truth per kind of information

- `README.md`: product entry point and development quick start.
- `plan.md`: product direction and high-level roadmap.
- `CLAUDE.md` / future `AGENTS.md`: short durable agent instructions.
- `docs/specs/`: feature behavior and delivery artifacts.
- `docs/decisions/`: durable decisions and their consequences.
- `docs/evidence/`: sanitized verification and release evidence.
- `creator_docs/`: ignored real-data creator acceptance material.

The same rule must not be copied into several files unless one file clearly
links to the authoritative source.

### P-003 — Deterministic evidence outranks agent confidence

Tests, build output, static analysis, security checks, performance measurements,
and reproducible manual checklists are evidence. An agent's written assurance is
not evidence.

### P-004 — Prefer one writer and independent reviewers

Only one agent owns implementation for a bounded change. Other agents may
review the spec, security, tests, or diff from fresh context. Multiple agents
must not edit the same working tree concurrently.

### P-005 — Local-first is a testable contract

"Local" must be verified through network observation, export inspection, storage
behavior, and failure recovery. It is not only marketing language.

### P-006 — Do not add infrastructure without a user requirement

A database, account system, hosted backend, orchestration framework, vector
database, or custom MCP server requires a concrete feature spec and measured
need.

## 4. Target Product Architecture

```text
Browser application
├── Canonical project domain
│   ├── profile
│   ├── resume configurations
│   ├── portfolio configuration
│   └── schema migrations
├── Local persistence
│   ├── localStorage: small recoverable draft state
│   ├── IndexedDB: media and larger local assets
│   └── .zenid: portable user-owned project
├── Local outputs
│   ├── ATS-friendly resume PDF
│   ├── public portfolio ZIP
│   └── ZenPDF filled PDF
├── Heavy processing boundary
│   └── Web Worker candidates: ZIP/PDF/image work
└── Optional future service boundary
    ├── AI analysis
    ├── encrypted sync
    ├── hosted publishing
    └── payment/account services
```

The basic product remains useful without the optional service boundary.
Anything crossing that boundary requires explicit consent and a data-flow spec.

## 5. Backend Disposition Gate

The existing Python backend must be assessed capability by capability.

### Option A — Retire and archive

Choose this when:

- no active React route calls the capability;
- the browser implementation satisfies the current product requirement;
- maintaining the capability adds dependency or security cost;
- no committed near-term feature requires it.

Expected action:

- preserve relevant decisions and fixtures;
- move code to an explicitly historical location or remove it in a dedicated
  reviewed change;
- remove dead dependencies and documentation;
- verify that the active product is unchanged.

### Option B — Keep as an isolated supporting tool

Choose this when:

- creator/internal OCR or scanning remains useful;
- it is not part of the shipped core product;
- operating it separately is clearer than pretending it belongs to the React
  architecture.

Expected action:

- separate entry point and README;
- explicit non-production/support status;
- isolated dependencies and tests;
- no accidental coupling to the core app.

### Option C — Rebuild as an optional service boundary

Choose this only when an accepted spec requires:

- AI analysis;
- hosted publishing;
- encrypted sync;
- accounts/payments;
- server-only document processing.

Expected action:

- threat model and data-flow diagram first;
- API contract and retention policy;
- authentication/authorization requirements;
- pytest and FastAPI contract tests;
- deployment, logging, deletion, and incident requirements.

### Current recommendation

Do not delete the backend now. Freeze feature work in it and perform a short
capability inventory during the transformation. Default to Option A or B.
Option C requires a future approved product spec.

## 6. Documentation Target

Feature documentation should grow by folder rather than turning one Markdown
file into a large mixed artifact:

```text
docs/
├── product/
│   ├── vision.md
│   ├── roadmap.md
│   └── glossary.md
├── engineering/
│   ├── constitution.md
│   ├── test-strategy.md
│   ├── security-baseline.md
│   ├── performance-budgets.md
│   └── zenid-engineering-transformation.md
├── decisions/
│   └── D-NNN-short-title.md
├── specs/
│   └── NNN-feature-name/
│       ├── spec.md
│       ├── plan.md
│       ├── tasks.md
│       ├── test-cases.md
│       ├── evidence.md
│       └── contracts/
├── evidence/
│   └── releases/
└── history/
```

Do not split a small spec merely because a folder structure exists. Keep
business rules and acceptance criteria together in `spec.md`. Add other files
only when they contain a distinct artifact:

- `plan.md`: architecture and technical choices;
- `tasks.md`: ordered executable work;
- `test-cases.md`: automated/manual scenario catalogue;
- `evidence.md`: commands, results, commit, and unresolved gaps;
- `contracts/`: schemas or machine-readable interfaces.

GitHub Spec Kit uses the same core separation of Spec -> Plan -> Tasks ->
Implement and provides optional clarify/checklist/analyze gates:

- https://github.github.com/spec-kit/
- https://github.github.com/spec-kit/reference/agentic-sdd.html

## 7. Feature Lifecycle and Gates

```text
Draft
  -> Clarification Needed
  -> Ready for Development
  -> In Progress
  -> Implemented
  -> Automatically Verified
  -> Manually Accepted
  -> Released
```

Recommended feature metadata:

```yaml
id: SPEC-001
status: draft
owner: creator
updated: 2026-07-23
risk: high
related_decisions:
  - D-002
verification:
  automated: partial
  manual: missing
```

### Ready for Development gate

- Problem and user are named.
- In-scope and out-of-scope behavior are explicit.
- Open product questions are closed or deliberately deferred.
- Happy path, error path, and boundary cases exist.
- Privacy/security/performance requirements are measurable.
- Acceptance criteria are observable.

### Automatically Verified gate

- Every required AC maps to an exact test name or automated check.
- Unit/component/integration/E2E layers are selected by behavior, not habit.
- Lint, test, and production build pass.
- Relevant security and performance checks pass.
- Known gaps remain visible.

### Manually Accepted gate

- A dated checklist identifies the environment and fixture.
- Creator acceptance may use real data under ignored `creator_docs/`.
- A sanitized result is recorded without committing personal data.
- Acceptance does not erase automated-test gaps.

## 8. Verification Stack

### Frontend

- Pure domain/file utilities: current `node:test` is acceptable.
- React components: Vitest plus Testing Library.
- Real browser behavior: Playwright Test.
- IndexedDB: component/integration tests plus real-browser coverage.
- PDF/ZIP round trips: synthetic fixtures in automated tests.
- Visual creator review: ignored `creator_docs/`.

Vitest is designed to work with Vite projects:

- https://vitest.dev/guide/

Playwright recommends testing user-visible behavior, isolated tests,
user-facing locators, web-first assertions, and CI execution:

- https://playwright.dev/docs/best-practices

### Python

Use pytest only if the backend passes the disposition gate and remains active.
For FastAPI, use `pytest` with `TestClient`/HTTPX contract tests:

- https://fastapi.tiangolo.com/tutorial/testing/

### Security

Use a scoped OWASP ASVS baseline rather than an unbounded "security review":

- architecture and threat modeling;
- validation, sanitization, and encoding;
- error handling;
- data protection;
- files and resources;
- API/configuration only if a backend remains.

References:

- https://owasp.org/www-project-application-security-verification-standard/
- https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html

### Performance

Set budgets after measuring representative fixtures on a named target device.
Relevant measurements include:

- initial route JavaScript;
- time to interactive;
- `.zenid` import time and main-thread blocking;
- memory during ZIP/PDF processing;
- PDF export time by page count;
- IndexedDB media restore time.

Performance tests must not use arbitrary thresholds or unstable CI timings as
release blockers before a baseline exists.

## 9. Delivery Pipeline

### Local fast loop

Target command:

```bash
npm run verify:fast
```

Expected checks:

- lint;
- unit tests;
- component tests;
- focused schema/file tests.

### Full pull-request gate

Target command:

```bash
npm run verify
```

Expected checks:

- fast loop;
- production build;
- synthetic `.zenid` round trip;
- Playwright Chromium acceptance suite;
- dependency/security checks;
- spec-to-test traceability check.

### Scheduled/deep gate

- cross-browser Playwright;
- large-file and performance corpus;
- accessibility scan plus keyboard flow;
- dependency audit;
- deeper security review.

### Release gate

- full automated gate;
- sanitized release evidence;
- creator real-data acceptance when relevant;
- known-risk review;
- release decision recorded.

CI should run deterministic commands. Agents may diagnose failures, but an agent
must not be the condition that determines whether CI passed.

## 10. Agent Operating Model

### Recommended model: one primary agent, gated reviewers

```text
Human product owner
        |
        v
Primary agent: spec/plan/task/implementation owner
        |
        +--> Deterministic verification pipeline
        |
        +--> Fresh-context test reviewer
        +--> Fresh-context security reviewer (high-risk changes)
        +--> Fresh-context architecture reviewer (structural changes)
        |
        v
Human acceptance and release decision
```

This is not a permanent "council". Review agents are invoked only when the
change risk justifies them.

### Why not let Cursor, Claude, and Codex all implement together?

- Duplicate context and token cost.
- Conflicting edits and architectural assumptions.
- Reviewers become biased when they co-authored the implementation.
- It becomes unclear which agent owns failed decisions.
- More prose is produced without more deterministic evidence.

Use provider/model diversity for independent review, not as a substitute for
tests. For ordinary features, one capable coding agent plus CI is enough.

### When parallel agents are justified

The work must split into independent, read-only or non-overlapping lanes:

- spec ambiguity review;
- threat-model review;
- test-gap analysis;
- dependency/documentation research;
- separate modules in isolated worktrees.

One primary owner synthesizes findings. Parallel agents must not share an
uncoordinated writable working tree.

### Subscription/tooling guidance

Do not pay for three overlapping tools merely to create an agent council.
Choose one primary environment based on where you work most effectively.
Retain a second provider only if its independent review or other product
features provide measurable value. Re-evaluate using monthly evidence:

- tasks completed;
- accepted changes;
- regressions caught;
- time saved;
- subscription/API cost.

## 11. Durable Agent Context Across Tools

The preferred neutral source is a concise root `AGENTS.md` containing:

- current product boundary;
- authoritative documents;
- spec-first workflow;
- required verification commands;
- privacy rules;
- destructive-action constraints;
- definition of done.

Provider-specific files should be thin adapters:

```text
AGENTS.md              # neutral authoritative engineering instructions
CLAUDE.md              # points to AGENTS.md; Claude-specific notes only
.cursor/rules/         # only path-scoped Cursor behavior
.codex/                # only Codex-specific configuration when needed
```

Cursor documents support for project rules and `AGENTS.md`, and its CLI also
reads root `AGENTS.md` and `CLAUDE.md`:

- https://docs.cursor.com/context/rules-for-ai
- https://docs.cursor.com/en/cli/using

Avoid copying the entire spec or roadmap into agent-rule files. Rules should
link to authoritative documents and stay short.

Baseline completed 2026-07-24: root `AGENTS.md` is authoritative and
`CLAUDE.md` is a thin adapter. Provider-specific rules remain unnecessary until
a concrete path-scoped requirement appears.

## 12. MCP Recommendations

MCP is for live external data or actions that the coding agent cannot obtain
reliably from repository files and normal commands. It is not a replacement for
specs, tests, or project rules.

### Recommended now

1. **GitHub integration/MCP — optional but useful**
   - Use when issues, pull requests, review threads, or CI status become the
     delivery source of truth.
   - Do not add it only to browse a local repository.

2. **Playwright browser tooling — recommended**
   - Use Playwright Test as the deterministic E2E runner.
   - MCP/browser control may help exploratory QA and test authoring.
   - CI must run committed Playwright tests, not depend on an agent manually
     clicking the UI.

3. **Official documentation MCPs — selectively useful**
   - Useful for current framework/provider API facts.
   - Not required for ordinary local implementation.

### Not recommended now

- Notion/Jira/Confluence MCP when project truth already lives in the repo.
- Database MCP because the core product has no database.
- A custom "ZenID MCP server" before a real external integration exists.
- A generic filesystem or shell MCP duplicating tools every coding agent
  already has.
- Auto-run approval for broad write-capable MCP tools.

Cursor describes MCP as an integration layer for external systems and supports
project-specific `.cursor/mcp.json` configuration:

- https://docs.cursor.com/context/model-context-protocol

Anthropic describes MCP as a standard connection between AI applications and
data sources/tools:

- https://docs.anthropic.com/en/docs/mcp

## 13. Phased Transformation

### Phase 0 — Preserve and baseline

Status: Started

- Keep current working behavior.
- Record the current test/build baseline.
- Keep real creator fixtures ignored.
- Stop marking implemented work as fully accepted without evidence.
- Do not add new product scope during the transformation pilot.

Exit evidence:

- repeatable current verification command;
- documented known gaps;
- clean product boundary.

### Phase 1 — Pilot full SDD on SPEC-001

Feature: Open ZenID Project Locally

- Convert SPEC-001 into a feature folder. Completed 2026-07-24; implementation
  and evidence gates remain in progress.
- Resolve atomic import/recovery decisions.
- Add plan, tasks, test cases, contracts, and evidence.
- Test malformed, hostile, and boundary archives first.
- Verify IndexedDB/localStorage failure behavior.
- Verify no project data leaves through the network.
- Measure import performance and main-thread blocking.

Exit evidence:

- every required AC has an exact test/check mapping;
- security cases pass;
- performance baseline is recorded;
- browser acceptance passes;
- creator acceptance is recorded when relevant.

### Phase 2 — Frontend testing foundation

- Introduce Vitest/Testing Library for React.
- Add Playwright Test with isolated browser state. Chromium foundation and
  SPEC-001 atomic import coverage added 2026-07-24; broader journeys remain.
- Cover Resume, Portfolio, and ZenPDF critical paths.
- Add test fixture factories.
- Add accessibility smoke tests.

### Phase 3 — Security and performance baseline

- Create a ZenID threat model.
- Adopt a scoped OWASP ASVS baseline.
- Add route-level lazy loading and measure its effect.
- Move proven heavy work to Web Workers where justified.
- Add file-size, entry-count, type, and resource budgets.

### Phase 4 — Backend disposition

- Inventory scanner, OCR, overlay, and CV capabilities.
- Select Option A, B, or C for each capability.
- Execute removal/isolation/service work as a dedicated spec.
- Do not mix this phase into feature work.

### Phase 5 — CI and release evidence

- Add pull-request verification workflow.
- Add scheduled deep verification.
- Produce sanitized release evidence.
- Define the first supportable release baseline.

## 14. Resolved Import Decision

D-005 resolves the initial SPEC-001 compatibility behavior: if a `.zenid`
project references a missing or invalid media asset, ZenID rejects the entire
import and preserves the current workspace. Recovery mode remains a possible
future feature only if supported by real user evidence.

## 15. Non-Goals

This roadmap does not require:

- rewriting the React application;
- adding a cloud backend;
- adopting microservices;
- installing every available MCP server;
- running several paid agents continuously;
- achieving arbitrary 100% code coverage;
- converting every Markdown file at once;
- deleting the Python backend before its disposition review.

The goal is a product whose intent, implementation, tests, and evidence remain
aligned as it evolves.
