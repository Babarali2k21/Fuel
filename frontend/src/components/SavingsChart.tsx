"use client";

import { useTranslation } from "@/i18n/provider";

interface SavingsChartProps {
  data: { month: string; savings_eur: number }[];
}

export function SavingsChart({ data }: SavingsChartProps) {
  const { t, locale } = useTranslation();

  if (data.length === 0) {
    return null;
  }

  const max = Math.max(...data.map((item) => item.savings_eur), 0.01);

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {t("dashboard.monthlyTrend")}
      </p>
      <div className="flex items-end gap-2" style={{ minHeight: 96 }}>
        {data.map((item) => {
          const height = Math.max(8, (item.savings_eur / max) * 80);
          const label = new Date(`${item.month}-01`).toLocaleDateString(
            locale === "de" ? "de-AT" : "en-GB",
            { month: "short" },
          );
          return (
            <div key={item.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-teal-500/40 to-teal-300/80"
                style={{ height }}
                title={`€${item.savings_eur.toFixed(2)}`}
              />
              <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
