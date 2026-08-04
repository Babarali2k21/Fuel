"use client";

import { Droplets, Euro, Gauge, Receipt } from "lucide-react";

import { GlassCard } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import type { CarProfile, FuelLog } from "@/lib/api";
import { computeStats, formatNumber } from "@/lib/logbook";

interface FuelLogStatsProps {
  logs: FuelLog[];
  cars: CarProfile[];
  filterCarId: number | "all";
  onFilterChange: (carId: number | "all") => void;
}

export function FuelLogStats({ logs, cars, filterCarId, onFilterChange }: FuelLogStatsProps) {
  const { t, locale } = useTranslation();
  const stats = computeStats(logs);

  const cards = [
    {
      label: t("logbook.statEntries"),
      value: String(stats.entries),
      icon: Receipt,
    },
    {
      label: t("logbook.statLiters"),
      value: `${formatNumber(stats.totalLiters, locale)} L`,
      icon: Droplets,
    },
    {
      label: t("logbook.statSpent"),
      value: `€${formatNumber(stats.totalCost, locale)}`,
      icon: Euro,
    },
    {
      label: t("logbook.statAvgPrice"),
      value: stats.avgPricePerLiter ? `€${formatNumber(stats.avgPricePerLiter, locale, 3)}/L` : "—",
      icon: Gauge,
    },
  ];

  return (
    <div className="space-y-3">
      {cars.length > 1 && (
        <select
          value={filterCarId === "all" ? "all" : String(filterCarId)}
          onChange={(event) => {
            const value = event.target.value;
            onFilterChange(value === "all" ? "all" : Number(value));
          }}
          className="input-field text-sm"
        >
          <option value="all">{t("logbook.allVehicles")}</option>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {car.name}
              {car.registration ? ` (${car.registration})` : ""}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <GlassCard key={label} className="p-4">
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10 ring-1 ring-teal-400/20">
              <Icon className="h-4 w-4 text-teal-300" />
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
