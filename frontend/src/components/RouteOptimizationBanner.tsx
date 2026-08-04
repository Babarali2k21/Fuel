"use client";

import { Navigation } from "lucide-react";

import { useTranslation } from "@/i18n/provider";
import type { RecommendationResponse } from "@/lib/api";

interface RouteOptimizationBannerProps {
  data: RecommendationResponse;
}

export function RouteOptimizationBanner({ data }: RouteOptimizationBannerProps) {
  const { t } = useTranslation();

  if (!data.route_optimized || !data.direct_route_km) {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl border border-teal-400/20 bg-teal-400/5 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-teal-200">
        <Navigation className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          {t("home.routeOptimized")}
        </span>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        {t("home.routeStats", {
          direct: data.direct_route_km.toFixed(1),
          total: (data.route_distance_km ?? data.direct_route_km).toFixed(1),
        })}
      </p>
    </div>
  );
}
