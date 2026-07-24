import { test, expect } from "@playwright/test";
import os from "node:os";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createEmptyProject } from "../src/resume/projectSchema.js";
import {
  MAX_MEDIA_ASSET_BYTES,
  MAX_UNCOMPRESSED_BYTES,
  serializeProjectArchive,
} from "../src/resume/projectFile.js";

const BUDGETS = {
  small: { totalImportMs: 200, schedulerDelayProxyMs: 50 },
  typical: { totalImportMs: 500, schedulerDelayProxyMs: 100 },
};
const SCHEDULER_PULSE_MS = 10;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0];
const PROFILE_COLLECTIONS = [
  "domains",
  "skills",
  "experience",
  "projects",
  "achievements",
  "certifications",
  "education",
];

function deterministicPngBytes(size, compressible) {
  const bytes = new Uint8Array(size);
  bytes.set(PNG_SIGNATURE);
  if (compressible) {
    for (let index = PNG_SIGNATURE.length; index < bytes.length; index += 1) {
      bytes[index] = index % 251;
    }
    return bytes;
  }

  let state = 0x12345678;
  for (let index = PNG_SIGNATURE.length; index < bytes.length; index += 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    bytes[index] = state >>> 24;
  }
  return bytes;
}

function addSyntheticProfileEntries(project, count) {
  const description = "Deterministic local benchmark content. ".repeat(8);
  project.profile.experience = Array.from({ length: count }, (_, index) => ({
    id: `experience-${index}`,
    company: `Synthetic Company ${index}`,
    role: "Software Engineer",
    startDate: "2024-01",
    endDate: "2025-01",
    description,
    tools: "React, JavaScript, IndexedDB",
    isCurrentlyWorking: false,
  }));
  project.profile.projects = Array.from({ length: count }, (_, index) => ({
    id: `project-${index}`,
    name: `Synthetic Project ${index}`,
    techStack: "React / JavaScript",
    startDate: "2024-01",
    endDate: "2025-01",
    description,
    link: `https://example.test/project-${index}`,
    isCurrentProject: false,
  }));
}

function createScenario({ name, assetCount, assetBytes, profileEntries, compressible, iterations }) {
  const project = createEmptyProject();
  PROFILE_COLLECTIONS.forEach((collection) => {
    project.profile[collection].forEach((entry, index) => {
      entry.id = `${name}-${collection}-${index}`;
    });
  });
  project.resumes[0].id = `${name}-resume`;
  project.profile.personalInfo.fullName = `Synthetic ${name} Benchmark`;
  addSyntheticProfileEntries(project, profileEntries);

  const assets = Array.from({ length: assetCount }, (_, index) => ({
    id: `${name}-asset-${index}`,
    kind: index === 0 ? "profile-image" : "project-image",
    name: `${name}-${index}.png`,
    mimeType: "image/png",
    bytes: deterministicPngBytes(assetBytes, compressible),
  }));
  if (assets.length > 0) {
    project.portfolio.media.profileImageId = assets[0].id;
    project.portfolio.media.projectGalleryIds[project.profile.projects[0].id] = assets
      .slice(1)
      .map((asset) => asset.id);
  }

  const archive = serializeProjectArchive(project, {
    assets,
    exportedAt: "2026-07-24T00:00:00.000Z",
  });
  return {
    name,
    archive,
    iterations,
    expandedBytes: assets.reduce((total, asset) => total + asset.bytes.byteLength, 0),
    assetCount,
    profileEntries,
  };
}

function percentile(values, fraction) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * fraction) - 1];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function schedulerDelayBucket(value) {
  if (value <= 0) return 0;
  return Math.ceil(value / SCHEDULER_PULSE_MS) * SCHEDULER_PULSE_MS;
}

