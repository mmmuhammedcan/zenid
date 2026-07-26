import test from "node:test";
import assert from "node:assert/strict";
import { contrastTextColor } from "./accessibleColor.js";

const ACCENTS = ["#d97706", "#2563eb", "#059669", "#7c3aed", "#e11d48"];

function luminance(hexColor) {
  const hex = hexColor.replace("#", "");
  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

test("every portfolio accent chooses WCAG AA contrast text", () => {
  ACCENTS.forEach((accent) => {
    assert.ok(contrast(accent, contrastTextColor(accent)) >= 4.5, accent);
  });
});
