// SPEC-011 T013 — build the publishable bundle.
//
// `npm pack` does not follow relative imports outside the package directory,
// so the source layout that keeps this package honest — importing the very
// modules the application uses, rather than a copy that can drift — is exactly
// the layout that cannot be published as-is. This bundles those modules in.
//
// The fonts are copied too, because the resume export needs real font bytes
// and a published package cannot reach back into the repository for them.

import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const packageDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(packageDirectory, "../..");
const distDirectory = path.join(packageDirectory, "dist");

await rm(distDirectory, { recursive: true, force: true });
await mkdir(distDirectory, { recursive: true });

await build({
  entryPoints: [path.join(packageDirectory, "src/server.js")],
  outfile: path.join(distDirectory, "server.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  // No shebang banner: esbuild preserves the one already on src/server.js,
  // and a second one is a syntax error rather than a comment.
  // Real dependencies stay external and are installed by npm. Only the
  // repository-relative modules need to be inlined.
  external: ["@modelcontextprotocol/sdk/*", "zod", "jspdf", "fflate"],
});

// nodeHost.js looks for the fonts next to itself as well as in the
// application's public directory, so this location is the packaged one.
await mkdir(path.join(distDirectory, "assets/fonts"), { recursive: true });
await cp(
  path.join(repositoryRoot, "frontend/pdf-editor/public/assets/fonts"),
  path.join(distDirectory, "assets/fonts"),
  { recursive: true }
);

process.stdout.write(`${JSON.stringify({ built: "dist/server.js", fonts: "dist/assets/fonts" }, null, 2)}\n`);
