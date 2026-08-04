"use client";

import type { StationCost } from "@/lib/api";

import { RecommendationCard } from "./RecommendationCard";
import { SectionLabel } from "./ui";
import { useTranslation } from "@/i18n/provider";

interface StationListProps {
  recommendation: StationCost;
  alternatives: StationCost[];
  savings: number;
}

export function StationList({ recommendation, alternatives, savings }: StationListProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <RecommendationCard result={recommendation} highlighted savings={savings} />

      {alternatives.length > 0 && (
        <div>
          <SectionLabel>{t("station.alternatives")}</SectionLabel>
          <div className="space-y-2.5">
            {alternatives.map((alternative, index) => (
              <RecommendationCard
                key={alternative.station.id}
                result={alternative}
                rank={index + 2}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
