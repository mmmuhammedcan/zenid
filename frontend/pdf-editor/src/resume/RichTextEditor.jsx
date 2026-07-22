import { useRef, useState } from "react";
import { Bold, Eraser, List, ListOrdered, Link2 } from "lucide-react";

// Fully controlled <textarea> instead of contentEditable. contentEditable +
// document.execCommand caused cursor-jump-to-start bugs (looked like RTL
// typing) and broken delete behavior across browsers — a controlled textarea
// is 100% predictable in React because there's only one source of truth
// (the `value` prop), so we keep formatting as a tiny markdown-like syntax
// (see markdownLite.js) applied by the toolbar instead of live-rendered HTML.
export default function RichTextEditor({ value, onChange, placeholder, rows = 6 }) {
  const textareaRef = useRef(null);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const applyToSelection = (transform) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const { newValue, selectionStart, selectionEnd } = transform(value, start, end);
    onChange(newValue);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const wrapSelection = (marker) => {
    applyToSelection((text, start, end) => {
      const selected = text.slice(start, end) || "text";
      const before = text.slice(0, start);
      const after = text.slice(end);
      return {
        newValue: `${before}${marker}${selected}${marker}${after}`,
        selectionStart: start + marker.length,
        selectionEnd: start + marker.length + selected.length,
      };
    });
  };

  const clearFormatting = () => {
    applyToSelection((text, start, end) => {
      const selected = text.slice(start, end);
      const target = selected || text;
      const cleaned = target
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^\s*[-]\s+/gm, "")
        .replace(/^\s*\d+\.\s+/gm, "");
      if (selected) {
        const before = text.slice(0, start);
        const after = text.slice(end);
        return { newValue: `${before}${cleaned}${after}`, selectionStart: start, selectionEnd: start + cleaned.length };
      }
      return { newValue: cleaned, selectionStart: 0, selectionEnd: cleaned.length };
    });
  };

  // Looks at the line immediately above `lineStart` — if it's already a
  // numbered item, new items should continue counting from there instead of
  // resetting to 1 (this is what "it continues from 1 again" was about).
  const precedingNumber = (text, lineStart) => {
    if (lineStart === 0) return 0;
    const prevLineEnd = lineStart - 1;
    const prevLineStart = text.lastIndexOf("\n", prevLineEnd - 1) + 1;
    const prevLine = text.slice(prevLineStart, prevLineEnd);
    const m = prevLine.match(/^\s*(\d+)\.\s+/);
    return m ? parseInt(m[1], 10) : 0;
  };

  const toggleLinePrefix = (prefix, isNumbered) => {
    applyToSelection((text, start, end) => {
      const lineStart = text.lastIndexOf("\n", start - 1) + 1;
      let lineEnd = text.indexOf("\n", end);
      if (lineEnd === -1) lineEnd = text.length;

      const block = text.slice(lineStart, lineEnd);
      const lines = block.split("\n");
      const alreadyPrefixed = lines.every((line) => (isNumbered ? /^\s*\d+\.\s+/.test(line) : /^\s*-\s+/.test(line)));
      const startNumber = isNumbered ? precedingNumber(text, lineStart) : 0;

      const newLines = lines.map((line, idx) => {
        const stripped = line.replace(/^\s*-\s+/, "").replace(/^\s*\d+\.\s+/, "");
        if (alreadyPrefixed) return stripped;
        return isNumbered ? `${startNumber + idx + 1}. ${stripped}` : `${prefix}${stripped}`;
      });

      const newBlock = newLines.join("\n");
      const before = text.slice(0, lineStart);
      const after = text.slice(lineEnd);
      return {
        newValue: `${before}${newBlock}${after}`,
        selectionStart: lineStart,
        selectionEnd: lineStart + newBlock.length,
      };
    });
  };

  // Enter inside a list line: continue the same list on the new line (bullet,
  // or next number). Pressing Enter on an *empty* list line breaks out of the
  // list instead of inserting yet another empty bullet/number, matching the
  // behavior people expect from Word/Notion/etc.
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start !== end) return;

    const text = value;
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const currentLine = text.slice(lineStart, start);

    const bulletMatch = currentLine.match(/^(\s*)-\s+(.*)$/);
    const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (!bulletMatch && !numberedMatch) return;

    e.preventDefault();

    const isEmpty = (bulletMatch ? bulletMatch[2] : numberedMatch[3]).trim() === "";
    if (isEmpty) {
      const before = text.slice(0, lineStart);
      const after = text.slice(start);
      onChange(before + after);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(lineStart, lineStart);
      });
      return;
    }

    const indent = bulletMatch ? bulletMatch[1] : numberedMatch[1];
    const insertion = bulletMatch ? `\n${indent}- ` : `\n${indent}${parseInt(numberedMatch[2], 10) + 1}. `;
    const newValue = text.slice(0, start) + insertion + text.slice(end);
    onChange(newValue);
    const newPos = start + insertion.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
    });
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    applyToSelection((text, start, end) => {
      const selected = text.slice(start, end) || "link text";
      const before = text.slice(0, start);
      const after = text.slice(end);
      const inserted = `[${selected}](${linkUrl.trim()})`;
      return { newValue: `${before}${inserted}${after}`, selectionStart: start, selectionEnd: start + inserted.length };
    });
    setLinkUrl("");
    setShowLinkInput(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-stone-800 bg-stone-900/40 p-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("**")}
          title="Bold"
          className="flex h-8 w-8 items-center justify-center rounded text-stone-300 transition-colors hover:bg-stone-800 hover:text-stone-100"
        >
          <Bold size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => wrapSelection("__")}
          title="Underline"
          className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-stone-300 transition-colors hover:bg-stone-800 hover:text-stone-100"
        >
          U
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearFormatting}
          title="Clear formatting"
          className="flex h-8 w-8 items-center justify-center rounded text-stone-300 transition-colors hover:bg-stone-800 hover:text-stone-100"
        >
          <Eraser size={16} />
        </button>

        <div className="mx-1 h-6 w-px bg-stone-700" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleLinePrefix("- ", false)}
          title="Bullet list"
          className="flex h-8 w-8 items-center justify-center rounded text-stone-300 transition-colors hover:bg-stone-800 hover:text-stone-100"
        >
          <List size={16} />
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => toggleLinePrefix("", true)}
          title="Numbered list"
          className="flex h-8 w-8 items-center justify-center rounded text-stone-300 transition-colors hover:bg-stone-800 hover:text-stone-100"
        >
          <ListOrdered size={16} />
        </button>

        <div className="mx-1 h-6 w-px bg-stone-700" />

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowLinkInput((v) => !v)}
          title="Insert link"
          className="flex h-8 w-8 items-center justify-center rounded text-stone-300 transition-colors hover:bg-stone-800 hover:text-stone-100"
        >
          <Link2 size={16} />
        </button>
      </div>

      {showLinkInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && insertLink()}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none focus:border-amber-600"
          />
          <button
            type="button"
            onClick={insertLink}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-500"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl("");
            }}
            className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-stone-800"
          >
            Cancel
          </button>
        </div>
      )}

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="resize-none rounded-lg border border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-200 outline-none transition-colors focus:border-amber-600 focus:ring-1 focus:ring-amber-600/20"
        style={{ direction: "ltr" }}
      />
      <p className="text-xs text-stone-600">Select text, then click a button. Formatting: **bold**, __underline__, - bullets, 1. numbers, [text](link).</p>
    </div>
  );
}
