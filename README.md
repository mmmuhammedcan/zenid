# ZenID

ZenID is a privacy-first, local professional identity workspace. A user enters
professional information once, creates ATS-friendly resumes and a portfolio,
and keeps the editable project on their own device.

## Current product surface

- `/resume` — resume builder with local autosave, PDF preview/export, named
  document variants, and `.zenid` project save/open.
- `/portfolio` — portfolio editor with explicit publication controls and
  static-site ZIP export.
- `/editor` — ZenPDF, a supporting local PDF fill-and-sign tool.
- `packages/zenid-mcp` — an optional local MCP server that lets a user's own
  agent client read and edit their `.zenid` file on their own machine.
- The interface, résumé output, and portfolio output support explicit Turkish
  and English language choices without automatically translating user-authored
  professional content.

The React application is in `frontend/pdf-editor`.

## Privacy model

- Resume and portfolio editing happen in the browser.
- No account is required.
- `.zenid` files are private editable backups opened locally.
- Portfolio ZIPs are separate public packages containing only selected data.
- Real creator acceptance fixtures live in ignored `creator_docs/`; repository
  tests use synthetic identities.

### The `zenid-mcp` plugin boundary

The optional MCP plugin does not change this model. It runs on the user's own
machine, started by the user's own agent client over stdio, and makes no
network request; a test drives a full session with every outbound socket
stubbed to throw. ZenID holds no model-provider key and receives none of the
user's data. Whatever the user's client sends to its model provider, it sends
under that provider's terms, as SPEC-005 states.

The plugin can rewrite how a résumé reads, but changing what the user's history
asserts requires a distinct tool that reports the old and new value. It can
narrow what a portfolio publishes and never widen it. It can also report
mechanical ATS findings and the resume checklist's evidence formula and
coaching prompts as data, but it does not itself score or rank the user's
content. See `docs/specs/011-zenid-mcp-plugin/` and
`packages/zenid-mcp/README.md`.

## Development

```bash
cd frontend/pdf-editor
npm install
npm test
npm run lint
npm run build
npm run dev
```

## Deployment boundaries

- A portfolio ZIP exported from `/portfolio` is the provider-neutral,
  deployable static artifact. It is verified for root and project-subpath
  hosting and keeps the private `.zenid` workspace separate.
- `npm run build` produces the ZenID application bundle. The initial
  acceptance deployment uses ChatGPT Sites under D-018 and is temporarily
  public for cross-device acceptance under D-019. D-022 selects a
  creator-owned Cloudflare Pages deployment and `https://getzenid.com/` as the
  durable canonical origin; the accepted Sites deployment remains the rollback
  path until custom-domain verification is complete.
  The root build includes a matching `404.html` SPA fallback and validates
  every entry-point asset path.
- `npm run build:subpath` produces and validates the same application for the
  example `/zenid/` base. Hosting configuration must route unknown application
  paths to the generated shell (or use the included `404.html` fallback).
- Passing either build proves a provider-ready artifact, not a successful
  external deployment or provider acceptance.
- The repository-root `npm run build` is the hosting adapter: it installs the
  locked frontend dependencies, runs the verified root Vite build, and copies
  only the generated static output to `dist/client/`. Its Worker entrypoint
  serves those immutable application files and the SPA fallback; it is not a
  project-data backend.
- A future one-click publish may send only the reviewed public package directly
  from the browser to a provider account the user authorizes. It requires its
  own opt-in spec and decision; manual ZIP export remains the local default.

## Product and engineering documents

- `plan.md` — product direction and roadmap.
- `docs/specs/` — feature specs with plans, tasks, and evidence.
- `docs/decision-log.md` — product and technical decisions.
- `docs/verification-matrix.md` — implementation and evidence status.
- `docs/engineering/zenid-engineering-transformation.md` — proposed
  spec-driven engineering and agent-tooling migration.
- `docs/history/` — non-authoritative historical plans.

The Python backend and vanilla HTML pages are legacy experiments and are not
connected to the current React application.
