import { jsPDF } from "jspdf";
import { DEFAULT_ACCENT } from "./themes.js";
import { DEFAULT_SECTION_ORDER } from "./data.js";
import { formatDate, getFilledSections } from "./resumeSections.js";
import { loadLetterheadLogo, drawLetterhead, LETTERHEAD_HEIGHT_PT } from "../pdfLetterhead.js";

// Deliberately renders real, selectable jsPDF text (not a rasterized image of
// the on-screen preview) — a resume exported as a flattened picture would
// have zero text for an ATS parser to read, which defeats the entire point
// of a resume. This is the same reason the export is a single ATS-safe
// column regardless of which visual template (Minimal/Modern) is selected
// on screen: a two-column sidebar layout is exactly what resume-checklist
// guidance warns hurts ATS parsing, so the download intentionally optimizes
// for "gets through the scanner" over "looks exactly like the preview."

const A4_WIDTH_PT = 595;
const A4_HEIGHT_PT = 842;
const MARGIN = 42;
const CONTENT_WIDTH = A4_WIDTH_PT - MARGIN * 2;
const FONT_FAMILY = "NotoSans";
const FONT_ASSETS = {
  normal: "NotoSans-Regular.ttf",
  bold: "NotoSans-Bold.ttf",
  italic: "NotoSans-Italic.ttf",
};

function bytesToBase64(bytes) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

async function loadFontDataFromAssets() {
  if (typeof window === "undefined") return null;
  const baseUrl = import.meta.env?.BASE_URL || "/";
  const entries = await Promise.all(
    Object.entries(FONT_ASSETS).map(async ([style, fileName]) => {
      const response = await fetch(`${baseUrl}assets/fonts/${fileName}`);
      if (!response.ok) throw new Error(`Unable to load resume font: ${fileName}`);
      return [style, bytesToBase64(new Uint8Array(await response.arrayBuffer()))];
    })
  );
  return Object.fromEntries(entries);
}

