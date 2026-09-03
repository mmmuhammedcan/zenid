# ZenID Decision Log

Decisions are append-only. Superseded decisions stay here and point to their
replacement so historical context remains explainable.

## D-001 — ZenID workspace is the primary product

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Creator
- Context: The repository contained two conflicting visions: a general PDF SaaS
  and a local professional identity workspace.
- Decision: The local professional identity workspace is authoritative. Resume,
  portfolio, and the private `.zenid` project form the primary journey. ZenPDF
  is a supporting fill-and-sign tool.
- Consequence: The Python OCR/backend and vanilla pages are legacy experiments.
  New work there requires a separate product decision.

## D-002 — Real creator data is valid manual acceptance material

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Creator
- Context: Synthetic fixtures prove repeatability but cannot replace the
  creator's visual review of a real CV and portfolio.
- Decision: Real creator data is kept under ignored `creator_docs/`. Tracked
  automated tests and shared scripts use synthetic identities.
- Consequence: Personal acceptance remains possible without publishing personal
  data in repository history.

## D-003 — Completion status must name its evidence level

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Creator
- Decision: Roadmap items use Implemented, Automatically verified, and Manually
  accepted as separate states.
- Consequence: A passing build or existing code is not by itself product
  acceptance.

## D-004 — Saved ZenPDF pages must finish restoring before use

- Date: 2026-07-23
- Status: Accepted
- Decision owner: Engineering
- Context: Fabric `loadFromJSON` is asynchronous. Page navigation previously
  reported readiness before the saved annotations had finished loading.
- Decision: Page rendering awaits annotation restoration. Concurrent page
  transitions and export are guarded as document-busy operations.
- Consequence: Users cannot export or start another page transition against a
  partially restored canvas.

## D-005 — ZenID project imports are atomic

- Date: 2026-07-24
- Status: Accepted
- Decision owner: Creator
- Context: A structurally valid `.zenid` archive may still reference a missing,
  invalid, or unsupported media asset.
- Decision: Reject the entire import when any referenced project file or media
  asset is missing or invalid. Keep the current browser workspace unchanged.
- Consequence: Partial recovery is not part of the initial compatibility
  contract. A documented recovery mode may be considered later if real user
  evidence demonstrates the need.

## D-006 — AI compatibility belongs to the user-owned project boundary

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Creator
- Context: Users may want Claude, Codex, or another AI they already use to
  prepare a targeted resume without ZenID hosting inference, storing project
  data, receiving API keys, or requiring accounts.
- Decision: A future plugin may teach the user's AI how to read, safely edit,
  and return a valid `.zenid` project. ZenID itself does not connect to or host
  the model.
- Consequence: Core AI compatibility remains local and optional. Job discovery,
  listing trust, matching, and application automation require a separate
  opt-in ZenID Jobs product decision.

## D-007 — A released reader supports its schema plus the previous three

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Creator
- Context: Recorded for SPEC-001 as a feature-local decision that reused a
  decision-log number already taken by D-006.
- Decision: A released ZenID reader supports its current schema plus the
  previous three schema versions for at least 18 months after each schema's
  release. A schema leaves support only after both conditions are true. Older
  readers reject newer schemas without partial recovery and direct the user to
  update.
- Consequence: Compatibility is bounded and testable. Newer projects fail
  closed with update guidance instead of degrading silently.
- Creator confirmation: Reconfirmed on 2026-07-26. The support policy remains
  accepted.

## D-008 — Archive extraction and validation run in a Web Worker

- Date: 2026-07-25
- Status: Accepted
- Decision owner: Engineering
- Context: Recorded for SPEC-001 as a feature-local decision that reused a
  decision-log number already taken by D-007 in that spec.
- Decision: ZIP extraction and project validation run in a Web Worker. The
  named-machine baseline showed a 250–280 ms near-limit scheduler delay on the
  main thread; the worker reduced the same proxy to 10 ms while preserving every
  archive limit and the prepare-then-commit boundary.
- Consequence: The responsiveness question is resolved. The 75 MB
  pre-materialization memory budget is a separate open question (Q-002).

