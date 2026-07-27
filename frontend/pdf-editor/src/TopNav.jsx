import { Link, useLocation } from "react-router-dom";
import { Home } from "lucide-react";
import { useI18n } from "./I18nContext.jsx";
import { SEARCH_PAGES } from "./searchPageContent.js";

export default function TopNav() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const searchPage = SEARCH_PAGES.find(
    (page) => location.pathname.replace(/\/$/, "") === `/${page.path}`
  );
  const { locale, setLocale, t } = useI18n();
  const selectedLocale = searchPage?.locale || locale;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800/50 bg-stone-950/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center transition-opacity hover:opacity-90" aria-label={t("ZenID home")}>
          <img
            src={`${import.meta.env.BASE_URL}assets/zenid-wordmark.png`}
            alt="ZenID"
            width={1244}
            height={332}
            className="h-6 w-auto sm:h-7 md:h-8"
          />
        </Link>

        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label={t("Application language")}
            className="flex rounded-lg border border-stone-700 bg-stone-900 p-0.5 text-xs font-semibold"
          >
            {["tr", "en"].map((option) => (
              searchPage ? (
                <Link
                  key={option}
                  to={
                    option === searchPage.locale
                      ? `/${searchPage.path}`
                      : new URL(searchPage.alternateUrl).pathname
                  }
                  aria-current={selectedLocale === option ? "page" : undefined}
                  lang={option}
                  className={`rounded-md px-2.5 py-1.5 transition-colors ${
                    selectedLocale === option
                      ? "bg-amber-800 text-white"
                      : "text-stone-400 hover:text-stone-100"
                  }`}
                >
                  {option.toUpperCase()}
                </Link>
              ) : (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocale(option)}
                  aria-pressed={selectedLocale === option}
                  lang={option}
                  className={`rounded-md px-2.5 py-1.5 transition-colors ${
                    selectedLocale === option
                    ? "bg-amber-800 text-white"
                    : "text-stone-400 hover:text-stone-100"
                  }`}
                >
                  {option.toUpperCase()}
                </button>
              )
            ))}
          </div>
        {!isHome && (
          <Link
            to="/"
            title={t("Back to home")}
            className="flex items-center justify-center rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-900 hover:text-stone-200"
            aria-label={t("Go to home")}
          >
            <Home size={20} />
          </Link>
        )}
        </div>
      </div>
    </nav>
  );
}