async function measureScenario(page, scenario) {
  const measurements = await page.evaluate(
    async ({ archive, iterations }) => {
      const { readProjectBundleFile } = await import("/src/resume/projectFile.js");
      const bytes = new Uint8Array(archive);
      const results = [];

      for (let iteration = 0; iteration < iterations; iteration += 1) {
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const longTasks = [];
        const observer = new PerformanceObserver((list) => longTasks.push(...list.getEntries()));
        observer.observe({ type: "longtask", buffered: false });
        const schedulerPulseMs = 10;
        let lastSchedulerPulse = performance.now();
        let maxSchedulerDelayMs = 0;
        const schedulerMonitor = setInterval(() => {
          const now = performance.now();
          maxSchedulerDelayMs = Math.max(maxSchedulerDelayMs, now - lastSchedulerPulse - schedulerPulseMs);
          lastSchedulerPulse = now;
        }, schedulerPulseMs);
        await new Promise((resolve) => setTimeout(resolve, schedulerPulseMs * 2));
        maxSchedulerDelayMs = 0;
        lastSchedulerPulse = performance.now();

        const file = new File([bytes], "Synthetic_ZenID_Project.zenid", {
          type: "application/vnd.zenid.project+zip",
        });
        const start = performance.now();
        const bundle = await readProjectBundleFile(file);
        const end = performance.now();

        await new Promise((resolve) => setTimeout(resolve, schedulerPulseMs * 2));
        clearInterval(schedulerMonitor);
        await new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
        longTasks.push(...observer.takeRecords());
        observer.disconnect();
        const overlappingTasks = longTasks.filter(
          (entry) => entry.startTime <= end && entry.startTime + entry.duration >= start
        );
        const longestTaskMs = overlappingTasks.length
          ? Math.max(...overlappingTasks.map((entry) => entry.duration))
          : null;

        results.push({
          totalImportMs: end - start,
          longestTaskMs,
          rawSchedulerDelayMs: Math.max(0, maxSchedulerDelayMs),
          restoredAssets: bundle.assets.length,
          restoredResumes: bundle.project.resumes.length,
        });
      }
      return results;
    },
    { archive: scenario.archive, iterations: scenario.iterations }
  );

  const totalImportValues = measurements.map((measurement) => measurement.totalImportMs);
  const schedulerDelayProxyValues = measurements.map((measurement) =>
    schedulerDelayBucket(measurement.rawSchedulerDelayMs)
  );
  const longestTaskValues = measurements
    .map((measurement) => measurement.longestTaskMs)
    .filter((value) => value !== null);
  const budget = BUDGETS[scenario.name] || null;
  const maxSchedulerDelayProxyMs = Math.max(...schedulerDelayProxyValues);
  const metrics = {
    totalImportMs: {
      median: round(percentile(totalImportValues, 0.5)),
      p95: round(percentile(totalImportValues, 0.95)),
      max: round(Math.max(...totalImportValues)),
    },
    mainThreadResponsiveness: {
      maxSchedulerDelayProxyMs,
      schedulerPulseIntervalMs: SCHEDULER_PULSE_MS,
      reportingResolutionMs: SCHEDULER_PULSE_MS,
      reportingRule: "each observed delay is rounded up to the next 10 ms bucket",
      interpretation:
        "responsiveness proxy, not a precise blocking duration; pulse boundaries can under- or over-represent where an import stalls the main thread",
      longTaskDiagnostic: {
        status: longestTaskValues.length ? "observed" : "unavailable-for-corroboration",
        maxOverlappingDurationMs: longestTaskValues.length ? round(Math.max(...longestTaskValues)) : null,
        interpretation: longestTaskValues.length
          ? "diagnostic overlapping Long Task observation"
          : "no overlapping entries were delivered; this does not establish that no blocking occurred",
      },
    },
  };
  const thresholds = budget
    ? {
        mode: "enforced",
        totalImportMs: {
          budget: budget.totalImportMs,
          measuredP95: metrics.totalImportMs.p95,
          pass: metrics.totalImportMs.p95 <= budget.totalImportMs,
        },
        schedulerDelayProxyMs: {
          budget: budget.schedulerDelayProxyMs,
          measuredMax: metrics.mainThreadResponsiveness.maxSchedulerDelayProxyMs,
          pass: metrics.mainThreadResponsiveness.maxSchedulerDelayProxyMs <= budget.schedulerDelayProxyMs,
        },
      }
    : { mode: "measurement-only" };
  const passFail = budget
    ? thresholds.totalImportMs.pass && thresholds.schedulerDelayProxyMs.pass
      ? "pass"
      : "fail"
    : "measurement-only";

  return {
    scenario: scenario.name,
    measurementMode: budget ? "multi-sample-p95-gate" : "single-sample",
    passFail,
    fixture: {
      archiveBytes: scenario.archive.byteLength,
      expandedMediaBytes: scenario.expandedBytes,
      expandedLimitBytes: MAX_UNCOMPRESSED_BYTES,
      expandedLimitUtilization: round(scenario.expandedBytes / MAX_UNCOMPRESSED_BYTES),
      assetCount: scenario.assetCount,
      profileEntriesPerCollection: scenario.profileEntries,
    },
    iterations: scenario.iterations,
    samples: measurements.map((measurement) => ({
      totalImportMs: round(measurement.totalImportMs),
      schedulerDelayProxyMs: schedulerDelayBucket(measurement.rawSchedulerDelayMs),
      longestTaskMs: measurement.longestTaskMs === null ? null : round(measurement.longestTaskMs),
    })),
    metrics,
    thresholds,
  };
}