## D-009 — Media persists before the project is committed

- Date: 2026-07-25
- Status: Superseded by D-011
- Decision owner: Engineering
- Context: A ZenID import writes media to IndexedDB, then commits the project to
  `localStorage`, then makes it the visible workspace. A failure at the commit
  step therefore leaves media records that the committed project never
  references.
- Decision: Keep this order and treat a failed commit as a rejected import.
  Persistence runs before the visible workspace changes, so a commit failure
  leaves both `localStorage` and the on-screen workspace untouched and the
  recovery panel's assurance stays true. Do not delete the already-written media
  on failure: identifiers are stable, so a re-import of a project over itself
  would target records the current workspace still references, and a rollback
  would be destructive.
- Consequence: A rejected import can leave unreferenced media records in the
  browser store. They are inert, never surfaced, and never included in an
  export. Reclaiming them needs a separate reference-counted cleanup pass, which
  is out of scope for SPEC-001.

## D-010 — Existing media is collision-safe during project import

- Date: 2026-07-26
- Status: Superseded by D-011
- Decision owners: Creator and Engineering
- Context: D-009 correctly avoids deleting stable identifiers after a project
  commit failure, but an unconditional IndexedDB `put` could first overwrite a
  current media record when an incoming archive reused its identifier. A later
  project-store failure would then leave the current project pointing at
  different bytes while the UI claimed the workspace was unchanged.
- Decision: Preflight imported identifiers against browser media storage.
  Reuse a record only when its identifier, kind, name, MIME type, and bytes are
  identical. Reject conflicting content as an invalid/incomplete project before
  writing any imported media. Add genuinely new records without overwriting an
  identifier that another browser context may have created concurrently.
- Consequence: This closed the overwrite risk in the split-store architecture.
  D-011 later removed the remaining orphan case with a native transaction, so
  T054 no longer requires a cleanup implementation.

## D-011 — Private workspace data uses one transactional IndexedDB boundary

- Date: 2026-07-26
- Status: Accepted
- Decision owners: Creator and Engineering
- Context: The original résumé draft used synchronous `localStorage`. Portfolio
  media later introduced IndexedDB, leaving canonical project references and
  their files in stores that cannot commit together. Application-level rollback
  cannot provide the same guarantee as a native database transaction.
- Decision: Upgrade the existing media database in place and make IndexedDB the
  canonical store for project JSON, media, uploaded résumé files, and ZenPDF
  visual signature/initial images. Atomic project/media operations use one
  transaction. Existing `localStorage` values are migration inputs only and are
  removed after successful IndexedDB persistence.
- Consequence: D-009 and D-010 become migration history rather than the target
  architecture. Portable `.zenid` files remain the user-owned backup; no server
  storage or account is introduced.

## D-012 — One browser tab owns the writable local workspace

- Date: 2026-07-26
- Status: Accepted
- Decision owners: Creator and Engineering
- Context: IndexedDB transactions prevent partial writes but do not prevent two
  tabs from independently editing stale in-memory copies and overwriting each
  other. ZenID is a personal local workspace, not a collaborative editor, so
  merge, revision, and last-writer-wins behavior add risk without product value.
- Decision: One same-origin tab holds an exclusive Web Lock for the private
  workspace. Other ZenID tabs show a non-editable waiting state and acquire the
  lock automatically after the owner closes. Browsers without Web Locks fail
  closed with update guidance rather than enabling unsafe concurrent writes.
- Consequence: Multi-tab concurrent editing is explicitly unsupported. A
  single tab may navigate freely among Resume, Portfolio, and ZenPDF while
  retaining the same workspace ownership.

## D-013 — Physical-device import-memory validation is deferred

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: The 75 MB expanded-project limit has repeatable desktop benchmark
  evidence, but the team does not currently have the minimum supported
  low-memory physical device required by T046.
- Decision: T046 is deferred and does not block the present release-hardening
  work. Reopen it when real-user telemetry, a support report, or an appropriate
  physical test device is available. Do not describe the 75 MB limit as
  physically validated in the meantime.
