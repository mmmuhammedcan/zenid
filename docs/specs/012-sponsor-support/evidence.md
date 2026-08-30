# SPEC-012 Evidence

Status: Automatically verified
Re-verified on 2026-08-30 against the commit recorded below.
Verified: 2026-07-27

## GitHub Sponsors application evidence

- GitHub confirmation email "Your GitHub Sponsors profile is live",
  received 2026-07-27, addressed to `@mmmuhammedcan`.
- `https://github.com/sponsors/mmmuhammedcan` serves a live profile with a
  filled bio, a 10-sponsor goal, and three tiers ($5/mo, $25/mo, custom).

## Automated repository evidence

From `frontend/pdf-editor`, re-run on 2026-08-30 on top of parent commit
`b7ca5ed` (SPEC-011 documentation), committed as `ea1e4eb`:

- `npm test`: 83 passed, 0 failed (includes the new
  `translates the sponsor support link label` case in
  `src/localization.test.js`).
- `npm run lint` (oxlint): clean, exit 0.
- `npm run build`: succeeded; deploy-output check passed with
  `canonicalOrigin: https://getzenid.com/`.

## Manual acceptance still open

- [ ] Creator visually confirms the "Support ZenID" link on the deployed
  dashboard in both `en` and `tr` locales.
- [ ] Creator confirms the GitHub repository page shows the "Sponsor" button
  after `.github/FUNDING.yml` is committed and pushed.
- [ ] Creator decides whether to also update the GitHub Sponsors bio/featured
  project to reference ZenID directly (discussed, not yet applied).