test("records local ZenID import performance and enforces approved budgets", async ({ page, browserName }, testInfo) => {
  test.setTimeout(120_000);
  const scenarios = [
    createScenario({
      name: "small",
      assetCount: 0,
      assetBytes: 0,
      profileEntries: 1,
      compressible: true,
      iterations: 7,
    }),
    createScenario({
      name: "typical",
      assetCount: 3,
      assetBytes: 512 * 1024,
      profileEntries: 12,
      compressible: false,
      iterations: 5,
    }),
    createScenario({
      name: "near-limit",
      assetCount: 9,
      assetBytes: MAX_MEDIA_ASSET_BYTES - 1024,
      profileEntries: 30,
      compressible: true,
      iterations: 1,
    }),
  ];

  await page.goto("/resume");
  await page.evaluate(async () => {
    const { readProjectBundleFile } = await import("/src/resume/projectFile.js");
    await readProjectBundleFile(new File([], "warmup.zenid")).catch(() => {});
  });

  const environment = await page.evaluate(() => {
    const reportedDeviceMemory = navigator.deviceMemory;
    const hasStandardDeviceMemoryValue =
      typeof reportedDeviceMemory === "number" && reportedDeviceMemory >= 0.25 && reportedDeviceMemory <= 8;
    return {
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      browserDeviceMemoryGiB: hasStandardDeviceMemoryValue ? reportedDeviceMemory : null,
      browserDeviceMemoryStatus: hasStandardDeviceMemoryValue ? "reported" : "unavailable-or-nonstandard",
      crossOriginIsolated,
      longTaskApiSupported: PerformanceObserver.supportedEntryTypes.includes("longtask"),
    };
  });
  expect(environment.longTaskApiSupported, "Chromium must expose the Long Tasks API").toBe(true);

  const results = [];
  for (const scenario of scenarios) {
    results.push(await measureScenario(page, scenario));
  }

  const report = {
    benchmark: "zenid-project-import",
    formatVersion: 2,
    generatedAt: new Date().toISOString(),
    importApi: "readProjectBundleFile",
    environment: {
      browserName,
      browserVersion: await page.context().browser().version(),
      headless: true,
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      osRelease: os.release(),
      cpuModel: os.cpus()[0]?.model || "unknown",
      logicalCpuCount: os.cpus().length,
      ...environment,
    },
    results,
  };

  await mkdir(testInfo.outputDir, { recursive: true });
  const reportPath = path.join(testInfo.outputDir, "project-import-benchmark.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach("project-import-benchmark", {
    path: reportPath,
    contentType: "application/json",
  });
  console.log(`ZENID_IMPORT_BENCHMARK=${JSON.stringify(report)}`);

  for (const result of results.filter(({ thresholds }) => thresholds.mode === "enforced")) {
    expect(
      result.thresholds.totalImportMs.pass,
      `${result.scenario} p95 import ${result.thresholds.totalImportMs.measuredP95} ms exceeds ${result.thresholds.totalImportMs.budget} ms`
    ).toBe(true);
    expect(
      result.thresholds.schedulerDelayProxyMs.pass,
      `${result.scenario} scheduler-delay proxy ${result.thresholds.schedulerDelayProxyMs.measuredMax} ms exceeds ${result.thresholds.schedulerDelayProxyMs.budget} ms`
    ).toBe(true);
  }
});
