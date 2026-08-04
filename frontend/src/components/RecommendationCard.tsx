"use client";

import { ArrowUpRight, Clock, MapPin, Navigation, Toilet } from "lucide-react";

import { localizeExplanation } from "@/i18n";
import { useTranslation } from "@/i18n/provider";
import type { Station, StationCost } from "@/lib/api";
import {
  formatStationAddress,
  googleMapsUrl,
  localizeOpeningHoursToday,
} from "@/lib/station-utils";

interface RecommendationCardProps {
  result: StationCost;
  highlighted?: boolean;
  savings?: number;
  rank?: number;
}

export function RecommendationCard({
  result,
  highlighted = false,
  savings,
  rank,
}: RecommendationCardProps) {
  const { t, locale } = useTranslation();
  const { station } = result;
  const explanation = result.explanation
    ? localizeExplanation(result.explanation, locale)
    : "";

  if (highlighted) {
    return (
      <div className="recommendation-glow rounded-[1.35rem] glass-panel-strong p-[1px]">
        <div className="rounded-[1.3rem] bg-[var(--bg-elevated)] p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-teal-400/10 px-2.5 py-1 ring-1 ring-teal-400/20">
                <Navigation className="h-3 w-3 text-teal-300" />
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">
                  {t("station.bestChoice")}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold leading-tight text-[var(--text-primary)]">
                {station.name}
              </h3>
            </div>
            {savings !== undefined && savings > 0 && (
              <div className="text-right">
                <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                  {t("station.savings")}
                </p>
                <p className="text-2xl font-bold tabular-nums text-teal-300">€{savings.toFixed(2)}</p>
              </div>
            )}
          </div>

          <StationAddress station={station} className="mb-3" />

          <StationMeta station={station} className="mb-5" />

          <div className="mb-5 grid grid-cols-3 gap-2">
            <Metric label={t("station.pricePerLiter")} value={`€${station.price_per_liter?.toFixed(3)}`} accent />
            <Metric label={t("station.distance")} value={`${station.distance_km.toFixed(1)} km`} />
            <Metric label={t("station.totalCost")} value={`€${result.total_cost.toFixed(2)}`} highlight />
          </div>

          {explanation && (
            <div className="rounded-2xl border border-teal-400/15 bg-teal-400/5 px-4 py-3">
              <p className="text-sm leading-relaxed text-teal-100/90">{explanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const mapsUrl = googleMapsUrl(
    station.location.latitude,
    station.location.longitude,
    formatStationAddress(station.location),
  );

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-panel block rounded-[1.15rem] p-4 transition hover:bg-[var(--surface-hover)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            {rank !== undefined && (
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-[var(--text-muted)]">
                {rank}
              </span>
            )}
            <p className="truncate font-medium text-[var(--text-primary)]">{station.name}</p>
          </div>
          <p className="truncate text-xs text-[var(--text-muted)]">
            {station.distance_km.toFixed(1)} km · €{station.price_per_liter?.toFixed(3)}/L
          </p>
          <StationMeta station={station} compact className="mt-2" />
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold tabular-nums text-[var(--text-primary)]">
            €{result.total_cost.toFixed(2)}
          </p>
          <ArrowUpRight className="ml-auto h-3.5 w-3.5 text-[var(--text-muted)]" />
        </div>
      </div>
    </a>
  );
}

function StationAddress({ station, className = "" }: { station: Station; className?: string }) {
  const { t } = useTranslation();
  const address = formatStationAddress(station.location);
  const mapsUrl = googleMapsUrl(
    station.location.latitude,
    station.location.longitude,
    address,
  );

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-2 text-sm leading-relaxed text-[var(--text-secondary)] transition hover:text-teal-200 ${className}`}
      title={t("station.openInMaps")}
    >
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400/60 transition group-hover:text-teal-300" />
      <span className="underline decoration-teal-400/30 underline-offset-2 transition group-hover:decoration-teal-300/60">
        {address}
      </span>
    </a>
  );
}

function StationMeta({
  station,
  compact = false,
  className = "",
}: {
  station: Station;
  compact?: boolean;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const hoursToday = station.opening_hours_today
    ? localizeOpeningHoursToday(station.opening_hours_today, locale)
    : "";

  if (!hoursToday && station.has_toilet == null) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${compact ? "text-[11px]" : "text-xs"} ${className}`}>
      {hoursToday && (
        <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
          <Clock className="h-3 w-3 shrink-0" />
          <span>
            {compact ? hoursToday : `${t("station.hoursToday")}: ${hoursToday}`}
          </span>
        </span>
      )}
      {station.has_toilet === true && (
        <span className="inline-flex items-center gap-1 text-teal-300/90">
          <Toilet className="h-3 w-3 shrink-0" />
          <span>{t("station.toiletAvailable")}</span>
        </span>
      )}
      {station.has_toilet === false && (
        <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
          <Toilet className="h-3 w-3 shrink-0 opacity-40" />
          <span>{t("station.toiletUnavailable")}</span>
        </span>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  accent,
  highlight,
}: {
  label: string;
  value: string;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl bg-black/25 px-3 py-3 ring-1 ring-[var(--border)]">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
        {label}
      </p>
      <p
        className={`text-base font-bold tabular-nums ${
          highlight ? "text-gradient-accent" : accent ? "text-teal-200" : "text-[var(--text-primary)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
