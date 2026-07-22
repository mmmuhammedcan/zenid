# ZenID — Project Plan

## Vision
A combination of iLovePDF + CamScanner/Microsoft Lens + a simple e-signature tool. Goal: bring
photo/PDF operations (conversion, merging, form filling, signing, CV creation) together in one
simple, high-quality interface. Target audience: students, people preparing internship/job
documents (e.g. students at METU and similar universities), anyone who handles PDFs/photos
day-to-day.

User pain point: existing tools (iLovePDF, MS Lens, etc.) are either fragmented or
paid/limited/subscription-based. Also, raw OCR/text extraction is now free via tools like
ChatGPT/Gemini — our actual differentiator isn't **extracting raw text, it's producing a
finished, usable document** (a filled-out form, a signed PDF, a designed CV — downloadable in
one click).

## Business Model
Pay-as-you-go (micro-payment) OR a cheaper monthly subscription option — whichever the user
prefers. Profit isn't required from day one; **quality comes before cheapness** — the goal is a
professional look and reliability, not a "cheap but mediocre" product. Payment integration will
be handled in a separate sprint (see Sprint 7).

## Cost Principle — Zero-Cost-First (for the photo/OCR pipeline)
The photo→PDF and OCR module is self-hosted, built with open-source libraries — no external
API/model cost. **This pipeline has been left in a "good enough" state, no more time is being
spent on it** (see "Photo→PDF/OCR Pipeline — Status" below). Energy has shifted to more reliable
features that serve the real target audience (Overlay Editor, CV Builder, and now ZenPDF).

## Architecture — Modular + Facade Pattern

A single backend API (FastAPI), in front of which as many "clients" as needed can be attached
(web app, Chrome/Firefox extension, mobile later). The frontend never knows which library is
being used under the hood — it only calls the functions the Facade exposes.

```
Frontend(s): Web App (index.html, cv-builder.html, legacy/standalone) /
             Doc Toolkit Hub (frontend/pdf-editor — Dashboard + ZenPDF + Resume Builder,
             react-router-dom) / (later) Extension / Mobile
                         │
                    FACADE LAYER (DocFacade)
     scan_to_pdf() / render_pdf_pages() / apply_overlay() / generate_cv()
                         │
   ┌───────────┬──────────────┬─────────────────┐
Scanner      OCR Engine     Overlay           CV Builder
(OpenCV      (Tesseract,    (PyMuPDF —        (WeasyPrint + Jinja2 —
perspective  self-hosted,   render + text/     HTML/CSS template → PDF,
correction,  "good          signature/photo    Canva-style, no OCR,
img2pdf)     enough" as-is) placement — ONE     fully reliable)
                            mechanism for
                            form filling +
                            signature + photo)
```

Note: the React hub (`frontend/pdf-editor`) is entirely client-side right now — routing ties its
own tools (ZenPDF, Resume Builder) together, but neither one calls the FastAPI backend yet. The
old vanilla-JS pages (`index.html`, `editor.html`, `cv-builder.html`) are the ones actually wired
to the Facade/backend today; see "Long-term Note" and the ZenPDF/Resume Builder sections below.

Key insight: real-world documents (internship/job forms) are usually **flat/scanned PDFs with no
AcroForm fields**. "Filling a form" really means "click anywhere on the PDF, place
text/signature/photo" — exactly the same mechanism as placing a signature or a photo. That's why
the three were merged into **one Overlay module**; there's no separate AcroForm detection
(unnecessary — the overlay approach works on any PDF).

Signature storage: instead of a user account system, **browser localStorage** is used — zero
backend complexity. Could move to real accounts later alongside the payment system.

## Doc Toolkit Hub — central React app (frontend/pdf-editor)

`frontend/pdf-editor/` is no longer just ZenPDF's own Vite project — it's now the single React app
that hosts the whole in-browser tool suite, tied together with `react-router-dom`:
- `/` — **Dashboard** (`src/Dashboard.jsx`): premium dark-mode hub, two cards ("Edit PDF" →
  ZenPDF, "Build Resume" → Resume Builder), each with a Lucide icon, subtitle, description, and
  hover affordance.
