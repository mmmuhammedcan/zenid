// SPEC-011 T013 — the packed tarball must behave like the tested source.
//
// The publication bundle is a second build path. If it silently omits a module
// or a font, the published package can behave differently from the one every
// other test covers, and the first person to find out would be a user. This
// packs the real tarball, installs it into a clean directory, and drives it
// over stdio the same way a client would.

import assert from "node:assert/strict";
import test from "node:test";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import {
  CURRENT_SCHEMA_VERSION,
  normalizeProject,
} from "../../../frontend/pdf-editor/src/resume/projectSchema.js";
import { serializeProjectArchive } from "../../../frontend/pdf-editor/src/resume/projectFile.js";

const run = promisify(execFile);
const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function syntheticProject() {
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      personalInfo: { fullName: "Ada Yılmaz", title: "Software Engineer", email: "ada@example.test" },
      skills: [{ id: "skill-programming", category: "Programming", items: "JavaScript" }],
      experience: [
        {
          id: "experience-labs",
          company: "Example Labs",
          role: "Software Engineering Intern",
          startDate: "2025-06",
          endDate: "2025-08",
          description: "Built a local-first document workflow.",
          isCurrentlyWorking: false,
        },
      ],
    },
    resumes: [
      {
        id: "resume-general",
        name: "General Resume",
        language: "en",
        template: "minimal",
        accentColor: "#1F2A44",
        selectedItems: {},
        contentOverrides: {},
      },
    ],
  });
}

// Packing and installing is slow but is the only way to see what a user gets.
test("the packed tarball runs a full session on its own", { timeout: 300000 }, async () => {
  const staging = await mkdtemp(path.join(tmpdir(), "zenid-mcp-pack-"));

  const packed = await run("npm", ["pack", "--pack-destination", staging], { cwd: packageDirectory });
  const tarball = path.join(staging, packed.stdout.trim().split("\n").pop());

  const installDirectory = await mkdtemp(path.join(tmpdir(), "zenid-mcp-install-"));
  await writeFile(path.join(installDirectory, "package.json"), JSON.stringify({ name: "consumer", private: true }));
  await run("npm", ["install", "--no-audit", "--no-fund", tarball], { cwd: installDirectory });

  const binaryPath = path.join(installDirectory, "node_modules/.bin/zenid-mcp");
  const projectPath = path.join(installDirectory, "project.zenid");
  await writeFile(projectPath, Buffer.from(serializeProjectArchive(syntheticProject())));

  const client = new Client({ name: "zenid-mcp-pack-test", version: "1.0.0" });
  await client.connect(new StdioClientTransport({ command: binaryPath, args: [], stderr: "pipe" }));

  try {
    const { tools } = await client.listTools();
    assert.equal(tools.length, 15, "the packed server does not expose the full tool surface");

    const opened = JSON.parse(
      (await client.callTool({ name: "zenid_open_project", arguments: { path: projectPath } }))
        .content[0].text
    );
    assert.equal(opened.schemaVersion, CURRENT_SCHEMA_VERSION);

    // The fonts have to travel with the package; without them the export would
    // silently fall back to a different, non-Unicode font.
    const pdfPath = path.join(installDirectory, "resume.pdf");
    const exported = JSON.parse(
      (await client.callTool({ name: "zenid_export_resume_pdf", arguments: { path: pdfPath } }))
        .content[0].text
    );
    const bytes = await readFile(exported.path);
    assert.equal(bytes.subarray(0, 4).toString("latin1"), "%PDF");
    assert.ok(bytes.byteLength > 20000, "the packed server did not embed the Unicode fonts");

    // The guard must survive bundling too.
    const refusal = await client.callTool({
      name: "zenid_set_portfolio_settings",
      arguments: { updates: { contactPrivacy: { email: true } } },
    });
    assert.equal(refusal.isError, true);
    assert.equal(JSON.parse(refusal.content[0].text).error, "PUBLICATION_WIDENED");
  } finally {
    await client.close();
  }
});
