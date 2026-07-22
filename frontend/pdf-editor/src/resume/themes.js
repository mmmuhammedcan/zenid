// Exactly 4 curated accent colors — intentionally not a free-form picker, to
// keep every generated resume looking deliberate rather than user-clashed.
export const ACCENT_THEMES = [
  { id: "slate", label: "Soft Slate", hex: "#475364" },
  { id: "navy", label: "Deep Navy", hex: "#1F2A44" },
  { id: "sage", label: "Sage Green", hex: "#4B5D46" },
  { id: "burgundy", label: "Muted Burgundy", hex: "#5C2A38" },
];

export const DEFAULT_ACCENT = ACCENT_THEMES[0].hex;
