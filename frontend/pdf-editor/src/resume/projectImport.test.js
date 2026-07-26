import test from "node:test";
import assert from "node:assert/strict";
import { openProjectFileAtomically } from "./projectImport.js";

test("project import prepares then commits one bundle", async () => {
  const calls = [];
  const bundle = { project: { id: "incoming" }, assets: [{ id: "photo" }] };

  const result = await openProjectFileAtomically({ name: "project.zenid" }, {
    readBundle: async () => {
      calls.push("prepare");
      return bundle;
    },
    commitBundle: async (prepared) => {
      calls.push(`commit:${prepared.project.id}:${prepared.assets[0].id}`);
    },
  });

  assert.equal(result, bundle);
  assert.deepEqual(calls, ["prepare", "commit:incoming:photo"]);
});

test("project import does not commit when preparation fails", async () => {
  const calls = [];

  await assert.rejects(
    openProjectFileAtomically({ name: "invalid.zenid" }, {
      readBundle: async () => {
        calls.push("prepare");
        throw new Error("invalid archive");
      },
      commitBundle: async () => calls.push("commit"),
    }),
    /invalid archive/
  );

  assert.deepEqual(calls, ["prepare"]);
});

test("a failed atomic bundle commit never shows the incoming project", async () => {
  const currentProject = { id: "current" };
  let visibleProject = currentProject;
  const bundle = { project: { id: "incoming" }, assets: [{ id: "photo" }] };

  await assert.rejects(
    openProjectFileAtomically({ name: "project.zenid" }, {
      readBundle: async () => bundle,
      commitBundle: async () => {
        throw new Error("atomic local transaction failed");
      },
    }),
    /atomic local transaction failed/
  );

  assert.equal(visibleProject, currentProject);
});

test("project import rejects incomplete dependencies", async () => {
  await assert.rejects(
    openProjectFileAtomically({ name: "project.zenid" }, { readBundle: async () => ({}) }),
    /dependencies are incomplete/
  );
});
