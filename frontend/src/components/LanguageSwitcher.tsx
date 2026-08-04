"use client";

import { Languages } from "lucide-react";

import { localeLabels, locales, type Locale } from "@/i18n";
import { useTranslation } from "@/i18n/provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      className={`flex items-center rounded-full bg-black/20 p-0.5 ring-1 ring-[var(--border)] ${
        compact ? "" : "gap-0.5"
      }`}
      role="group"
      aria-label="Language"
    >
      {!compact && <Languages className="ml-2 h-3.5 w-3.5 text-[var(--text-muted)]" />}
      {locales.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as Locale)}
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide transition ${
              active
                ? "bg-teal-400/15 text-teal-200 ring-1 ring-teal-400/25"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
            aria-pressed={active}
          >
            {localeLabels[code as Locale]}
          </button>
        );
      })}
    </div>
  );
}
