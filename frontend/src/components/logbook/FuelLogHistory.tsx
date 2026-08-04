"use client";

import { Calendar, Droplets, Gauge, Trash2 } from "lucide-react";

import { GlassCard } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import type { FuelLog } from "@/lib/api";
import {
  computeConsumption,
  formatNumber,
  fuelTypeLabel,
  groupLogsForDisplay,
  type LogbookPeriod,
} from "@/lib/logbook";

interface FuelLogHistoryProps {
  logs: FuelLog[];
  allLogs: FuelLog[];
  period: LogbookPeriod;
  periodOffset: number;
  onDelete: (id: number) => void;
}

export function FuelLogHistory({
  logs,
  allLogs,
  period,
  periodOffset,
  onDelete,
}: FuelLogHistoryProps) {
  const { t, locale } = useTranslation();

  if (logs.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{t("logbook.noEntriesInPeriod")}</p>
      </GlassCard>
    );
  }

  const groups = groupLogsForDisplay(logs, period, periodOffset, locale);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.key} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{group.label}</p>
            <p className="text-xs tabular-nums text-[var(--text-muted)]">
              {t("logbook.groupSummary", {
                entries: group.stats.entries,
                liters: formatNumber(group.stats.totalLiters, locale),
                cost: formatNumber(group.stats.totalCost, locale),
              })}
            </p>
          </div>

          {group.logs.map((log) => {
            const consumption = computeConsumption(allLogs, log);
            const dateLabel = new Date(log.refueled_at).toLocaleDateString(
              locale === "de" ? "de-AT" : "en-GB",
              { day: "numeric", month: "short", year: "numeric" },
            );

            return (
              <GlassCard key={log.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/20">
                    <Droplets className="h-4 w-4 text-teal-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium text-[var(--text-primary)]">{log.car_name}</p>
                      {log.car_registration && (
                        <span className="text-xs text-[var(--text-muted)]">{log.car_registration}</span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateLabel}
                      </span>
                      <span>{fuelTypeLabel(log.fuel_type, t)}</span>
                      <span className="tabular-nums">{formatNumber(log.odometer_km, locale, 0)} km</span>
                    </div>

                    <p className="mt-2 text-sm tabular-nums text-[var(--text-secondary)]">
                      {t("logbook.entrySummary", {
                        liters: formatNumber(log.liters, locale),
                        cost: formatNumber(log.total_cost_eur, locale),
                        km: formatNumber(log.odometer_km, locale, 0),
                      })}
                    </p>

                    {consumption !== null && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-teal-200">
                        <Gauge className="h-3 w-3" />
                        {t("logbook.consumptionSinceLast", {
                          value: formatNumber(consumption, locale, 1),
                        })}
                      </p>
                    )}

                    {log.notes && (
                      <p className="mt-1 text-xs italic text-[var(--text-muted)]">{log.notes}</p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onDelete(log.id)}
                    className="shrink-0 rounded-lg p-1.5 text-red-300/80 hover:bg-red-400/10"
                    aria-label={t("home.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      ))}
    </div>
  );
}
