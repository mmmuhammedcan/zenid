import test from "node:test";
import assert from "node:assert/strict";
import { markdownLiteToHtml } from "./markdownLite.js";

test("markdown-lite renders supported formatting and escapes HTML", () => {
  const result = markdownLiteToHtml("**Bold** and __underlined__\n- [Profile](https://example.com)\n<script>");

  assert.match(result, /<strong>Bold<\/strong>/);
  assert.match(result, /<u>underlined<\/u>/);
  assert.match(result, /<ul/);
  assert.match(result, /href="https:\/\/example.com\/"/);
  assert.doesNotMatch(result, /<script>/);
  assert.match(result, /&lt;script&gt;/);
});

test("markdown-lite rejects executable and attribute-breaking links", () => {
  const result = markdownLiteToHtml('[Unsafe](javascript:alert(1))\n[Injected](https://example.com" onmouseover="alert(1))');

  assert.doesNotMatch(result, /javascript:/i);
  assert.doesNotMatch(result, /onmouseover=/i);
  assert.doesNotMatch(result, /href=/i);
  assert.match(result, /Unsafe/);
  assert.match(result, /Injected/);
});
