# ZenID Verification Matrix

Last verified: 2026-07-25

| Capability | Implemented | Automated evidence | Manual acceptance | Main gap |
|---|---:|---:|---:|---|
| Project schema and legacy migration | Yes | Yes | No | Invalid-storage recovery UX |
| `.zenid` ZIP round trip | Yes | Yes | Creator-only | 75 MB memory-budget validation on minimum supported physical device |
| Resume PDF generation | Yes | Yes | Creator-only | Browser and assistive-tech checks |
| Resume presentation variants | Yes | Yes | No | Content overrides and broader item selection |
| Portfolio privacy/static ZIP | Yes | Yes | Creator-only | Root/subpath host acceptance |
| IndexedDB media lifecycle | Yes | No | No | Integration and rollback tests |
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
