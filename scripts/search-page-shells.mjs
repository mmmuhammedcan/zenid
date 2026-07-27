import assert from "node:assert/strict";

function replaceRequired(source, pattern, replacement, label) {
  if (pattern instanceof RegExp) {
    assert.match(source, pattern, `The application shell must contain ${label}.`);
  } else {
    assert.ok(source.includes(pattern), `The application shell must contain ${label}.`);
  }
  return source.replace(pattern, replacement);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderStaticPage(page) {
  const sections = page.sections.map((section) => {
    const paragraphs = (section.paragraphs || [])
      .map((paragraph) => `<p class="mt-4 text-base leading-8 text-stone-300">${escapeHtml(paragraph)}</p>`)
      .join("");
    const items = section.items?.length
      ? `<ul class="mt-5 space-y-3 text-stone-300">${section.items
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("")}</ul>`
      : "";
    return `<section class="rounded-2xl border border-stone-800 bg-stone-900/60 p-6">
      <h2 class="text-2xl font-semibold text-white">${escapeHtml(section.heading)}</h2>
      ${paragraphs}${items}
    </section>`;
  }).join("");

  return `<main data-search-page="${escapeHtml(page.id)}" class="mx-auto max-w-5xl px-6 py-16 text-stone-100">
    <header class="max-w-3xl">
      <p class="text-sm font-semibold uppercase tracking-wider text-amber-500">${escapeHtml(page.eyebrow)}</p>
      <h1 class="mt-4 text-4xl font-semibold tracking-tight text-white">${escapeHtml(page.heading)}</h1>
      <p class="mt-5 text-lg leading-8 text-stone-300">${escapeHtml(page.intro)}</p>
      <div class="mt-8 flex flex-wrap gap-4">
        <a class="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white" href="${escapeHtml(page.toolPath)}">${escapeHtml(page.ctaLabel)}</a>
        <a class="rounded-xl border border-stone-700 px-5 py-3 font-semibold text-stone-200" hreflang="${escapeHtml(page.alternateLocale)}" href="${escapeHtml(page.alternateUrl)}">${escapeHtml(page.alternateLabel)}</a>
      </div>
    </header>
    <div class="mt-12 grid gap-6">${sections}</div>
  </main>`;
}

function structuredData(page) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: page.toolName,
    url: page.canonicalUrl,
    description: page.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    inLanguage: page.locale,
  }).replaceAll("<", "\\u003c");
}

export function buildSearchPageShell(applicationShell, page) {
  let shell = applicationShell;
  shell = replaceRequired(shell, /<html lang="[^"]+">/, `<html lang="${page.locale}">`, "an html language");
  shell = replaceRequired(
    shell,
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    "a meta description"
  );
  shell = replaceRequired(
    shell,
    /<link rel="canonical" href="[^"]*" \/>/,
    `<link rel="canonical" href="${page.canonicalUrl}" />`,
    "a canonical link"
  );
  shell = replaceRequired(
    shell,
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    "an Open Graph title"
  );
  shell = replaceRequired(
    shell,
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    "an Open Graph description"
  );
  shell = replaceRequired(
    shell,
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${page.canonicalUrl}" />`,
    "an Open Graph URL"
  );
  shell = replaceRequired(
    shell,
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    "a Twitter title"
  );
  shell = replaceRequired(
    shell,
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    "a Twitter description"
  );
  shell = replaceRequired(shell, /<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`, "a title");
  shell = replaceRequired(
    shell,
    "</head>",
    `  <link rel="alternate" hreflang="${page.locale}" href="${page.canonicalUrl}" />\n    <link rel="alternate" hreflang="${page.alternateLocale}" href="${page.alternateUrl}" />\n    <link rel="alternate" hreflang="x-default" href="${page.alternateUrl}" />\n    <script type="application/ld+json" data-zenid-search-structured>${structuredData(page)}</script>\n  </head>`,
    "a closing head"
  );
  shell = replaceRequired(
    shell,
    '<div id="root"></div>',
    `<div id="root">${renderStaticPage(page)}</div>`,
    "an empty application root"
  );
  return shell;
}
