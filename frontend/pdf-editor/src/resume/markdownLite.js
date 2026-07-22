// Tiny, dependency-free markdown-like syntax used only by RichTextEditor's
// content field. Deliberately NOT full markdown — just the handful of things
// the toolbar can insert (bold, underline, links, two list types) — so the
// parser stays a few lines and fully predictable.
export function markdownLiteToHtml(text) {
  if (!text) return "";

  const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const escapeAttribute = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeLink = (value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  };

  const applyInline = (line) => {
    let html = escapeHtml(line);
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
      const safeHref = safeLink(href);
      return safeHref
        ? `<a href="${escapeAttribute(safeHref)}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : label;
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__([^_]+)__/g, "<u>$1</u>");
    return html;
  };

  const lines = text.split("\n");
  const htmlParts = [];
  let listBuffer = [];
  let listType = null;

  const flushList = () => {
    if (listBuffer.length > 0) {
      const tag = listType;
      htmlParts.push(
        `<${tag} style="margin:0;padding-left:1.2em;">${listBuffer.map((li) => `<li>${li}</li>`).join("")}</${tag}>`
      );
      listBuffer = [];
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const bulletMatch = rawLine.match(/^\s*-\s+(.*)$/);
    const numberedMatch = rawLine.match(/^\s*\d+\.\s+(.*)$/);

    if (bulletMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuffer.push(applyInline(bulletMatch[1]));
    } else if (numberedMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuffer.push(applyInline(numberedMatch[1]));
    } else {
      flushList();
      if (rawLine.trim() === "") {
        htmlParts.push("<br/>");
      } else {
        htmlParts.push(`<div>${applyInline(rawLine)}</div>`);
      }
    }
  }
  flushList();

  return htmlParts.join("");
}
