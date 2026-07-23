import test from "node:test";
import assert from "node:assert/strict";
import { restoreCanvasSnapshot } from "./canvasRestore.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("canvas restore waits for every Fabric object before rendering and returning state", async () => {
  const load = deferred();
  const calls = [];
  const restored = { objects: [{ type: "i-text" }, { type: "image" }] };
  const canvas = {
    loadFromJSON: () => {
      calls.push("load:start");
      return load.promise;
    },
    renderAll: () => calls.push("render"),
    toJSON: () => {
      calls.push("snapshot");
      return restored;
    },
  };

  const operation = restoreCanvasSnapshot(canvas, { objects: [{ type: "i-text" }] }, {
    onBeforeLoad: () => calls.push("guard:on"),
    onAfterLoad: () => calls.push("guard:off"),
  });

  await Promise.resolve();
  assert.deepEqual(calls, ["guard:on", "load:start"]);

  load.resolve();
  assert.equal(await operation, restored);
  assert.deepEqual(calls, ["guard:on", "load:start", "render", "snapshot", "guard:off"]);
});

test("canvas restore releases its guard and does not render when Fabric rejects", async () => {
  const calls = [];
  const canvas = {
    loadFromJSON: async () => {
      calls.push("load:start");
      throw new Error("invalid Fabric JSON");
    },
    renderAll: () => calls.push("render"),
    toJSON: () => calls.push("snapshot"),
  };

  await assert.rejects(
    restoreCanvasSnapshot(canvas, { objects: [] }, {
      onBeforeLoad: () => calls.push("guard:on"),
      onAfterLoad: () => calls.push("guard:off"),
    }),
    /invalid Fabric JSON/
  );
  assert.deepEqual(calls, ["guard:on", "load:start", "guard:off"]);
});
