// SPEC-011 T003 — export parity between the application host and the Node host.
//
// The MCP plugin will produce résumé PDFs and portfolio ZIPs outside the
// browser. If the Node host drifts from the browser host, a user's
// agent-produced document would differ from the one the application shows them
// and nothing else in the suite would notice. This test pins the two together
// for one synthetic project.
//
// The "application" side is exercised by giving `buildResumePdf` no font data
// and stubbing `window`, `fetch`, and `btoa` the way a page supplies them, so
// the browser code path in `loadFontDataFromAssets` actually runs.

import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";

import { bytesToBase64, loadResumeFontData, RESUME_FONT_FILES } from "./nodeHost.js";
import { CURRENT_SCHEMA_VERSION, materializeResumeData, normalizeProject } from "../resume/projectSchema.js";
import { parseProjectFileBytes, serializeProjectArchive } from "../resume/projectFile.js";
import { serializePortfolioSite } from "../portfolio/portfolioSiteExport.js";
import { buildResumePdf } from "../resume/resumePdfExport.js";

const fontDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../public/assets/fonts"
);

function syntheticProject() {
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      personalInfo: {
        fullName: "Ada Yılmaz",
        title: "Software Engineer",
        email: "ada@example.test",
        city: "Ankara",
        summary: "Synthetic parity fixture: Türkçe, English, Français.",
      },
      domains: [{ id: "domain-software", text: "Software Engineering" }],
      skills: [{ id: "skill-programming", category: "Programming", items: "JavaScript, Python" }],
      experience: [
        {
          id: "experience-example",
          company: "Example Labs",
          role: "Software Engineering Intern",
          startDate: "2025-06",
          endDate: "2025-08",
          description: "Built a local-first document workflow.",
          tools: "React, Node.js",
          isCurrentlyWorking: false,
        },
      ],
      projects: [
        {
          id: "project-local-docs",
          name: "Local Document Workspace",
          techStack: "React / IndexedDB / PDF",
          description: "A **local-first** résumé workspace.",
        },
      ],
    },
    resumes: [
      {
        id: "resume-general",
        name: "Ada Yılmaz — General Resume",
        language: "en",
        template: "minimal",
        accentColor: "#1F2A44",
        selectedItems: {},
        contentOverrides: {},
      },
    ],
    portfolio: { headline: "Software Engineer", about: "Synthetic portfolio fixture." },
  });
}

// jsPDF stamps a creation date and a document ID derived from it, so two
// otherwise identical documents differ by those bytes alone. Parity is about
// the rendered content, not the timestamp.
function withoutVolatileMetadata(bytes) {
  return Buffer.from(bytes)
    .toString("latin1")
    .replace(/\/CreationDate\s*\([^)]*\)/g, "/CreationDate()")
    .replace(/\/ID\s*\[[^\]]*\]/g, "/ID[]");
}

async function withBrowserFontHost(run) {
  const originals = {
    window: globalThis.window,
    fetch: globalThis.fetch,
    btoa: globalThis.btoa,
  };
  const files = new Map(
    await Promise.all(
      Object.values(RESUME_FONT_FILES).map(async (fileName) => [
        fileName,
        await readFile(path.join(fontDirectory, fileName)),
      ])
    )
  );
  globalThis.window = {};
  globalThis.btoa = (binary) => Buffer.from(binary, "latin1").toString("base64");
  globalThis.fetch = async (url) => {
    const fileName = String(url).split("/").pop();
    const buffer = files.get(fileName);
    if (!buffer) return { ok: false };
    return { ok: true, arrayBuffer: async () => buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) };
  };
  try {
    return await run();
  } finally {
    globalThis.window = originals.window;
    globalThis.fetch = originals.fetch;
    globalThis.btoa = originals.btoa;
  }
}

test("the Node host encodes base64 identically to the browser btoa path", async () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
  const browserEncoded = Buffer.from(
    String.fromCharCode(...bytes),
    "latin1"
  ).toString("base64");
  assert.equal(bytesToBase64(bytes), browserEncoded);
});

test("the Node host loads the same font bytes the application fetches", async () => {
  const nodeFontData = await loadResumeFontData();
  for (const [style, fileName] of Object.entries(RESUME_FONT_FILES)) {
    const expected = bytesToBase64(await readFile(path.join(fontDirectory, fileName)));
    assert.equal(nodeFontData[style], expected, `font face ${style} differs`);
  }
});

test("résumé PDF output matches between the application host and the Node host", async () => {
  const project = syntheticProject();
  const resumeData = materializeResumeData(project, project.resumes[0].id);

  const applicationDoc = await withBrowserFontHost(() =>
    buildResumePdf({ resumeData, language: "en" })
  );
  const nodeDoc = await buildResumePdf({
    resumeData,
    language: "en",
    fontData: await loadResumeFontData(),
  });

  const applicationBytes = new Uint8Array(applicationDoc.output("arraybuffer"));
  const nodeBytes = new Uint8Array(nodeDoc.output("arraybuffer"));

  // A fallback to helvetica would shrink the file dramatically; assert the
  // embedded Unicode font is actually present on both sides.
  assert.ok(applicationBytes.byteLength > 20000, "the application PDF did not embed the Unicode fonts");
  assert.equal(
    withoutVolatileMetadata(nodeBytes),
    withoutVolatileMetadata(applicationBytes)
  );
});

test("portfolio ZIP output is identical when produced under Node", () => {
  const project = syntheticProject();
  const first = serializePortfolioSite(project);
  const second = serializePortfolioSite(project);
  assert.deepEqual(Array.from(second), Array.from(first));

  const entries = unzipSync(first);
  assert.ok(entries["index.html"], "the portfolio ZIP is missing index.html");
});

test("a project archive written under Node reopens to the same project", () => {
  const project = syntheticProject();
  const archive = serializeProjectArchive(project);
  const reopened = parseProjectFileBytes(archive);
  assert.deepEqual(reopened, project);
});
