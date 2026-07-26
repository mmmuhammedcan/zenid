import test from "node:test";
import assert from "node:assert/strict";
import { mediaRecordMatchesArchiveAsset } from "./assetStore.js";

function archiveAsset(bytes = [1, 2, 3]) {
  return {
    id: "stable-media-id",
    kind: "profile-image",
    name: "profile.png",
    mimeType: "image/png",
    bytes: new Uint8Array(bytes),
  };
}

function storedRecord(bytes = [1, 2, 3]) {
  return {
    id: "stable-media-id",
    kind: "profile-image",
    name: "profile.png",
    mimeType: "image/png",
    blob: new Blob([new Uint8Array(bytes)], { type: "image/png" }),
  };
}

test("identical imported media can safely reuse an existing stable identifier", async () => {
  assert.equal(await mediaRecordMatchesArchiveAsset(storedRecord(), archiveAsset()), true);
});

test("a stable media identifier cannot be reused for different bytes or metadata", async () => {
  assert.equal(await mediaRecordMatchesArchiveAsset(storedRecord(), archiveAsset([1, 2, 4])), false);
  assert.equal(
    await mediaRecordMatchesArchiveAsset(
      { ...storedRecord(), name: "different.png" },
      archiveAsset()
    ),
    false
  );
});