- Consequence: Automated archive limits and desktop responsiveness gates stay
  enforced. Low-memory device behavior remains an explicitly unverified risk,
  not a hidden claim of acceptance.

## D-014 — New IndexedDB media records store bytes rather than Blob objects

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Engineering
- Context: Cross-engine release testing reproduced WebKit's
  `Error preparing Blob/File data to be stored in object store` failure. Blob
  persistence therefore made valid local media transactions engine-dependent.
- Decision: Persist new media payloads as `Uint8Array` values and reconstruct
  runtime Blob objects only when the UI needs an object URL. Continue reading
  legacy Blob-backed records so existing Chromium/Firefox workspaces and the
  version-1 upgrade remain compatible.
- Consequence: The canonical transaction format uses structured-clone byte
  arrays across engines. Blob is a runtime/export representation, not a storage
  requirement.

## D-015 — React Router RSC advisory is unreachable in the static client

- Date: 2026-07-26
- Status: Accepted with monitoring
- Decision owner: Engineering
- Context: `npm audit` reports GHSA-qwww-vcr4-c8h2 against the current
  `react-router-dom` 7.18.1 dependency. The advisory concerns RSC Mode action
  execution and CSRF handling. npm currently offers a downgrade carrying a
  larger set of older router advisories rather than a patched current release.
- Decision: Retain and exactly pin 7.18.1. ZenID uses only client-side
  `BrowserRouter`, `Routes`, `Route`, and constant internal `Link` targets; it
  has no React Server Components, SSR action endpoint, data-router action, or
  application backend on which the advisory can execute. Reassess when an
  upstream patched current release is published.
- Consequence: `npm audit` remains non-zero and must not be reported as clean.
  The finding is dispositioned as unreachable in this product architecture,
  while dependency updates remain a release-maintenance responsibility.

## D-016 — Initial manual acceptance targets Windows and Android

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: The creator currently has access to Windows and Android devices but
  not to suitable macOS, iPhone, or iPad acceptance devices.
- Decision: The initial web release manual-acceptance matrix covers current
  Chrome and Firefox on Windows and current Chrome with TalkBack on Android.
  macOS, iOS, and iPadOS remain outside the manually accepted launch matrix.
- Consequence: Automated WebKit results remain useful compatibility evidence
  but must not be described as real-device Safari or Apple-platform acceptance.
  The Apple platforms can be added through a later dated acceptance pass
  without changing the local-first product architecture.

## D-017 — The hosting Worker is a stateless application-file router

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Engineering
- Context: The selected Sites runtime requires a Worker entrypoint alongside
  client assets even though ZenID is a client-only Vite application.
- Decision: Keep the product client-only. The Worker may serve the built static
  files and map unknown GET/HEAD routes to the SPA shell. It must not expose an
  upload, profile, project, PDF, media, analytics, or persistence endpoint.
- Consequence: The runtime adapter is hosting infrastructure rather than a
  ZenID application backend. Private workspace data remains inside the user's
  browser and public Portfolio publication remains a separate explicit export.

## D-018 — Initial acceptance deploy uses an owner-only generated address

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: The creator wants to validate the real web deployment before buying
  or attaching a custom domain.
- Decision: Use the generated ChatGPT Sites address for the initial production
  acceptance deployment and keep access owner-only until the dated smoke and
  manual-acceptance checks pass. A custom domain is deferred.
- Consequence: The generated address is a real production deployment but not a
  public launch. Changing access to public or attaching a domain remains an
  explicit later action.

## D-019 — Production access is temporarily public for device acceptance

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: The creator wants to exercise the production deployment from Ubuntu,
  Android, and a family member's Windows device without signing a personal
  ChatGPT account into the shared Windows computer.
- Decision: Make the generated production URL public during the cross-device
  acceptance period. Revisit whether to retain public access after D-016
  acceptance is complete.
- Consequence: Anyone with the URL can load the application code. ZenID still
  has no project-data backend; each visitor's workspace remains inside that
  visitor's browser origin. Shared-device acceptance must use synthetic data
  and must save/remove its local test workspace deliberately.

