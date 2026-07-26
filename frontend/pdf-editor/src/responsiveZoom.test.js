import test from "node:test";
import assert from "node:assert/strict";
import { initialDocumentZoom } from "./responsiveZoom.js";

test("fits a rendered A4 page inside a narrow mobile viewport", () => {
  assert.equal(initialDocumentZoom({ viewportWidth: 412, documentWidth: 892.5 }), 42);
});

test("preserves the normal 100 percent desktop initial zoom", () => {
  assert.equal(initialDocumentZoom({ viewportWidth: 1280, documentWidth: 892.5 }), 100);
});

test("does not exceed the supported zoom bounds", () => {
  assert.equal(initialDocumentZoom({ viewportWidth: 240, documentWidth: 2000 }), 25);
  assert.equal(initialDocumentZoom({ viewportWidth: 900, documentWidth: 400 }), 100);
});

test("falls back safely when dimensions are unavailable", () => {
  assert.equal(initialDocumentZoom({ viewportWidth: 412, documentWidth: 0 }), 100);
});
