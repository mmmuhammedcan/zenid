import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const expectedBase = process.argv[2];
assert.match(expectedBase || "", /^\/(?:[^/]+\/)*$/, "Pass an absolute Vite base ending in '/'.");

const index = await readFile(resolve("dist/index.html"), "utf8");
const fallback = await readFile(resolve("dist/404.html"), "utf8");
assert.equal(fallback, index, "The SPA fallback must match the built application shell.");

const references = [
  ...index.matchAll(/(?:src|href)="([^"]+)"/g),
].map((match) => match[1]).filter((reference) => !reference.startsWith("data:"));

assert.ok(references.length > 0, "The built application must contain asset references.");
references.forEach((reference) => {
  assert.ok(
    reference.startsWith(expectedBase),
    `Built reference '${reference}' does not use expected base '${expectedBase}'.`
  );
});

console.log(JSON.stringify({
  check: "deploy-output",
  expectedBase,
  references: references.length,
  spaFallback: true,
}));
