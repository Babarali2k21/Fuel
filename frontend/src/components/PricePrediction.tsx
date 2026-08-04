"use client";

import { LineChart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { PremiumFeatureGate } from "@/components/PremiumFeatureGate";
import { PriceSparkline } from "@/components/PriceSparkline";
import { useSafeAuth } from "@/components/Providers";
import { GlassCard } from "@/components/ui";
import { localizePredictionMessage } from "@/i18n";
import { useTranslation } from "@/i18n/provider";
import { api, type FuelType } from "@/lib/api";

interface PricePredictionProps {
  fuelType: FuelType;
  latitude: number | null;
  longitude: number | null;
}

export function PricePrediction({ fuelType, latitude, longitude }: PricePredictionProps) {
  const { t, locale } = useTranslation();
  const { getToken } = useSafeAuth();

  const predictionQuery = useQuery({
    queryKey: ["prediction", fuelType, latitude, longitude],
    enabled: latitude !== null && longitude !== null,
    queryFn: async () => {
      const token = await getToken();
      return api.getPrediction(fuelType, latitude!, longitude!, token);
    },
    retry: false,
  });

  const content = () => {
    if (latitude === null || longitude === null) {
      return (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-teal-300" />
            <h2 className="font-medium text-[var(--text-primary)]">{t("home.predictionTitle")}</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{t("home.predictionNeedsLocation")}</p>
        </GlassCard>
      );
    }

    if (predictionQuery.isLoading) {
      return (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-4 w-4 animate-pulse text-teal-300" />
            <h2 className="font-medium text-[var(--text-primary)]">{t("home.predictionTitle")}</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{t("home.predictionLoading")}</p>
        </GlassCard>
      );
    }

    if (predictionQuery.error || !predictionQuery.data) {
      return (
        <GlassCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-teal-300" />
            <h2 className="font-medium text-[var(--text-primary)]">{t("home.predictionTitle")}</h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{t("home.predictionUnavailable")}</p>
        </GlassCard>
      );
    }

    const data = predictionQuery.data;

    return (
      <GlassCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <LineChart className="h-4 w-4 text-teal-300" />
          <h2 className="font-medium text-[var(--text-primary)]">{t("home.predictionTitle")}</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {localizePredictionMessage(data.message, locale)}
        </p>
        {data.current_avg_price && (
          <p className="mt-3 text-lg font-semibold tabular-nums text-teal-300">
            {t("common.avg")} €{data.current_avg_price.toFixed(3)}/L
          </p>
        )}
        {data.change_percent !== null && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t("home.predictionTrend", { percent: data.change_percent.toFixed(1) })}
          </p>
        )}
        {data.price_history && data.price_history.length > 1 && (
          <PriceSparkline data={data.price_history} />
        )}
      </GlassCard>
    );
  };

  return (
    <PremiumFeatureGate
      title={t("home.predictionTitle")}
      description={t("settings.predictionDescription")}
    >
      {content()}
    </PremiumFeatureGate>
  );
}
