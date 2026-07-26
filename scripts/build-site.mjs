import { cp, copyFile, mkdir, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const frontendDirectory = resolve("frontend/pdf-editor");
const frontendOutput = resolve(frontendDirectory, "dist");
const siteOutput = resolve("dist");
const clientOutput = resolve(siteOutput, "client");
const serverOutput = resolve(siteOutput, "server");

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
await mkdir(serverOutput, { recursive: true });
await mkdir(resolve(siteOutput, ".openai"), { recursive: true });
await cp(frontendOutput, clientOutput, { recursive: true });
await copyFile(resolve("scripts/static-site-worker.js"), resolve(serverOutput, "index.js"));
await copyFile(resolve(".openai/hosting.json"), resolve(siteOutput, ".openai/hosting.json"));

console.log(JSON.stringify({
  check: "site-build-adapter",
  source: "frontend/pdf-editor/dist",
  staticOutput: "dist/client",
  workerEntrypoint: "dist/server/index.js",
}));
