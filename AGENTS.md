# ZenID Engineering Context

`README.md` and `plan.md` define the current product direction. Feature
behavior, implementation work, and evidence live under `docs/specs/`.

## Product boundary

ZenID is a privacy-first, local professional identity workspace:

1. maintain one user-owned professional profile;
2. create ATS-friendly resume documents from that profile;
3. create a public portfolio from explicitly selected information;
4. save and reopen the private workspace as a local `.zenid` file.

ZenPDF is a supporting local fill-and-sign tool. The Python scanner/OCR backend
and vanilla HTML pages are legacy experiments and are outside the active React
roadmap until the documented backend disposition gate is completed.

## Delivery workflow

For behavioral changes:

1. clarify or write the feature spec;
2. record unresolved product decisions;
3. update the implementation plan and dependency-ordered tasks;
4. add a failing automated test when the behavior is automatable;
5. implement the smallest compatible change;
6. run the relevant verification commands;
7. record exact evidence for the tested commit.

Do not equate code presence with acceptance:

- **Implemented**: code is present.
- **Automatically verified**: repeatable mapped evidence passes.
- **Manually accepted**: a dated checklist and acceptance record exist.

Prefer one implementation owner for a bounded change. Use fresh-context
reviewers for security, test, or architecture gates when the risk justifies it.

## Privacy and safety

- Keep project data in the browser unless an accepted opt-in spec says otherwise.
- Never include private project data in a public portfolio ZIP.
- Use synthetic identities in committed tests and evidence.
- Keep creator-owned CV/portfolio fixtures only in ignored `creator_docs/`.
- Do not delete or revive the legacy backend outside its decision gate.
- Preserve user changes and avoid destructive Git or filesystem operations.

## Verification

From `frontend/pdf-editor`:

```bash
npm test
npm run lint
npm run build
npm run test:e2e
node scripts/zenid-roundtrip-check.mjs save
node scripts/zenid-roundtrip-check.mjs restore
```

Use the applicable feature `evidence.md` and `docs/verification-matrix.md` to
report gaps. An agent's assurance is not evidence.
