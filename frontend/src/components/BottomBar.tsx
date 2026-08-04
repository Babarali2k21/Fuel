"use client";

import { Crown, RefreshCw, Settings2 } from "lucide-react";
import Link from "next/link";

import { useTranslation } from "@/i18n/provider";

interface BottomBarProps {
  onRefresh: () => void;
  loading?: boolean;
  tier?: string;
}

export function BottomBar({ onRefresh, loading, tier }: BottomBarProps) {
  const { t } = useTranslation();
  const isPremium = tier === "premium";

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 px-5 pb-5 pt-2">
      <div className="mx-auto max-w-lg">
        <div className="glass-panel-strong flex items-center gap-2 rounded-[1.25rem] p-2">
          <Link
            href="/settings"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--text-muted)] transition hover:bg-white/5 hover:text-[var(--text-secondary)]"
            aria-label={t("nav.settings")}
          >
            <Settings2 className="h-5 w-5" />
          </Link>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-400 to-teal-500 py-3 text-sm font-semibold text-[#042f2e] shadow-[0_8px_20px_-8px_rgba(45,212,191,0.45)] transition hover:brightness-110 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? t("home.analyzing") : t("home.refreshRecommendation")}
          </button>

          <Link
            href="/upgrade"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${
              isPremium
                ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25"
                : "text-[var(--text-muted)] hover:bg-white/5 hover:text-amber-300"
            }`}
            aria-label={t("common.premium")}
          >
            <Crown className="h-5 w-5" />
          </Link>
        </div>

        <p className="mt-2 text-center text-[10px] font-medium tracking-wide text-[var(--text-muted)]">
          {isPremium ? t("home.premiumRealtime") : t("home.freeRefresh")}
        </p>
      </div>
    </div>
  );
}