- `/editor` — ZenPDF (`src/PdfEditor.jsx`)
- `/resume` — Resume Builder (`src/resume/ResumeApp.jsx`)

Both tools have a Home icon in their header (`<Link to="/">`) that returns to the Dashboard. This
is the "Integration" work from the priority queue below — ZenPDF and Resume Builder are no longer
isolated islands, they're routes in one app. What integration does **not** yet mean: neither tool
talks to the FastAPI backend, and the legacy vanilla-JS pages (`index.html`, `editor.html`,
`cv-builder.html`) are still separate, unlinked from this hub — that remains future work.

The standalone `frontend/resume-builder/` Vite project that Resume Builder was originally
prototyped in has been deleted — its source was migrated into `frontend/pdf-editor/src/resume/`
so both tools share one dependency tree, one dev server, and one router.

## ZenPDF — the PDF editor tool

**ZenPDF is not a prototype.** It is meant to become *the* editor and will fully replace the old
vanilla-JS `frontend/editor.html`. It lives at `frontend/pdf-editor/src/PdfEditor.jsx`, mounted at
the `/editor` route of the Doc Toolkit Hub described above.

**Stack:** React + Vite + Tailwind CSS v4 + Fabric.js (canvas/object manipulation) + PDF.js
(rendering) + jsPDF (export) + Lucide React (icons) + react-router-dom (hub navigation). Entirely
client-side right now — no calls to the FastAPI backend.

**Built so far:**
- PDF.js rendering + a Fabric.js overlay canvas mounted exactly on top of it
- Floating sidebar toolbar (Lucide icons): Add Text, Add Signature, Add Image, Draw
- Add Text: spawns centered, draggable/resizable (native Fabric controls), double-click to edit,
  Delete key or a dedicated button to remove
- A **contextual floating toolbar** (Notion/Apple-style) that hovers directly above the selected
  text object and follows it while dragging/resizing: font family, font size, bold, italic,
  underline, text color, delete — glassmorphism styling, fades in/out
- Add Signature: draw once (canvas signature pad), stored in `localStorage`, reused on every
  subsequent placement, with a "redraw" option
- Add Image: pick any photo from disk, placed centered, draggable/resizable like everything else
- Freehand Draw mode: toggled from the sidebar, small popover with stroke width presets + a color
  swatch
- Multi-page support: real page navigation, and **per-page annotation persistence** — switching
  pages snapshots the outgoing page's Fabric objects (`toJSON()`) and restores them
  (`loadFromJSON()`) when the user comes back to that page
- Zoom (CSS transform on the canvas wrapper, not a re-render at a different resolution)
- **Image-to-PDF flow**: dropping/choosing a JPG/PNG instead of a PDF bypasses PDF.js entirely —
  it becomes the `backgroundImage` of a new, fixed-A4-proportioned Fabric canvas, contain-fit and
  centered. From there it's editable exactly like an uploaded PDF.
- **Real PDF export** via jsPDF: every page (not just the current one) gets flattened into an
  image and assembled into one PDF. The current page is flattened live; other pages are rebuilt
  **offscreen** (re-render that PDF page + load its saved Fabric JSON into a temporary
  `StaticCanvas`) so nothing on screen is disturbed.
- Premium dark-mode UI overhaul: header with a prominent Export button, drag-and-drop dropzone for
  the empty state, "paper on a dark desk" canvas styling, custom Tailwind dropdowns instead of
  native `<select>`s
- ZenPDF brand favicon (replaced the default Vite icon)
- **Undo/Redo**: a full history stack (`useHistory.js`) snapshotting `canvas.toJSON()` on every
  meaningful mutation (add/remove/modify/path-created). Sidebar buttons (disabled when empty) +
  `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`.
