# Project import benchmark

Run the isolated Chromium benchmark from `frontend/pdf-editor`:

```bash
npm run benchmark:project-import
```

The command generates deterministic small, typical, and near-limit `.zenid`
archives locally, imports them through the browser `readProjectBundleFile` API,
and prints one `ZENID_IMPORT_BENCHMARK=<json>` line. The same machine-readable
report is attached under the ignored `test-results/` directory.

Total import time includes the browser `File.arrayBuffer()` read and archive
validation/parsing. Main-thread blocking is the maximum delay beyond a 10 ms
browser scheduler pulse during an import; overlapping Long Task duration is
also recorded as a diagnostic.

The small and typical p95 import times and maximum blocking measurements enforce
their approved budgets. The near-limit scenario uses 96% of the expanded-data
limit and is measurement-only.
