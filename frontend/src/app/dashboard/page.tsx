"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, TrendingUp, Wallet } from "lucide-react";

import { PremiumFeatureGate } from "@/components/PremiumFeatureGate";
import { SavingsChart } from "@/components/SavingsChart";
import { useSafeAuth } from "@/components/Providers";
import { GlassCard, PageMain, SectionLabel } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const { getToken, isSignedIn } = useSafeAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    enabled: isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      return api.getDashboard(token);
    },
  });

  return (
    <PageMain>
      <div className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {t("dashboard.activity")}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
          {t("dashboard.title")}
        </h1>
      </div>

      <PremiumFeatureGate
        title={t("dashboard.lockTitle")}
        description={t("dashboard.lockPremium")}
      >
        {isLoading && (
          <GlassCard className="p-8 text-center text-sm text-[var(--text-secondary)]">
            {t("dashboard.loading")}
          </GlassCard>
        )}

        {(error || !data) && !isLoading && (
          <GlassCard className="p-8 text-center">
            <p className="font-medium text-[var(--text-primary)]">{t("dashboard.title")}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("home.dashboardEmpty")}</p>
          </GlassCard>
        )}

        {data && !isLoading && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/20">
                  <Wallet className="h-4 w-4 text-teal-300" />
                </div>
                <p className="text-xs text-[var(--text-muted)]">{t("dashboard.totalSaved")}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-gradient-accent">
                  €{data.total_savings_eur.toFixed(2)}
                </p>
              </GlassCard>

              <GlassCard className="p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 ring-1 ring-[var(--border)]">
                  <TrendingUp className="h-4 w-4 text-[var(--text-secondary)]" />
                </div>
                <p className="text-xs text-[var(--text-muted)]">{t("dashboard.thisMonth")}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                  €{data.monthly_savings_eur.toFixed(2)}
                </p>
              </GlassCard>
            </div>

            <GlassCard className="p-5">
              <SectionLabel>{t("dashboard.activity")}</SectionLabel>
              <p className="text-4xl font-bold tabular-nums text-[var(--text-primary)]">
                {data.decisions_count}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {t("dashboard.recommendationsReceived")}
              </p>
              {data.monthly_breakdown && data.monthly_breakdown.length > 0 && (
                <SavingsChart data={data.monthly_breakdown} />
              )}
            </GlassCard>

            {data.best_decision ? (
              <GlassCard strong className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-300" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">
                    {t("dashboard.bestDecision")}
                  </span>
                </div>
                <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-[var(--text-primary)]">
                  {data.best_decision.station_name}
                </p>
                <p className="mt-2 text-sm tabular-nums text-teal-300">
                  {t("dashboard.savingsAmount", {
                    amount: data.best_decision.savings_eur.toFixed(2),
                  })}
                </p>
              </GlassCard>
            ) : (
              <GlassCard className="p-5 text-sm text-[var(--text-secondary)]">
                {t("home.dashboardEmpty")}
              </GlassCard>
            )}

            {data.recent_decisions && data.recent_decisions.length > 0 && (
              <GlassCard className="p-5">
                <SectionLabel>{t("dashboard.recentActivity")}</SectionLabel>
                <div className="space-y-2">
                  {data.recent_decisions.map((item, index) => (
                    <div
                      key={`${item.date}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-black/20 px-3 py-2.5 ring-1 ring-[var(--border)]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                          {item.station_name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {new Date(item.date).toLocaleDateString(
                            locale === "de" ? "de-AT" : "en-GB",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-teal-300">
                        €{item.savings_eur.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </PremiumFeatureGate>
    </PageMain>
  );
}