## D-020 — ZenPDF authoring is desktop-first with bounded mobile support

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: Physical Android acceptance found that a PDF opened at the desktop
  default scale is difficult to navigate and annotate on a phone. The creator
  wants ZenPDF to remain desktop-first and does not accept a mobile fix that
  changes the established desktop behavior.
- Decision: Preserve the 100% initial desktop canvas and existing desktop
  authoring controls. On narrower viewports, initially fit a newly opened PDF
  or image page within the available width and make the scaled layout box match
  the visible page. Mobile must support opening, navigation, coarse placement,
  and local export, but does not promise desktop-equivalent precision editing.
- Consequence: The responsive fit is isolated from normal desktop viewports and
  is covered by both mobile and desktop regression assertions. More extensive
  touch-first authoring remains a separately scoped enhancement.

## D-021 — Localization uses lazy document overlays on one shared profile

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: A Turkish/English product must preserve ZenID's “enter information
  once” promise without forcing every user to fill both languages or pretending
  that application language selection translates professional claims.
- Decision: Keep language-neutral facts in the canonical profile. Each résumé
  and the portfolio select their own output language and may store
  language-dependent text overrides keyed by stable profile item identifiers.
  Show those overrides only when the user chooses to customize that output.
  ZenID localizes its own interface, labels, dates, and generated chrome but
  never automatically translates or rejects user-authored text.
- Consequence: A one-language workflow stays simple. Users who need Turkish and
  English reuse names, contacts, dates, links, companies, schools, and other
  shared facts while editing only the narrative fields that actually differ.
  Existing English projects remain valid.

## D-022 — ZenID uses a creator-owned public domain and static host

- Date: 2026-07-26
- Status: Accepted
- Decision owner: Creator
- Context: The generated acceptance URL is operational but unsuitable as the
  durable product identity. The deliberately chosen ZenID name has unrelated
  uses online, while `zenid.com` is already registered.
- Decision: Keep the ZenID product name and use “Your local identity
  workspace.” as its strapline. Publish the accepted client-only application
  from the creator's Cloudflare account, use `https://getzenid.com/` as the
  canonical origin, and retain the Sites deployment as a rollback path until
  custom-domain acceptance completes.
- Consequence: Hosting and DNS remain replaceable infrastructure. Search
  metadata must distinguish the local résumé, portfolio, and PDF workspace
  without promising a ranking, introducing analytics, or weakening the
  browser-only privacy boundary.

## D-023 — Search discovery uses paired static-first helpful workflow pages

- Date: 2026-07-27
- Status: Accepted
- Decision owner: Creator
- Context: ZenID's application metadata preserves the selected brand but does
  not give Turkish or English searchers capability-specific results for CV,
  portfolio, or PDF workflows. Changing the root into mixed-language keyword
  copy would weaken the brand and still provide an unclear primary language.
- Decision: Preserve the canonical root and “Your local identity workspace.”
  strapline. Add paired Turkish and English static-first pages for Resume,
  Portfolio, and ZenPDF, each with unique metadata, useful workflow/privacy
  guidance, reciprocal language alternates, structured product facts, and a
  direct link to the existing local tool. Permit public search crawlers while
  retaining the AI-training opt-out.
- Consequence: Search engines and search-backed assistants receive focused,
  language- and intent-matched public product facts without a thin doorway-page
  network or keyword stuffing. Ranking remains an external outcome.

## D-024 — The ZenID AI plugin is a locally run MCP server

- Date: 2026-08-30
- Status: Accepted
- Decision owner: Creator
- Context: SPEC-005 accepted user-owned AI interoperability but deferred which
  clients and packaging formats come first. ZenID has no project-data backend:
  canonical private data lives in the browser under D-012 and in local `.zenid`
  files. Any ZenID-hosted agent surface, including an in-application assistant
  or a ZenID-held provider API key, would have to receive a user's professional
  data and would make ZenID a controller of that data, contradicting D-001 and
  the stated privacy boundary.
