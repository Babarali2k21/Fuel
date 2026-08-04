"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";

import { detectBrowserLocale, getUpgradeFeatures, translate, type Locale } from "@/i18n";
import { useAppStore } from "@/store/useAppStore";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useAppStore((state) => state.locale);
  const setLocale = useAppStore((state) => state.setLocale);
  const hydrateLocale = useAppStore((state) => state.hydrateLocale);

  useEffect(() => {
    hydrateLocale();
  }, [hydrateLocale]);

  useEffect(() => {
    document.documentElement.lang = locale === "de" ? "de-AT" : "en";
    document.title = translate(locale, "meta.title");
  }, [locale]);

  const value: I18nContextValue = {
    locale,
    setLocale,
    t: (key, params) => translate(locale, key, params),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}

export function useLocale() {
  return useTranslation().locale;
}
