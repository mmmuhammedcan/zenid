# ZenID Verification Matrix

Last verified: 2026-07-26

| Capability | Implemented | Automated evidence | Manual acceptance | Main gap |
|---|---:|---:|---:|---|
| Project schema and legacy migration | Yes | Yes | No | Maintain release-age fixtures under D-007 |
| `.zenid` ZIP round trip | Yes | Yes | Creator-only | 75 MB memory-budget validation on minimum supported physical device |
| Resume PDF generation | Yes | Yes | Creator-only | Browser and assistive-tech checks |
| Resume presentation variants | Yes | Yes | No | Other-section selection and wording fields |
| Portfolio privacy/static ZIP | Yes | Yes | Yes (2026-07-25, GitHub Pages + Netlify) | Broader assistive-technology and mobile review |
| Transactional IndexedDB workspace and media | Yes | Yes | No | Cross-browser manual acceptance |
| Single-writer browser workspace | Yes | Yes | No | Cross-browser manual acceptance |
| ZenPDF overlay export | Yes | Partial | No | Page/navigation/browser regressions |
| React user journeys | Yes | Partial | No | Broader component and Playwright suites |
| Python legacy backend | Legacy | No | No | Outside active roadmap |
| Mobile/accessibility | Partial | No | No | Dated device/AT checklist |

## Repeatable checks

From `frontend/pdf-editor`:

```bash
npm test
npm run lint
npm run build
npm run benchmark:project-import
node scripts/zenid-roundtrip-check.mjs save
node scripts/zenid-roundtrip-check.mjs restore
```

Creator acceptance material is intentionally separate under ignored
`creator_docs/`. A creator visual check is valuable evidence, but it does not
replace reusable automated or multi-user acceptance evidence.