- Decision: The first ZenID plugin is `zenid-mcp`, a Model Context Protocol
  server distributed as an npm package and executed by the user's own agent
  client over local stdio. It operates only on `.zenid` files and export
  outputs on the user's filesystem. ZenID does not host it, does not proxy
  model traffic, does not accept a model-provider API key, and does not add an
  in-application assistant. The web application remains the review and export
  surface; the plugin is a local editor of the private project file.
- Consequence: Supported clients are stdio-capable local agents such as Claude
  Desktop and Claude Code. Clients that connect only to remote MCP servers,
  including ChatGPT, are out of scope here and would require a separate
  stateless remote decision with its own data-processing statement. The
  browser-only privacy boundary is unchanged because no ZenID-operated network
  hop exists on the plugin path.

## D-025 — AI edits are typed operations on a validated project, not free-form project replacement

- Date: 2026-08-30
- Status: Accepted
- Decision owner: Creator
- Context: SPEC-005 deferred whether an AI returns a complete new `.zenid` file
  or a smaller change proposal. A whole-file return makes any model formatting
  error indistinguishable from an intentional edit and gives the user no
  reviewable summary. A bespoke patch format would add a second data contract
  to maintain beside the schema.
- Decision: The plugin loads a project into memory through the existing
  `normalizeProject` migration path and mutates it only through typed,
  per-field tools. Each tool returns the concrete before/after values it
  changed. Persisting is a separate explicit tool call that revalidates the
  project, writes through the existing `.zenid` writer, and creates a new file
  unless the caller explicitly requests overwrite of the opened path.
- Consequence: There is no second interchange format to version. Invalid model
  output fails at the existing schema boundary instead of reaching a file. The
  user receives a reviewable change list before a write, and the reopened
  project passes the same compatibility checks as any manually saved workspace.

## D-026 — The plugin may rewrite presentation but may not widen publication or silently rewrite history

- Date: 2026-08-30
- Status: Accepted
- Decision owner: Creator
- Context: SPEC-005 deferred which factual and privacy checks are required
  before an AI-edited project is accepted. ZenID cannot verify whether a claim
  is true, so promising factual verification would be dishonest. It can,
  however, mechanically constrain which fields an agent is able to change and
  how visibly it must do so.
- Decision: Wording tools write only presentation text and, where the schema
  supports it under D-021, locale overrides keyed to existing profile items.
  Changing an employer name, institution name, date, or credential identifier
  requires a distinct fact-edit tool that names the field and reports the old
  and new value in its result. No tool may set a `contactPrivacy` or
  `visibleSections` flag to true, remove an entry from `hiddenItems`, add a
  media asset to the public portfolio, or enable portfolio résumé attachment;
  publication scope stays a human decision in the application. Export tools refuse to run on a project
  that fails normalization.
- Consequence: An agent can prepare and target résumé presentation without
  being able to invent employment history unnoticed or widen what becomes
  public. ZenID states that it constrains and reports edits; it does not claim
  to verify that the user's claims are true.

## D-027 — The MCP plugin ships from this repository as a bundled workspace package

- Date: 2026-08-30
- Status: Accepted
- Decision owner: Creator
- Context: SPEC-011 Q-004 asked whether the plugin lives in this repository or in
  a separate repository depending on a published ZenID core package. The server
  reuses `projectSchema.js`, `projectFile.js`, `resumePdfExport.js`, and
  `portfolioSiteExport.js` directly. A separate repository would hold its own
  copy or its own pinned version of the project schema, so an application
  schema change could ship before the plugin's, and the failure mode of that
  skew is a written `.zenid` file the application refuses to reopen.
- Decision: The plugin lives at `packages/zenid-mcp` in this repository, added
  as an npm workspace. It imports the shared modules by relative path so tests
  run against the same source the application runs. Publication bundles those
  imports and the required font assets into the package's own `dist/`, because
  npm packaging does not follow relative paths outside the package directory.
- Consequence: BR-011 parity is enforceable in one test run, and the schema
  cannot drift between the two surfaces. The published tarball carries the
  three NotoSans faces, roughly 1.5 MB, which is accepted as the cost of
  ATS-safe Unicode output. Extracting a separate repository later remains
  possible once a published ZenID core package exists; it is not reversible in
  the other direction at comparable cost.

