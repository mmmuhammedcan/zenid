# SPEC-001 scoped OWASP ASVS 5.0.0 mapping

This is a **scoped control mapping for the ZenID local project-import path**.
It is not ASVS certification, an ASVS compliance claim, or evidence that every
ASVS requirement applies to or passes for ZenID.

The identifiers and requirement paraphrases below were checked against the
official OWASP ASVS 5.0.0 tag and release. `Evidenced` means that repeatable
repository evidence covers only the stated import behavior. `Partial` means the
evidence overlaps the requirement but does not establish its complete scope.
Neither status should be read as a product-wide ASVS result.

## Control mapping

| ASVS 5.0.0 control | Requirement paraphrase | ZenID implementation and evidence | Status | Caveat |
| --- | --- | --- | --- | --- |
| `v5.0.0-5.1.1` | Document accepted file types, extensions, maximum size and unpacked size, and handling of malicious files. | [`spec.md`](spec.md) defines the `.zenid` import scope, invalid-project behavior, and 25 MiB compressed, 8 MiB media, and bounded expanded-data requirements. [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 4–13 define the concrete format and limits. | Partial | The feature documentation does not provide a complete file-handling inventory or disposition policy for every malicious-file class. |
| `v5.0.0-5.2.1` | Accept only files whose size the application can process without unacceptable performance loss or denial of service. | [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 6–13 and 350–385 enforce compressed, expanded, media, entry, and entry-count bounds. [`projectFile.test.js`](../../../frontend/pdf-editor/src/resume/projectFile.test.js) lines 149–193 exercises those limits. The T040 baseline is recorded in [`evidence.md`](evidence.md). | Partial | The limits are enforced, but near-limit responsiveness has only a single-machine measurement; safe performance across representative supported devices remains unresolved. |
| `v5.0.0-5.2.2` | Check that an accepted file has an expected extension and that its content matches the represented type. | [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 55–69 and 254–301 validates the archive manifest, PDF/image signatures, media MIME allowlist, IDs, paths, and referenced files. [`projectFile.test.js`](../../../frontend/pdf-editor/src/resume/projectFile.test.js) lines 69–147 covers valid and invalid signatures/media. | Partial | Content validation is evidenced, but the importer does not make the selected filename extension a security boundary and does not deeply decode or rewrite images. |
| `v5.0.0-5.2.3` | Before decompression, bound an archive's uncompressed size and number of files. | [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 83–131 applies entry-count, per-entry, and cumulative expanded-size checks through the decompressor filter before output allocation. [`projectFile.test.js`](../../../frontend/pdf-editor/src/resume/projectFile.test.js) lines 156–205 covers expanded size, entry count, per-entry size, and inconsistent stored-entry metadata. | Evidenced | This is scoped to the current `fflate` ZIP import implementation and its central-directory metadata checks, not every compression format. |
| `v5.0.0-2.2.1` | Positively validate input against expected structures, allowlisted values, patterns, ranges, and logical limits. | [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 34–69, 83–131, and 249–335 rejects unsafe or duplicate paths, duplicate asset identifiers, unsupported archive content, invalid manifests/media, missing references, and resource-limit violations. [`projectFile.test.js`](../../../frontend/pdf-editor/src/resume/projectFile.test.js) lines 105–220 provides repeatable negative cases; schema checks continue in [`projectSchema.js`](../../../frontend/pdf-editor/src/resume/projectSchema.js). | Evidenced | The evidence covers `.zenid` import inputs only, not all inputs handled by the application. |
| `v5.0.0-5.3.3` | During server-side decompression, ignore user-provided path information to prevent ZIP-slip-style writes. | [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 34–53, 96–105, and 249–320 validates archive paths, generates export paths, rejects duplicate names, and rejects files outside the manifest-derived allowlist. The unsafe and duplicate path regressions are in [`projectFile.test.js`](../../../frontend/pdf-editor/src/resume/projectFile.test.js) lines 119–127 and 207–220. | Partial | ZenID decompresses in the browser and does not write archive paths to a server filesystem. The controls address the analogous untrusted-path risk, but the ASVS requirement explicitly describes server-side processing. |
| `v5.0.0-2.3.3` | Use transaction semantics so a business operation either completes entirely or returns to the previous correct state. | [`projectImport.js`](../../../frontend/pdf-editor/src/resume/projectImport.js) prepares, persists assets, and commits project state in that order. [`projectImport.test.js`](../../../frontend/pdf-editor/src/resume/projectImport.test.js) lines 5–62 proves no commit after preparation or persistence failure. [`spec001-open-project.spec.js`](../../../frontend/pdf-editor/e2e/spec001-open-project.spec.js) lines 104–160 injects a second IndexedDB write failure and verifies rollback plus preservation of the visible project and prior media. | Evidenced | Evidence covers validation and IndexedDB transaction failure, not abrupt browser/process termination at every instruction boundary. |
| `v5.0.0-16.5.3` | Fail gracefully and securely when exceptions occur, without continuing after failed validation or other controls. | Invalid archives are converted to controlled compatibility failures in [`projectFile.js`](../../../frontend/pdf-editor/src/resume/projectFile.js) lines 237–247. Coordinator and browser tests above prove failed preparation or media persistence does not commit incoming project state. | Evidenced | The mapped evidence covers project-import validation and persistence failures, not a product-wide last-resort exception-handling assessment. |
| `v5.0.0-14.2.3` | Do not send defined sensitive data to untrusted parties. | [`spec.md`](spec.md) BR-006 and AC-004 require local-only import. [`spec001-open-project.spec.js`](../../../frontend/pdf-editor/e2e/spec001-open-project.spec.js) lines 85–102 observes browser requests during a valid import and verifies no request body is emitted while the synthetic project becomes visible. | Partial | The test demonstrates the scoped no-upload behavior for request bodies during the exercised flow; it is not a full sensitive-data classification, destination-trust review, or exfiltration assessment across the product. |

## Not assessed by this mapping

The local-first architecture does not make unrelated ASVS areas automatically
satisfied. This mapping does not assess:

- authentication (V6), session management (V7), or authorization (V8);
- server-side transport security and TLS deployment (V12);
- security-log inventory, event coverage, protection, retention, or operational
  monitoring (V16), beyond the scoped import-failure row above;
- dependency vulnerability governance, build provenance, production
  configuration, hosting, or deployment hardening (including relevant V13 and
  V15 requirements).

These areas require separate scope, architecture, deployment context, and
evidence. They are recorded here as **not assessed**, not passed or
not-applicable.

## Authoritative ASVS sources

- [OWASP ASVS 5.0.0 release](https://github.com/OWASP/ASVS/releases/tag/v5.0.0_release)
- [Versioned identifier guidance and 5.0.0 source tree](https://github.com/OWASP/ASVS/tree/v5.0.0)
- [V2 Validation and Business Logic](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x11-V2-Validation-and-Business-Logic.md)
- [V5 File Handling](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x14-V5-File-Handling.md)
- [V14 Data Protection](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x23-V14-Data-Protection.md)
- [V16 Security Logging and Error Handling](https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x25-V16-Security-Logging-and-Error-Handling.md)
