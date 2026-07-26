import { cp, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const frontendDirectory = resolve("frontend/pdf-editor");
const frontendOutput = resolve(frontendDirectory, "dist");
const siteOutput = resolve("dist");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("npm", ["ci", "--prefix", frontendDirectory]);
run("npm", ["run", "build", "--prefix", frontendDirectory]);

await rm(siteOutput, { recursive: true, force: true });
await cp(frontendOutput, siteOutput, { recursive: true });

console.log(JSON.stringify({
  check: "site-build-adapter",
  source: "frontend/pdf-editor/dist",
  output: "dist",
}));