## D-028 — Mechanical ATS findings are grounded in the checklist's own binary rules, and subjective coaching stays a data tool

- Date: 2026-09-03
- Status: Accepted
- Decision owner: Creator
- Context: SPEC-011 Q-005 left open whether `zenid_validate` should expose
  ATS-mechanical findings, and the creator asked for the free plugin to help
  with ATS-friendliness and interactive resume advice, grounded in the
  existing `zenid-resume-checklist.pdf` the application already ships and
  links from the builder. That checklist itself distinguishes mechanical,
  binary-checkable rules (a single-column layout, a professional link present,
  consistent dates) from judgment calls (is a bullet's evidence convincing,
  is a keyword actually relevant). `plan.md`'s Free Local Product list already
  commits to "ATS-friendly PDF export" and the checklist itself; "AI resume
  analysis and prioritized suggestions" is listed separately as an optional
  future service specifically because judging career quality is not a promise
  this project makes.
- Decision: `mechanicalFindings` gains four checks taken directly from the
  checklist's "Structure and visual integrity" and header sections: a missing
  header location, no professional link present (LinkedIn, GitHub, and
  portfolio all empty), an experience or education entry with no start date,
  and inconsistent date formatting across entries. Each finding names the
  concrete field or item. A new tool, `zenid_resume_playbook`, returns the
  checklist's evidence formula, structure checklist, and four
  AI-collaboration prompts as plain data. It is a reference the connected
  agent applies to the user's real, already-open content in conversation; the
  server does not itself score, rank, or rewrite anything through it.
- Consequence: The plugin can materially help with ATS-friendliness and
  interactive coaching today, for free, without moving the goalposts on what
  ZenID promises to verify. The checklist's subjective judgment calls remain
  exactly what they are: something the user's own chosen agent applies to
  their own real experience, not a hidden scoring function the server runs
  quietly. If the application's checklist content changes, this tool's data
  should be updated alongside it or it will teach a stale framework.

## D-029 — A transparent mechanical score is server-side; job-specific AI screening stays a live agent capability

- Date: 2026-09-03
- Status: Accepted
- Decision owner: Creator
- Context: The creator asked for something closer to a real hiring pipeline
  experience: a resume is screened, gets a score, some pass and some are
  filtered, with recommendations. D-028 deliberately kept `zenid_validate`
  and `zenid_resume_playbook` free of any score, because judging career
  quality was out of scope. The creator's new request is more specific:
  they want the pass/fail, scored screening feeling, not necessarily a
  claim of being a certified ATS product.
  There is a hard architectural fact this decision must respect, not just a
  preference: `zenid-mcp` holds no model-provider key and makes no network
  request (BR-001, D-024), verified by a test that stubs every outbound
  socket to throw. The server cannot itself run an AI judgment of whether a
  resume matches a job description, because it has no model to run one with.
  That capability only exists in the connected agent's own reasoning.
- Decision: Two capabilities, kept honestly distinct.
  1. `zenid_validate` gains a deterministic `atsScore`: a fixed set of seven
     equal-weight, binary, mechanical criteria already computed as findings
     (name present, a contact method present, a location present, a
     professional link present, experience and skills both non-empty, every
     dated entry has a start date, date formatting is consistent), reported
     as a percentage with a pass/fail breakdown and one concrete recommended
     action per failed criterion. This is arithmetic over existing findings,
     not a new judgment.
  2. Job-specific, content-quality screening — "would this pass a real
     recruiter's AI screen for this posting" — is not computed by the
     server. It is a capability of the connected agent, using
     `zenid_read_section` for the user's real content and
     `zenid_resume_playbook`'s `relevance_review` prompt as the method,
     applied live in conversation to whatever job description the user
     supplies. The plugin's data boundary (SPEC-011 BR-001) is not
     renegotiable to add this server-side.
- Consequence: The user gets a real score today, for free, computed the
  same way every time from their own file, that a support engineer could
  audit line by line. The "does this pass for this specific job" experience
  they actually asked for still happens, honestly, as a conversation with
  their agent rather than a black-box verdict a local script cannot
  responsibly render.
