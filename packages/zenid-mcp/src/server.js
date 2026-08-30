#!/usr/bin/env node
// SPEC-011 T010 — the ZenID MCP server, over local stdio.
//
// The transport is stdio and nothing else. There is no HTTP listener, no
// telemetry, and no outbound request anywhere in this package or the modules it
// imports (BR-001). The user's professional data reaches a model only through
// the client they chose to run, under that client's terms.

import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createSession, createTools } from "./tools.js";

export function createZenidMcpServer() {
  const server = new McpServer({ name: "zenid-mcp", version: "0.1.0" });
  const session = createSession();

  for (const tool of createTools(session)) {
    server.registerTool(tool.name, tool.config, async (args) => {
      try {
        const result = await tool.handler(args || {});
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        // A refusal is a normal, expected outcome here, so it is reported as
        // an actionable tool error rather than crashing the session. The code
        // is preserved so the agent can tell a rule from a mistake.
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { error: error.code || "ERROR", message: error.message },
                null,
                2
              ),
            },
          ],
        };
      }
    });
  }

  return { server, session };
}

async function main() {
  const { server } = createZenidMcpServer();
  await server.connect(new StdioServerTransport());
}

// Only run when executed directly, so tests can import the factory.
//
// npm installs the bin as a symlink, so process.argv[1] is the link path while
// import.meta.url is the resolved one and a naive comparison silently exits
// without ever serving. Comparing real paths is what makes the published
// package actually start.
function isDirectExecution() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectExecution()) {
  main().catch((error) => {
    process.stderr.write(`zenid-mcp failed to start: ${error.message}\n`);
    process.exit(1);
  });
}