async function registerResumeFonts(doc, suppliedFontData) {
  try {
    const fontData = suppliedFontData || (await loadFontDataFromAssets());
    if (!fontData) return "helvetica";
    Object.entries(FONT_ASSETS).forEach(([style, fileName]) => {
      doc.addFileToVFS(fileName, fontData[style]);
      doc.addFont(fileName, FONT_FAMILY, style);
    });
    return FONT_FAMILY;
  } catch (error) {
    console.warn("Unicode resume fonts could not be loaded; using the PDF fallback font.", error);
    return "helvetica";
  }
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function tokenizeInline(line) {
  const tokens = [];
  const regex = /(\*\*([^*]+)\*\*)|(__([^_]+)__)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let m;
  while ((m = regex.exec(line))) {
    if (m.index > lastIndex) tokens.push({ type: "plain", text: line.slice(lastIndex, m.index) });
    if (m[2] !== undefined) tokens.push({ type: "bold", text: m[2] });
    else if (m[4] !== undefined) tokens.push({ type: "underline", text: m[4] });
    else if (m[6] !== undefined) tokens.push({ type: "link", text: m[6], url: m[7] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) tokens.push({ type: "plain", text: line.slice(lastIndex) });
  return tokens;
}

export async function buildResumePdf({ resumeData, accentColor = DEFAULT_ACCENT, letterhead = false, fontData }) {
  const doc = new jsPDF({ unit: "pt", format: [A4_WIDTH_PT, A4_HEIGHT_PT], putOnlyUsedFonts: true });
  const fontFamily = await registerResumeFonts(doc, fontData);
  const [ar, ag, ab] = hexToRgb(accentColor);
  const logoDataUrl = letterhead ? await loadLetterheadLogo() : null;
  let y = MARGIN;

  // Draws the letterhead (if enabled) on whichever page is current and
  // starts the content cursor below it — called once for page 1 and again
  // every time ensureSpace() adds a new page, so a multi-page resume gets
  // the header repeated on every page rather than just the first.
  const startPage = () => {
    if (logoDataUrl) {
      drawLetterhead(doc, logoDataUrl, A4_WIDTH_PT, MARGIN);
      y = MARGIN + LETTERHEAD_HEIGHT_PT;
    } else {
      y = MARGIN;
    }
  };
  startPage();

  const ensureSpace = (needed) => {
    if (y + needed > A4_HEIGHT_PT - MARGIN) {
      doc.addPage([A4_WIDTH_PT, A4_HEIGHT_PT]);
      startPage();
      return true;
    }
    return false;
  };

  const setAccent = () => doc.setTextColor(ar, ag, ab);
  const setDark = () => doc.setTextColor(20, 20, 20);
  const setMuted = () => doc.setTextColor(90, 90, 90);
  const setLink = () => doc.setTextColor(37, 99, 235);

  const wrappedText = (text, x, maxWidth, lineHeight, fontSize = 9) => {
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      ensureSpace(lineHeight);
      doc.text(line, x, y);
      y += lineHeight;
    });
  };

  const bulletList = (text, x, maxWidth, lineHeight) => {
    setDark();
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(9);
    text
      .split("\n")
      .filter((l) => l.trim())
      .forEach((line) => {
        const wrapped = doc.splitTextToSize(line.trim(), maxWidth - 12);
        wrapped.forEach((wl, idx) => {
          ensureSpace(lineHeight);
          doc.text(idx === 0 ? "•" : "", x, y);
          doc.text(wl, x + 12, y);
          y += lineHeight;
        });
      });
  };

  // Renders one row: bold left label + normal right-aligned date, both on
  // the same baseline. Used for Experience/Project/Education/Cert entries.
  const titleDateRow = (titleSegments, dateText) => {
    doc.setFontSize(10);
    let x = MARGIN;
    titleSegments.forEach((seg) => {
      doc.setFont(fontFamily, seg.bold ? "bold" : "normal");
      if (seg.link) {
        setLink();
        doc.textWithLink(seg.text, x, y, { url: seg.link });
      } else {
        if (seg.color) doc.setTextColor(...seg.color);
        else setDark();
        doc.text(seg.text, x, y);
      }
      x += doc.getTextWidth(seg.text);
    });
    if (dateText) {
      setMuted();
      doc.setFont(fontFamily, "normal");
      doc.setFontSize(9);
      const w = doc.getTextWidth(dateText);
      doc.text(dateText, A4_WIDTH_PT - MARGIN - w, y);
    }
    y += 13;
  };

  const subLine = (text, { italic = false } = {}) => {
    if (!text) return;
    ensureSpace(12);
    doc.setFont(fontFamily, italic ? "italic" : "normal");
    doc.setFontSize(9);
    setMuted();
    doc.text(text, MARGIN, y);
    y += 12;
  };

  const sectionHeading = (label) => {
    ensureSpace(20);
    doc.setFont(fontFamily, "bold");
    doc.setFontSize(10.5);
    setAccent();
    doc.text(label.toUpperCase(), MARGIN, y);
    y += 3;
    doc.setDrawColor(ar, ag, ab);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, A4_WIDTH_PT - MARGIN, y);
    y += 12;
  };

  // ---- Header ----
  const personalInfo = resumeData.personalInfo || {};
  doc.setFont(fontFamily, "bold");
  doc.setFontSize(19);
  setAccent();
  doc.text(personalInfo.fullName || "", MARGIN, y);
  y += 18;
  if (personalInfo.title) {
    doc.setFont(fontFamily, "normal");
    doc.setFontSize(10);
    setMuted();
    doc.text(personalInfo.title, MARGIN, y);
    y += 13;
  }
  doc.setDrawColor(ar, ag, ab);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, y, A4_WIDTH_PT - MARGIN, y);
  y += 14;

  const location = [personalInfo.city, personalInfo.state].filter(Boolean).join(", ");
  const contactParts = [
    personalInfo.phone && { text: personalInfo.phone },
    personalInfo.email && { text: personalInfo.email, link: `mailto:${personalInfo.email}` },
    location && { text: location },
    personalInfo.portfolio && { text: "Portfolio", link: personalInfo.portfolio },
    personalInfo.linkedin && { text: "LinkedIn", link: personalInfo.linkedin },
    personalInfo.github && { text: "GitHub", link: personalInfo.github },
  ].filter(Boolean);

  if (contactParts.length > 0) {
    doc.setFontSize(9);
    doc.setFont(fontFamily, "normal");
    let x = MARGIN;
    contactParts.forEach((part, idx) => {
      if (idx > 0) {
        setMuted();
        doc.text("  |  ", x, y);
        x += doc.getTextWidth("  |  ");
      }
      if (part.link) {
        setLink();
        doc.textWithLink(part.text, x, y, { url: part.link });
      } else {
        setDark();
        doc.text(part.text, x, y);
      }
      x += doc.getTextWidth(part.text);
    });
    y += 16;
  }

  if (personalInfo.summary) {
    setDark();
    wrappedText(personalInfo.summary, MARGIN, CONTENT_WIDTH, 12);
    y += 4;
  }

  // ---- Sections, in the user's configured order ----
  const filled = getFilledSections(resumeData);
  const order = resumeData.sectionOrder && resumeData.sectionOrder.length ? resumeData.sectionOrder : DEFAULT_SECTION_ORDER;

  order.forEach((key) => {
    switch (key) {
      case "domains": {
        if (filled.domains.length === 0) return;
        sectionHeading("Domain/Functional Areas");
        wrappedText(filled.domains.map((d) => d.text).join("  •  "), MARGIN, CONTENT_WIDTH, 12);
        y += 6;
        return;
      }
      case "skills": {
        if (filled.skills.length === 0) return;
        sectionHeading("Key Skills");
        filled.skills.forEach((skill) => {
          ensureSpace(12);
          doc.setFontSize(9);
          doc.setFont(fontFamily, "bold");
          setDark();
          const label = `${skill.category}: `;
          doc.text(label, MARGIN, y);
          const labelWidth = doc.getTextWidth(label);
          doc.setFont(fontFamily, "normal");
          const wrapped = doc.splitTextToSize(skill.items, CONTENT_WIDTH - labelWidth);
          doc.text(wrapped[0] || "", MARGIN + labelWidth, y);
          y += 12;
          for (let i = 1; i < wrapped.length; i++) {
            ensureSpace(12);
            doc.text(wrapped[i], MARGIN, y);
            y += 12;
          }
        });
        y += 4;
        return;
      }
      case "experience": {
        if (filled.experience.length === 0) return;
        sectionHeading("Professional Experience");
        filled.experience.forEach((item) => {
          ensureSpace(26);
          titleDateRow(
            [{ text: item.role || "", bold: true }],
            `${formatDate(item.startDate)} – ${item.isCurrentlyWorking ? "Present" : formatDate(item.endDate)}`
          );
          subLine(item.company);
          if (item.tools) subLine(`Tools: ${item.tools}`, { italic: true });
          if (item.description) bulletList(item.description, MARGIN, CONTENT_WIDTH, 12);
          y += 6;
        });
        return;
      }
      case "projects": {
        if (filled.projects.length === 0) return;
        sectionHeading("Projects");
        filled.projects.forEach((project) => {
          ensureSpace(26);
          const titleSegs = [{ text: project.name || "", bold: true }];
          if (project.techStack) titleSegs.push({ text: ` | ${project.techStack}`, bold: false, color: [90, 90, 90] });
          if (project.link) titleSegs.push({ text: "  [Link]", bold: false, link: project.link });
          const dateText =
            project.startDate || project.endDate
              ? `${formatDate(project.startDate)} – ${project.isCurrentProject ? "Present" : formatDate(project.endDate)}`
              : "";
          titleDateRow(titleSegs, dateText);
          if (project.description) bulletList(project.description, MARGIN, CONTENT_WIDTH, 12);
          y += 6;
        });
        return;
      }
      case "achievements": {
        if (filled.achievements.length === 0) return;
        sectionHeading("Achievements");
        filled.achievements.forEach((item) => {
          ensureSpace(20);
          titleDateRow([{ text: item.title || "", bold: true }], item.date || "");
          if (item.description) wrappedText(item.description, MARGIN, CONTENT_WIDTH, 12);
          y += 6;
        });
        return;
      }
      case "certifications": {
        if (filled.certifications.length === 0) return;
        // A short certifications block reads much better when it stays
        // together. This also prevents a continuation page from beginning
        // with an unlabeled certificate row.
        ensureSpace(20 + filled.certifications.length * 29);
        sectionHeading("Certifications");
        filled.certifications.forEach((cert) => {
          ensureSpace(20);
          const titleSegs = [{ text: cert.title || "", bold: true }];
          if (cert.link) titleSegs.push({ text: "  [Link]", bold: false, link: cert.link });
          titleDateRow(titleSegs, cert.date || "");
          if (cert.issuer) subLine(cert.issuer);
          y += 4;
        });
        return;
      }
      case "education": {
        if (filled.education.length === 0) return;
        sectionHeading("Education");
        filled.education.forEach((edu) => {
          ensureSpace(26);
          const degreeLine = [edu.degree, edu.field && `in ${edu.field}`].filter(Boolean).join(" ");
          const dateText =
            edu.startDate || edu.endDate
              ? `${formatDate(edu.startDate)} – ${edu.isCurrentlyStudying ? "Present" : formatDate(edu.endDate)}`
              : "";
          titleDateRow([{ text: degreeLine, bold: true }], dateText);
          subLine(edu.institution);
          if (edu.gpa) subLine(`GPA: ${edu.gpa}`);
          y += 4;
        });
        return;
      }
      case "additionalSection": {
        if (!filled.hasAdditional) return;
        const { title, content, link } = resumeData.additionalSection;
        sectionHeading(title);
        content.split("\n").forEach((rawLine) => {
          const bulletMatch = rawLine.match(/^\s*-\s+(.*)$/);
          const numberedMatch = rawLine.match(/^\s*(\d+)\.\s+(.*)$/);
          const prefix = bulletMatch ? "• " : numberedMatch ? `${numberedMatch[1]}. ` : "";
          const lineText = bulletMatch ? bulletMatch[1] : numberedMatch ? numberedMatch[2] : rawLine;
          const indent = prefix ? 12 : 0;

          if (!lineText.trim()) {
            y += 6;
            return;
          }

          const tokens = tokenizeInline(lineText);
          doc.setFontSize(9);
          let totalWidth = 0;
          tokens.forEach((t) => {
            doc.setFont(fontFamily, t.type === "bold" ? "bold" : "normal");
            totalWidth += doc.getTextWidth(t.text);
          });

          ensureSpace(12);
          if (totalWidth <= CONTENT_WIDTH - indent) {
            let x = MARGIN + indent;
            if (prefix) {
              setDark();
              doc.setFont(fontFamily, "normal");
              doc.text(prefix, MARGIN, y);
            }
            tokens.forEach((t) => {
              doc.setFont(fontFamily, t.type === "bold" ? "bold" : "normal");
              if (t.type === "link") {
                setLink();
                doc.textWithLink(t.text, x, y, { url: t.url });
              } else {
                setDark();
                doc.text(t.text, x, y);
                if (t.type === "underline") {
                  const w = doc.getTextWidth(t.text);
                  doc.setDrawColor(20, 20, 20);
                  doc.setLineWidth(0.5);
                  doc.line(x, y + 2, x + w, y + 2);
                }
              }
              x += doc.getTextWidth(t.text);
            });
            y += 12;
          } else {
            setDark();
            doc.setFont(fontFamily, "normal");
            wrappedText(prefix + lineText, MARGIN + indent, CONTENT_WIDTH - indent, 12);
          }
        });
        if (link) {
          ensureSpace(12);
          setLink();
          doc.setFontSize(9);
          doc.textWithLink(link, MARGIN, y, { url: link });
          y += 12;
        }
        y += 4;
        return;
      }
      default:
        return;
    }
  });

  return doc;
}

export function getResumeFileName(fullName) {
  const safeName = (fullName || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/^\.+|\.+$/g, "");
  return safeName ? `${safeName}_Resume.pdf` : "Resume.pdf";
}

export async function exportResumeToPdf(options) {
  const doc = await buildResumePdf(options);
  doc.save(getResumeFileName(options.resumeData?.personalInfo?.fullName));
}
