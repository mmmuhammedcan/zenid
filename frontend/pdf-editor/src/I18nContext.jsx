import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  detectInitialLocale,
  INTERFACE_LOCALE_STORAGE_KEY,
  normalizeLocale,
  translate,
} from "./localization.js";

const I18nContext = createContext(null);

function readInitialLocale() {
  let storedLocale = null;
  try {
    storedLocale = window.localStorage.getItem(INTERFACE_LOCALE_STORAGE_KEY);
  } catch {
    // A blocked preference store must not block the local workspace.
  }
  return detectInitialLocale({
    storedLocale,
    browserLocales: navigator.languages || [navigator.language],
  });
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(readInitialLocale);

  const setLocale = (nextLocale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    try {
      window.localStorage.setItem(INTERFACE_LOCALE_STORAGE_KEY, normalized);
    } catch {
      // The visible selection still works for the current session.
    }
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t: (text) => translate(locale, text) }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components -- the hook and provider intentionally share one private context.
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
