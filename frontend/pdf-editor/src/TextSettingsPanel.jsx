import { useEffect, useState } from "react";
import { Bold, Copy, Italic, Trash2, Underline } from "lucide-react";
import Dropdown from "./Dropdown";
import useDelayedUnmount from "./useDelayedUnmount";

// Web-safe fonts only — no custom font loading needed, renders consistently
// across browsers/OSes without extra setup.
const FONT_OPTIONS = [
  { label: "Sans-serif (Arial)", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif (Times New Roman)", value: "'Times New Roman', Times, serif" },
  { label: "Serif (Georgia)", value: "Georgia, serif" },
  { label: "Monospace (Courier New)", value: "'Courier New', Courier, monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
];

const SIZE_OPTIONS = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72, 96].map((n) => ({
  label: String(n),
  value: n,
}));

// A contextual floating toolbar that hovers above the currently selected
// IText object — position is computed by the parent (it needs the fabric
// canvas's on-screen geometry, which this component doesn't own) and passed
// in as `position`. Fabric objects aren't React state — we mutate the object
// directly and call fabricCanvas.requestRenderAll() to reflect it.
export default function TextSettingsPanel({ visible, textObject, position, fabricCanvas, onDelete, onDuplicate }) {
  const shouldRender = useDelayedUnmount(visible, 200);

  const [fontSize, setFontSize] = useState(16);
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [color, setColor] = useState("#000000");

  // Re-sync the panel whenever a (new) text object becomes the target
  useEffect(() => {
    if (!textObject) return;
    setFontSize(textObject.fontSize);
    setBold(textObject.fontWeight === "bold");
    setItalic(textObject.fontStyle === "italic");
    setUnderline(!!textObject.underline);
    setFontFamily(textObject.fontFamily);
    setColor(textObject.fill || "#000000");
  }, [textObject]);

  if (!shouldRender || !textObject || !position) return null;

  const set = (key, value, setState) => {
    setState(value);
    textObject.set(key, value);
    fabricCanvas.requestRenderAll();
  };

  // Toggles read the CURRENT value directly off the live fabric object rather
  // than trusting the React `bold`/`italic`/`underline` state as the source
  // of truth. Computing the next value from closure state (`bold ? .. : ..`)
  // can drift out of sync with the actual object after enough rapid clicks —
  // this reads the ground truth every time, so it can't get stuck.
  const toggleBold = () => {
    const next = textObject.fontWeight === "bold" ? "normal" : "bold";
    textObject.set("fontWeight", next);
    fabricCanvas.requestRenderAll();
    setBold(next === "bold");
  };
  const toggleItalic = () => {
    const next = textObject.fontStyle === "italic" ? "normal" : "italic";
    textObject.set("fontStyle", next);
    fabricCanvas.requestRenderAll();
    setItalic(next === "italic");
  };
  const toggleUnderline = () => {
    const next = !textObject.underline;
    textObject.set("underline", next);
    fabricCanvas.requestRenderAll();
    setUnderline(next);
  };

  return (
    <div
      style={{ left: position.left, top: position.top }}
      className={`fixed z-40 flex -translate-x-1/2 -translate-y-[calc(100%+12px)] items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all duration-200 ${
        visible ? "translate-y-[calc(-100%-12px)] opacity-100" : "translate-y-[calc(-100%-4px)] opacity-0"
      }`}
    >
      <Dropdown value={fontFamily} options={FONT_OPTIONS} onChange={(v) => set("fontFamily", v, setFontFamily)} className="w-40" />
      <Dropdown value={fontSize} options={SIZE_OPTIONS} onChange={(v) => set("fontSize", v, setFontSize)} className="w-16" />

      <div className="h-6 w-px bg-white/10" />

      <button
        type="button"
        onClick={toggleBold}
        aria-pressed={bold}
        title="Bold"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          bold ? "bg-indigo-500 text-white" : "text-neutral-300 hover:bg-white/10"
        }`}
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={toggleItalic}
        aria-pressed={italic}
        title="Italic"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          italic ? "bg-indigo-500 text-white" : "text-neutral-300 hover:bg-white/10"
        }`}
      >
        <Italic size={16} />
      </button>
      <button
        type="button"
        onClick={toggleUnderline}
        aria-pressed={underline}
        title="Underline"
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
          underline ? "bg-indigo-500 text-white" : "text-neutral-300 hover:bg-white/10"
        }`}
      >
        <Underline size={16} />
      </button>

      <div className="h-6 w-px bg-white/10" />

      <label
        title="Text color"
        className="relative h-7 w-7 shrink-0 cursor-pointer overflow-hidden rounded-full border border-white/20"
        style={{ backgroundColor: color }}
      >
        <input
          type="color"
          value={color}
          onChange={(e) => set("fill", e.target.value, setColor)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>

      <div className="h-6 w-px bg-white/10" />

      <button
        type="button"
        onClick={onDuplicate}
        title="Duplicate (Ctrl+D)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-300 transition-all hover:bg-white/10"
      >
        <Copy size={16} />
      </button>

      <button
        type="button"
        onClick={onDelete}
        title="Delete (or press Delete key)"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
