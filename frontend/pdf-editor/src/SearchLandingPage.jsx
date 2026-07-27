import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "./I18nContext.jsx";

const ROOT_METADATA = {
  title: "ZenID — Your local identity workspace.",
  description:
    "Create resumes, portfolios, and fill PDFs privately in your browser. No account required; your professional data stays on your device.",
  canonical: "https://getzenid.com/",
};

function setMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

export default function SearchLandingPage({ page }) {
  const { locale: interfaceLocale } = useI18n();

  useEffect(() => {
    document.documentElement.lang = page.locale;
    document.title = page.title;
    setMeta('meta[name="description"]', "content", page.description);
    setMeta('link[rel="canonical"]', "href", page.canonicalUrl);
    setMeta('meta[property="og:title"]', "content", page.title);
    setMeta('meta[property="og:description"]', "content", page.description);
    setMeta('meta[property="og:url"]', "content", page.canonicalUrl);
    setMeta('meta[name="twitter:title"]', "content", page.title);
    setMeta('meta[name="twitter:description"]', "content", page.description);

    document.head.querySelectorAll('link[rel="alternate"]').forEach((link) => link.remove());
    document.head
      .querySelectorAll("script[data-zenid-search-structured]")
      .forEach((script) => script.remove());

    const alternates = [
      [page.locale, page.canonicalUrl],
      [page.alternateLocale, page.alternateUrl],
      ["x-default", page.alternateUrl],
    ].map(([language, href]) => {
      const link = document.createElement("link");
      link.rel = "alternate";
      link.hreflang = language;
      link.href = href;
      link.dataset.zenidSearchAlternate = "";
      document.head.append(link);
      return link;
    });
    const structured = document.createElement("script");
    structured.type = "application/ld+json";
    structured.dataset.zenidSearchStructured = "";
    structured.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: page.toolName,
      url: page.canonicalUrl,
      description: page.description,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Any",
      isAccessibleForFree: true,
      inLanguage: page.locale,
    });
    document.head.append(structured);

    return () => {
      document.documentElement.lang = interfaceLocale;
      document.title = ROOT_METADATA.title;
      setMeta('meta[name="description"]', "content", ROOT_METADATA.description);
      setMeta('link[rel="canonical"]', "href", ROOT_METADATA.canonical);
      setMeta('meta[property="og:title"]', "content", ROOT_METADATA.title);
      setMeta('meta[property="og:description"]', "content", ROOT_METADATA.description);
      setMeta('meta[property="og:url"]', "content", ROOT_METADATA.canonical);
      setMeta('meta[name="twitter:title"]', "content", ROOT_METADATA.title);
      setMeta('meta[name="twitter:description"]', "content", ROOT_METADATA.description);
      alternates.forEach((link) => link.remove());
      structured.remove();
    };
  }, [interfaceLocale, page]);

  return (
    <main
      data-search-page={page.id}
      className="mx-auto max-w-5xl px-6 py-16 text-stone-100"
    >
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-500">
          {page.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
          {page.heading}
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-300">{page.intro}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
            to={page.toolPath}
          >
            {page.ctaLabel}
          </Link>
          <a
            className="rounded-xl border border-stone-700 px-5 py-3 font-semibold text-stone-200 transition-colors hover:border-stone-600 hover:text-white"
            href={page.alternateUrl}
            hrefLang={page.alternateLocale}
          >
            {page.alternateLabel}
          </a>
        </div>
      </header>

      <div className="mt-12 grid gap-6">
        {page.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-stone-800 bg-stone-900/60 p-6"
          >
            <h2 className="text-2xl font-semibold text-white">{section.heading}</h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-4 text-base leading-8 text-stone-300">
                {paragraph}
              </p>
            ))}
            {section.items?.length ? (
              <ul className="mt-5 list-disc space-y-3 pl-5 text-stone-300">
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </main>
  );
}
