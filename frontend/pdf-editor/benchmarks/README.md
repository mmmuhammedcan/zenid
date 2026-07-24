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
validation/parsing. Main-thread responsiveness is represented by a
scheduler-delay proxy: the maximum delay beyond a browser scheduler pulse that
runs every 10 ms. Measurements are rounded up to 10 ms buckets before reporting
or budget checks. The probe has 10 ms sampling resolution and boundary blind
spots, so this is not a precise main-thread-blocking duration.

Overlapping Long Task duration is diagnostic only. If headless Chromium
delivers no overlapping entries, the JSON marks it unavailable for
corroboration; that does not show an absence of blocking.

The small and typical scenarios use multiple samples and enforce their approved
p95 import-time and maximum scheduler-delay-proxy budgets. The near-limit
scenario uses 96% of the expanded-data limit, records one explicitly labelled
single sample, and has `passFail: "measurement-only"`.

Environment JSON uses nullable `browserDeviceMemoryGiB`. Missing or nonstandard
Device Memory API values are reported as `null`, with
`browserDeviceMemoryStatus` explaining availability.
