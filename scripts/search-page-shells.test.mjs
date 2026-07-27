import assert from "node:assert/strict";
import test from "node:test";
import {
  SEARCH_PAGES,
  TURKISH_CV_SEARCH_PAGE,
} from "../frontend/pdf-editor/src/searchPageContent.js";
import { buildSearchPageShell } from "./search-page-shells.mjs";

const applicationShell = `<!doctype html>
<html lang="en">
  <head>
    <meta name="description" content="Root description" />
    <link rel="canonical" href="https://getzenid.com/" />
    <meta property="og:title" content="Root title" />
    <meta property="og:description" content="Root description" />
    <meta property="og:url" content="https://getzenid.com/" />
    <meta name="twitter:title" content="Root title" />
    <meta name="twitter:description" content="Root description" />
    <title>ZenID — Your local identity workspace.</title>
  </head>
  <body><div id="root"></div></body>
</html>`;

test("defines six focused bilingual workflow discovery pages", () => {
  assert.equal(SEARCH_PAGES.length, 6);
  assert.deepEqual(
    SEARCH_PAGES.map((page) => page.path),
    [
      "tr/cv-hazirlama",
      "en/resume-builder",
      "tr/portfolyo-hazirlama",
      "en/portfolio-builder",
      "tr/pdf-duzenleme",
      "en/private-pdf-editor",
    ]
  );
  assert.equal(new Set(SEARCH_PAGES.map((page) => page.title)).size, 6);
  assert.equal(new Set(SEARCH_PAGES.map((page) => page.canonicalUrl)).size, 6);
  assert.equal(
    TURKISH_CV_SEARCH_PAGE.canonicalUrl,
    "https://getzenid.com/tr/cv-hazirlama/"
  );
  assert.match(TURKISH_CV_SEARCH_PAGE.title, /CV Hazırlama/);
  assert.match(TURKISH_CV_SEARCH_PAGE.heading, /CV Hazırlama/);
});

test("builds a Turkish static-first shell with unique metadata and useful content", () => {
  const shell = buildSearchPageShell(applicationShell, TURKISH_CV_SEARCH_PAGE);

  assert.match(shell, /<html lang="tr">/);
  assert.match(shell, /<title>Ücretsiz CV Hazırlama[^<]*ZenID<\/title>/);
  assert.match(shell, /<meta name="description" content="[^"]*ATS[^"]*cihazınızda[^"]*" \/>/);
  assert.match(
    shell,
    /<link rel="canonical" href="https:\/\/getzenid\.com\/tr\/cv-hazirlama\/" \/>/
  );
  assert.match(shell, /<main[^>]*data-search-page="tr-cv-hazirlama"/);
  assert.match(shell, /<h1[^>]*>Ücretsiz CV Hazırlama[^<]*<\/h1>/);
  assert.match(shell, /ATS uyumlu CV/);
  assert.match(shell, /verileriniz cihazınızda kalır/i);
  assert.match(shell, /href="\/resume"/);
  assert.match(shell, /rel="alternate" hreflang="en"/);
  assert.match(shell, /rel="alternate" hreflang="tr"/);
  assert.match(shell, /<script type="application\/ld\+json" data-zenid-search-structured>/);
  assert.match(shell, /"@type":"WebApplication"/);
  assert.doesNotMatch(shell, /<div id="root"><\/div>/);
});

test("builds every page in its primary language with reciprocal alternates", () => {
  for (const page of SEARCH_PAGES) {
    const shell = buildSearchPageShell(applicationShell, page);
    assert.match(shell, new RegExp(`<html lang="${page.locale}">`));
    assert.ok(shell.includes(`<title>${page.title}</title>`));
    assert.ok(shell.includes(`href="${page.canonicalUrl}"`));
    assert.ok(shell.includes(`<h1`));
    assert.ok(shell.includes(page.heading));
    assert.ok(shell.includes(`href="${page.toolPath}"`));
    assert.ok(shell.includes(`hreflang="${page.alternateLocale}"`));
    assert.ok(shell.includes(`href="${page.alternateUrl}"`));
  }
});