- **Eraser sub-tool** inside Draw mode (Brush/Eraser toggle in the popover): click or drag over a
  hand-drawn stroke to delete it. This is *object-level* erasing (whole strokes), not true
  pixel-level erasing — Fabric v7's core bundle has no built-in eraser brush, and pulling in an
  extra package for that was judged not worth the risk/effort here.
- **Clear page** (sidebar icon) — wipes all objects, keeps the background image, no confirmation
  needed since it's a single atomic undo away.
- **Duplicate** (`Ctrl+D`, works on any selected object type; also a button in the text toolbar)
- **Escape** to deselect (needed once Undo/Redo existed — clicking elsewhere to deselect risks
  landing back on an object instead)

**Known bugs fixed along the way (worth remembering, not re-introducing):**
- Toggle buttons (Bold/Italic/Underline/Draw) must read their *next* value from the live Fabric
  object/canvas, never from React closure state (`bold ? "normal" : "bold"`) — the two can drift
  out of sync after enough rapid clicks, which is exactly the "works twice then stops responding
  correctly" bug pattern.
- Selection handles/borders render onto the same canvas layer used for flattening — deselect
  (`discardActiveObject()`) before exporting, or the handles get baked into the PDF.
- Use `renderAll()` (synchronous), not `requestRenderAll()` (scheduled on the next animation
  frame), immediately before reading canvas pixels for export — otherwise you read a stale frame.
- Fabric doesn't auto-create a `freeDrawingBrush`; without explicitly setting
  `canvas.freeDrawingBrush = new PencilBrush(canvas)`, `isDrawingMode = true` is a silent no-op.
- **`canvas.loadFromJSON(json, callback)` is Promise-based in this Fabric version — the 2nd arg is
  a per-object "reviver" called once per restored object, NOT a completion callback.** Using it as
  one meant `renderAll()` ran mid-restore: undo/redo updated all the internal state correctly but
  the canvas visually never showed the restored objects, and — worse — the offscreen export path
  for non-current pages would resolve after the *first* object on a multi-object page, silently
  dropping the rest from the downloaded PDF. Always `await canvas.loadFromJSON(json)` (or
  `.then()`) instead.
- `canvas.clear()` removes objects one at a time, firing one `object:removed` per object — pushing
  one history entry each. If you want "Clear page" to undo in a single step, suppress those
  (`isRestoringRef` guard) and push one atomic snapshot after clearing instead.
- New npm dependencies added while the Vite dev server is already running can cause a stale
  dependency-cache "duplicate React instance" error — clear `node_modules/.vite` and restart.
- Running two Vite dev servers (or any two projects with large `node_modules`) at once on this
  machine can exhaust the OS file-watcher limit (`ENOSPC`, `fs.inotify.max_user_watches`) — kill
  the unused dev server rather than raising the system limit.

**Current priority queue (in this exact order):**
1. ~~Quick fixes~~ — ✅ **Done**: z-index overlap between the floating text toolbar and the bottom
   nav/zoom bar fixed (position clamping + z-index); ZenPDF brand favicon in place.
2. ~~Integration~~ — ✅ **Partially done**: ZenPDF and Resume Builder are now routed together under
   one Dashboard hub via react-router-dom (see "Doc Toolkit Hub" above). Still open: neither tool
   calls the FastAPI backend, and the legacy vanilla-JS pages (`index.html`/`editor.html`/
   `cv-builder.html`) remain unlinked from the hub.
3. **Later phase (deliberately deferred, not now):** mobile/touch responsiveness (never tested on
   a narrow viewport — the floating sidebar + bottom bar layout likely needs rework), and backend
   persistence (right now everything lives only in the browser tab; refreshing loses all work
   except the saved signature).

## Resume Builder — the resume-creation tool

