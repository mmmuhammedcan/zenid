// SPEC-011 T010/T011 — protocol conformance and the network boundary.
//
// This drives the real server over a real stdio transport with a real MCP
// client, in a subprocess, because the thing worth proving is that a user's
// agent client can actually talk to it, not that our own functions call each
// other.
//
// T011: the subprocess runs with outbound sockets stubbed to throw, so a
// session that covers open, edit, validate, save, and both exports proves the
// server never reaches the network (AC-011, BR-001).

import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import {
  CURRENT_SCHEMA_VERSION,
  normalizeProject,
} from "../../../frontend/pdf-editor/src/resume/projectSchema.js";
import { parseProjectFileBytes, serializeProjectArchive } from "../../../frontend/pdf-editor/src/resume/projectFile.js";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(packageDirectory, "src/server.js");
// Refuses every outbound connection, so any network attempt fails loudly
// instead of silently succeeding on a machine that happens to be online.
const noNetworkPath = path.join(packageDirectory, "test/no-network.js");

function syntheticProject() {
  return normalizeProject({
    schemaVersion: CURRENT_SCHEMA_VERSION,
    profile: {
      personalInfo: {
        fullName: "Ada Yılmaz",
        title: "Software Engineer",
        email: "ada@example.test",
        city: "Ankara",
      },
      skills: [{ id: "skill-programming", category: "Programming", items: "JavaScript, Python" }],
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
      projects: [{ id: "project-docs", name: "Local Document Workspace", description: "Local-first." }],
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

async function startClient() {
  const directory = await mkdtemp(path.join(tmpdir(), "zenid-mcp-protocol-"));
  const projectPath = path.join(directory, "project.zenid");
  await writeFile(projectPath, Buffer.from(serializeProjectArchive(syntheticProject())));

  const client = new Client({ name: "zenid-mcp-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    // AC-011: the server subprocess cannot open a socket.
    args: ["--import", `file://${noNetworkPath}`, serverPath],
    stderr: "pipe",
  });
  await client.connect(transport);
  return { client, directory, projectPath, close: () => client.close() };
}

function payload(result) {
  return JSON.parse(result.content[0].text);
}

test("the server advertises the documented tool surface over stdio", async () => {
  const { client, close } = await startClient();
  try {
    const { tools } = await client.listTools();
    const names = tools.map((tool) => tool.name).sort();
    assert.deepEqual(names, [
      "zenid_create_resume_variant",
      "zenid_describe_format",
      "zenid_edit_fact",
      "zenid_export_portfolio_zip",
      "zenid_export_resume_pdf",
      "zenid_list_resumes",
      "zenid_open_project",
      "zenid_read_section",
      "zenid_reset_wording",
      "zenid_save_project",
      "zenid_set_item_selection",
      "zenid_set_portfolio_settings",
      "zenid_set_wording",
      "zenid_validate",
    ]);
    for (const tool of tools) {
      assert.ok(tool.description, `${tool.name} has no description for the agent to read`);
    }
  } finally {
    await close();
  }
});

// AC-012: the rules ship as data, and report the live schema version so they
// cannot drift from the code without this failing.
test("zenid_describe_format reports the current schema and the editing rules", async () => {
  const { client, close } = await startClient();
  try {
    const described = payload(await client.callTool({ name: "zenid_describe_format", arguments: {} }));
    assert.equal(described.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.match(described.presentationVersusFact.fact, /zenid_edit_fact/);
    assert.match(described.publicationRules.rule, /never widen/);
    assert.match(described.saving, /new file by default/);
  } finally {
    await close();
  }
});

test("a full local session applies an edit, refuses a violation, and writes files", async () => {
  const { client, directory, projectPath, close } = await startClient();
  try {
    const summary = payload(
      await client.callTool({ name: "zenid_open_project", arguments: { path: projectPath } })
    );
    assert.equal(summary.schemaVersion, CURRENT_SCHEMA_VERSION);
    assert.equal(summary.sections.experience, 1);

    // One applied edit.
    const worded = payload(
      await client.callTool({
        name: "zenid_set_wording",
        arguments: {
          resumeId: "resume-general",
          field: "experience",
          itemId: "experience-labs",
          description: "Shipped a privacy-first document workflow.",
        },
      })
    );
    assert.equal(worded.applied, true);
    assert.equal(worded.changes[0].after, "Shipped a privacy-first document workflow.");

    // One refusal, reported as a tool error rather than a crashed session.
    const refusal = await client.callTool({
      name: "zenid_set_portfolio_settings",
      arguments: { updates: { contactPrivacy: { email: true } } },
    });
    assert.equal(refusal.isError, true);
    assert.equal(payload(refusal).error, "PUBLICATION_WIDENED");

    // The refusal left the project alone and the session usable.
    const validated = payload(await client.callTool({ name: "zenid_validate", arguments: {} }));
    assert.equal(validated.valid, true);

    const saved = payload(await client.callTool({ name: "zenid_save_project", arguments: {} }));
    assert.notEqual(saved.path, projectPath, "the opened file must not be overwritten by default");
    const reopened = parseProjectFileBytes(new Uint8Array(await readFile(saved.path)));
    assert.equal(
      reopened.resumes[0].contentOverrides.experience["experience-labs"].description,
      "Shipped a privacy-first document workflow."
    );
    assert.equal(
      reopened.profile.experience[0].description,
      "Built a local-first document workflow.",
      "the canonical fact must be untouched"
    );

    const pdf = payload(
      await client.callTool({
        name: "zenid_export_resume_pdf",
        arguments: { path: path.join(directory, "resume.pdf") },
      })
    );
    const pdfBytes = await readFile(pdf.path);
    assert.equal(pdfBytes.subarray(0, 4).toString("latin1"), "%PDF");
    // A helvetica fallback would be far smaller; this asserts the real fonts
    // were embedded under Node, which is the export-parity property.
    assert.ok(pdfBytes.byteLength > 20000, "the exported PDF did not embed the Unicode fonts");

    const zip = payload(
      await client.callTool({
        name: "zenid_export_portfolio_zip",
        arguments: { path: path.join(directory, "portfolio.zip") },
      })
    );
    const zipBytes = await readFile(zip.path);
    assert.equal(zipBytes.subarray(0, 2).toString("latin1"), "PK");

    // AC-009: an unpublished contact field must not appear in the public ZIP.
    assert.doesNotMatch(zipBytes.toString("latin1"), /ada@example\.test/);
  } finally {
    await close();
  }
});

test("a wording tool refuses a factual change over the protocol", async () => {
  const { client, projectPath, close } = await startClient();
  try {
    await client.callTool({ name: "zenid_open_project", arguments: { path: projectPath } });
    const refusal = await client.callTool({
      name: "zenid_set_wording",
      arguments: {
        resumeId: "resume-general",
        field: "experience",
        itemId: "experience-labs",
        company: "Better Labs",
        description: "Reworded.",
      },
    });
    assert.equal(refusal.isError, true);
    const body = payload(refusal);
    assert.equal(body.error, "PRESENTATION_BOUNDARY");
    assert.match(body.message, /zenid_edit_fact/);
  } finally {
    await close();
  }
});

test("tools refuse cleanly when no project is open", async () => {
  const { client, close } = await startClient();
  try {
    const refusal = await client.callTool({ name: "zenid_validate", arguments: {} });
    assert.equal(refusal.isError, true);
    assert.equal(payload(refusal).error, "NO_OPEN_PROJECT");
  } finally {
    await close();
  }
});
