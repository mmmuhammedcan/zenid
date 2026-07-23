# ZenID Repository Context

`README.md` and `plan.md` are the current product sources of truth.

## Product

ZenID is a privacy-first, local professional identity workspace. Its primary
journey is:

1. maintain one user-owned professional profile;
2. create ATS-friendly resume documents from that profile;
3. create a public portfolio package from explicitly selected information;
4. save and reopen the editable private workspace as a `.zenid` file.

ZenPDF is a supporting local fill-and-sign tool. It is not the center of the
product and must not expand into a general Acrobat replacement without a new
product decision.

The Python scanner/OCR/backend and the vanilla HTML pages are legacy
experiments. They remain in the repository for now but are not part of the
current React product architecture or active roadmap.

The previous general-purpose PDF-toolkit plan is preserved only as historical
context in `docs/history/legacy-doc-toolkit-plan.md`. It is not authoritative.

## Engineering protocol

Before implementing a behavioral change:

1. identify or write the relevant feature spec;
2. resolve product decisions and record them in the decision log;
3. derive observable acceptance criteria;
4. add a failing automated test when the behavior is automatable;
5. implement the smallest change;
6. run the verification matrix relevant to the change.

Never describe a feature as accepted merely because its code exists. Use these
states:

- **Implemented** — code is present.
- **Automatically verified** — repeatable automated evidence exists.
- **Manually accepted** — a named checklist and dated evidence exist.

## Privacy and fixtures

- Product data stays in the browser unless a future opt-in spec says otherwise.
- Public portfolio output must contain only explicitly published data.
- Repository tests use synthetic identities.
- Creator-owned real CV/portfolio acceptance material belongs in the ignored
  `creator_docs/` directory and must never be committed.

## Verification commands

From `frontend/pdf-editor`:

```bash
npm test
npm run lint
npm run build
node scripts/zenid-roundtrip-check.mjs save
node scripts/zenid-roundtrip-check.mjs restore
```

Current specs, decisions, and evidence status live under `docs/`.