A separate, new front-end-only tool, mounted at the `/resume` route of the Doc Toolkit Hub
(`src/resume/`). Structurally referenced (not cloned) from a reference resume-builder UI: same
split-screen shape, entirely restyled to a premium, minimalist, "Apple-style" aesthetic — light
theme (not ZenPDF's dark theme), ample whitespace, quiet typography. Deliberately simple: a flat
`resumeData` state (`{ personalInfo, experience[] }`) passed via props, no context/store library,
no backend calls, no over-built abstraction.

**Flow:**
- `TemplateSelector.jsx` — pick between two templates (Minimal: single column; Modern: accent
  sidebar for contact info), plus a 4-swatch **Theme Color Picker** (see below). Selecting a
  template and continuing moves to the builder; going back preserves both the entered data and the
  chosen template/color.
- `BuilderView.jsx` — split-screen: collapsible accordion form on the left (`AccordionSection.jsx`
  wrapping `PersonalInfoForm.jsx` and `ExperienceForm.jsx`, the latter supporting add/remove
  entries), sticky live preview on the right (`ResumePreview.jsx`) rendered at real A4 point
  dimensions (595×842 — the same `A4_WIDTH_PT`/`A4_HEIGHT_PT` values ZenPDF's `pdfExport.js` uses).
- `ResumeApp.jsx` — top-level state owner: `template`, `accentColor`, `resumeData`.

**Theming:** the default dark accent was originally flat `neutral-900` (looked harsh, "wireframe").
Replaced with a curated, **non-free-form** picker — exactly 4 premium colors defined in
`src/resume/themes.js` (Soft Slate — default, Deep Navy, Sage Green, Muted Burgundy), applied via
inline `style` (Tailwind's JIT scanner can't pick up dynamically-built class names like
`` `bg-${color}-900` ``, so the accent is a literal hex value, not a Tailwind class). The Modern
template's sidebar uses the accent as its background; the Minimal template uses it for the name
heading, a small underline rule, and section-heading labels, so "accent color" reads consistently
across both layouts.

**Reliability and guidance:** the builder saves its full draft in browser `localStorage`, exposes
the downloadable 5-page ZenID Resume Architecture Playbook, and surfaces export errors in the UI.
PDF export embeds Noto Sans so Turkish characters remain intact while the text stays selectable for
ATS parsing. Export filenames are sanitized, short certification sections are kept together across
page breaks, and resume utilities/PDF creation have Node test coverage (`npm test`).

## Folder Structure (current)

```
doc-toolkit/
├── backend/
│   ├── main.py                   # FastAPI entry — /api/scan, /api/pdf/preview,
│   │                              #   /api/pdf/overlay, /api/cv
│   ├── facade.py                  # DocFacade — single entry point
│   ├── modules/
│   │   ├── scanner.py             # perspective correction (OpenCV) + img2pdf
│   │   ├── ocr_engine.py          # Tesseract, searchable PDF (visual + invisible text)
│   │   ├── overlay.py             # PyMuPDF — render_pages, apply_overlay (form/signature/photo)
│   │   └── cv_builder.py          # WeasyPrint + Jinja2 — generate_cv_pdf
│   ├── templates/
│   │   └── cv_classic.html        # CV template (HTML/CSS)
│   └── requirements.txt
├── frontend/
│   ├── index.html                 # Photo → PDF scanner (legacy, not linked to the hub)
│   ├── editor.html                 # PDF fill/sign/photo — OLD, being replaced by ZenPDF
│   ├── cv-builder.html             # CV builder form (legacy, not linked to the hub)
│   └── pdf-editor/                 # Doc Toolkit Hub — React/Vite/Tailwind/react-router-dom,
│       ├── src/
│       │   ├── App.jsx             #   BrowserRouter + Routes: / , /editor , /resume
│       │   ├── Dashboard.jsx       #   central hub — two cards linking to the tools below
│       │   ├── PdfEditor.jsx       #   ZenPDF (Fabric.js/PDF.js/jsPDF) — see "ZenPDF" section
│       │   └── resume/             #   Resume Builder — see "Resume Builder" section
│       │       ├── ResumeApp.jsx
│       │       ├── TemplateSelector.jsx
│       │       ├── BuilderView.jsx
│       │       ├── ResumePreview.jsx
│       │       ├── themes.js       #   4 curated accent colors
│       │       └── ...
│       └── (Fabric.js/PDF.js/jsPDF/Lucide/react-router-dom all live here)
└── README.md
```

## Error Handling Principle
Every backend module throws its own specific exception (`ImageQualityException`,
`OCRUnavailableException`, `OverlayException`, `CVDataException`). The Facade catches these and
returns a meaningful, user-friendly message. The user never sees a raw stack trace.

## Photo→PDF/OCR Pipeline — Status (Sprint 1 and after, CLOSED)

**What was built:** perspective correction with OpenCV (falls back silently to its best guess/the
original if contour detection fails — never blocks the user), OCR with Tesseract (`tur+eng`), the
result is always produced as a "searchable PDF" (invisible/searchable text layer) that **stays
visually identical to the source**.

**Approach tried and abandoned:** re-typesetting recognized words as real vector text ("looks
like it was typed on a computer"). Worked well in synthetic tests, but on real dense/complex
documents (academic text) Tesseract's line-segmentation errors produced overlapping,
oddly-sized text — found unreliable, removed from the code. The visual+invisible-text approach
was kept because it can never look worse than the source.

**Deliberate decision:** no more time is being spent on this pipeline — "works well on a clean
photo, OCR text may occasionally be wrong on a messy/complex photo but the visual never breaks"
was deemed acceptable. If the engine ever needs to change (Tesseract → EasyOCR/PaddleOCR), only
`ocr_engine.py` changes.

## Sprint Plan (Agile — every sprint ships something deployable)

| Sprint | Output | Status |
|---|---|---|
| 1 | Photo → clean + searchable PDF (incl. OCR) | ✅ Done |
| A | Overlay Editor (old, vanilla JS) — click-to-place text/signature/photo on a PDF, signature saved in localStorage | ✅ Done, being replaced by ZenPDF |
| B | CV Builder — fill a form → professional PDF via WeasyPrint | ✅ Done |
| **ZenPDF** | **Main PDF editor** — React/Fabric.js/PDF.js rewrite of the Overlay Editor, plus multi-page, drawing, image-to-PDF, real export | ✅ Feature-complete, routed into the Doc Toolkit Hub |
| **Resume Builder (current)** | Template selection + split-screen form/live-preview resume builder, 4-color curated theming | ✅ Feature-complete, routed into the Doc Toolkit Hub |
| C | Merge/split/rotate/watermark (pypdf) | Planned |
| D | PDF ↔ DOCX/JPG format conversion | Planned |
| 7 | Payment integration — pay-as-you-go + monthly subscription option (evaluate iyzico/PayTR for Turkey) | Planned |
| 8 | Chrome/Firefox extension — thin client for the backend | Planned |

### Deferred / Future Phases (deliberately out of scope — not now)
- **CV Analyzer** — analyze an uploaded CV and give feedback. Requires a real LLM (e.g. Claude
  API), needs a separate cost/architecture discussion.
- **Portfolio site builder** — Canva-style, lets a user build their own portfolio website.
- **Mobile app** — let the web app mature first, then move to mobile.
- **ZenPDF mobile/touch responsiveness** and **ZenPDF backend persistence** — explicitly deferred
  until after the quick-fixes + integration work above is done.

## API Endpoints (current)

```
POST /api/scan            multipart: image           → PDF (searchable, visually unchanged)
POST /api/pdf/preview      multipart: pdf              → { pages: [{image_base64, width, height}] }
POST /api/pdf/overlay      multipart: pdf, items(JSON) → PDF (text/signature/photo placed)
POST /api/cv               JSON: CV data               → PDF (CV)
```

Note: `/api/pdf/preview` and `/api/pdf/overlay` currently back the old `editor.html`. Once ZenPDF
integration happens, these either get consumed by ZenPDF directly or become vestigial — revisit
this section when that work starts.

## Long-term Note
Think of the Chrome extension as a thin client for the backend API, not a separate project. All
the logic (image processing, PDF operations, form filling) should stay in the backend; the
extension should just be a UI that sends a file to the API and downloads the result. Never
duplicate logic across clients.
