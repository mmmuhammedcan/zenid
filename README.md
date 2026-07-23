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

The React application is in `frontend/pdf-editor`.

## Privacy model

- Resume and portfolio editing happen in the browser.
- No account is required.
- `.zenid` files are private editable backups opened locally.
- Portfolio ZIPs are separate public packages containing only selected data.
- Real creator acceptance fixtures live in ignored `creator_docs/`; repository
  tests use synthetic identities.

## Development

```bash
cd frontend/pdf-editor
npm install
npm test
npm run lint
npm run build
npm run dev
```

## Product and engineering documents

- `plan.md` — product direction and roadmap.
- `docs/specs/` — feature contracts and acceptance criteria.
- `docs/decision-log.md` — product and technical decisions.
- `docs/verification-matrix.md` — implementation and evidence status.
- `docs/engineering/zenid-engineering-transformation.md` — proposed
  spec-driven engineering and agent-tooling migration.
- `docs/history/` — non-authoritative historical plans.

The Python backend and vanilla HTML pages are legacy experiments and are not
connected to the current React application.
