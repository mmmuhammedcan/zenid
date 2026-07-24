import test from "node:test";
import assert from "node:assert/strict";
import { openProjectFileAtomically } from "./projectImport.js";

test("project import prepares, persists, and commits in order", async () => {
  const calls = [];
  const bundle = { project: { id: "incoming" }, assets: [{ id: "photo" }] };

  const result = await openProjectFileAtomically({ name: "project.zenid" }, {
    readBundle: async () => {
      calls.push("prepare");
      return bundle;
    },
    persistAssets: async (assets) => {
      calls.push(`persist:${assets[0].id}`);
    },
    commitProject: (project) => {
      calls.push(`commit:${project.id}`);
    },
  });

  assert.equal(result, bundle);
  assert.deepEqual(calls, ["prepare", "persist:photo", "commit:incoming"]);
});

test("project import does not persist or commit when preparation fails", async () => {
  const calls = [];

  await assert.rejects(
    openProjectFileAtomically({ name: "invalid.zenid" }, {
      readBundle: async () => {
        calls.push("prepare");
        throw new Error("invalid archive");
      },
      persistAssets: async () => calls.push("persist"),
      commitProject: () => calls.push("commit"),
    }),
    /invalid archive/
  );

  assert.deepEqual(calls, ["prepare"]);
});

test("project import keeps the current project when media persistence fails", async () => {
  const currentProject = { id: "current" };
  let visibleProject = currentProject;
  const bundle = { project: { id: "incoming" }, assets: [{ id: "photo" }] };

  await assert.rejects(
    openProjectFileAtomically({ name: "project.zenid" }, {
      readBundle: async () => bundle,
      persistAssets: async () => {
        throw new Error("local media storage failed");
      },
      commitProject: (project) => {
        visibleProject = project;
      },
    }),
    /local media storage failed/
  );

  assert.equal(visibleProject, currentProject);
});
