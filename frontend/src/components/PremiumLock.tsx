"use client";

import { Lock, Sparkles } from "lucide-react";
import Link from "next/link";

import { GlassCard } from "./ui";
import { useTranslation } from "@/i18n/provider";

interface PremiumLockProps {
  title: string;
  description: string;
}

export function PremiumLock({ title, description }: PremiumLockProps) {
  const { t } = useTranslation();

  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="relative">
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10 ring-1 ring-amber-400/20">
            <Lock className="h-3.5 w-3.5 text-amber-300" />
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">{title}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/80">
              {t("common.premium")}
            </p>
          </div>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
        <Link
          href="/upgrade"
          className="inline-flex flex-col items-start gap-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-400 px-4 py-2 text-sm font-semibold text-[#422006] transition hover:brightness-110"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            {t("common.startFreeTrial")}
          </span>
          <span className="text-[10px] font-medium opacity-80">{t("upgrade.trialBadge")}</span>
        </Link>
      </div>
    </GlassCard>
  );
}
