import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const expectedBase = process.argv[2];
assert.match(expectedBase || "", /^\/(?:[^/]+\/)*$/, "Pass an absolute Vite base ending in '/'.");

const index = await readFile(resolve("dist/index.html"), "utf8");
const fallback = await readFile(resolve("dist/404.html"), "utf8");
const robots = await readFile(resolve("dist/robots.txt"), "utf8");
const sitemap = await readFile(resolve("dist/sitemap.xml"), "utf8");
const llms = await readFile(resolve("dist/llms.txt"), "utf8");
const redirects = await readFile(resolve("dist/_redirects"), "utf8");
assert.equal(fallback, index, "The SPA fallback must match the built application shell.");

const references = [
  ...index.matchAll(/(?:src|href)="([^"]+)"/g),
].map((match) => match[1]).filter(
  (reference) => !reference.startsWith("data:") && !/^https?:\/\//.test(reference)
);

assert.ok(references.length > 0, "The built application must contain asset references.");
references.forEach((reference) => {
  assert.ok(
    reference.startsWith(expectedBase),
    `Built reference '${reference}' does not use expected base '${expectedBase}'.`
  );
});

assert.match(
  index,
  /<title>ZenID — Your local identity workspace\.<\/title>/,
  "The built page must use the approved public title."
);
assert.match(
  index,
  /<meta name="description" content="[^"]*resumes[^"]*portfolios[^"]*PDFs[^"]*" \/>/,
  "The built page must describe the product's core public capabilities."
);
assert.match(
  index,
  /<link rel="canonical" href="https:\/\/getzenid\.com\/" \/>/,
  "The built page must declare the approved canonical origin."
);
assert.match(index, /<meta property="og:title" content="ZenID — Your local identity workspace\." \/>/);
assert.match(index, /<meta property="og:url" content="https:\/\/getzenid\.com\/" \/>/);
assert.equal(
  robots,
  "User-agent: OAI-SearchBot\nAllow: /\n\nUser-agent: GPTBot\nDisallow: /\n\nUser-agent: *\nAllow: /\nSitemap: https://getzenid.com/sitemap.xml\n",
  "robots.txt must permit public search discovery, retain the training opt-out, and name the canonical sitemap."
);
[
  "https://getzenid.com/",
  "https://getzenid.com/tr/cv-hazirlama/",
  "https://getzenid.com/en/resume-builder/",
  "https://getzenid.com/tr/portfolyo-hazirlama/",
  "https://getzenid.com/en/portfolio-builder/",
  "https://getzenid.com/tr/pdf-duzenleme/",
  "https://getzenid.com/en/private-pdf-editor/",
].forEach((url) => {
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `The sitemap must expose ${url}.`);
});
assert.match(sitemap, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
assert.match(sitemap, /hreflang="tr"/);
assert.match(sitemap, /hreflang="en"/);
assert.match(llms, /^# ZenID$/m);
assert.match(llms, /Your local identity workspace\./);
assert.match(llms, /https:\/\/getzenid\.com\/tr\/cv-hazirlama\//);
assert.match(llms, /https:\/\/getzenid\.com\/en\/portfolio-builder\//);
assert.match(llms, /Private workspace data stays\s+in\s+the visitor's browser\./);
assert.equal(
  redirects,
  "/* /index.html 200\n",
  "Cloudflare Pages must serve direct SPA routes through the application shell."
);

console.log(JSON.stringify({
  check: "deploy-output",
  expectedBase,
  references: references.length,
  spaFallback: true,
  canonicalOrigin: "https://getzenid.com/",
  searchFiles: ["robots.txt", "sitemap.xml", "llms.txt"],
  cloudflareSpaRedirect: true,
}));
