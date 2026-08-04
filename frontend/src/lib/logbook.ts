import type { FuelLog } from "@/lib/api";

export type LogbookPeriod = "week" | "month" | "year" | "all";

export function fuelTypeLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    DIE: t("vehicle.diesel"),
    SUP: t("vehicle.super"),
    GAS: t("vehicle.gas"),
  };
  return map[type] ?? type;
}

export function getLastOdometerForCar(logs: FuelLog[], carId: number): number | null {
  const carLogs = logs
    .filter((log) => log.car_id === carId)
    .sort((a, b) => b.refueled_at.localeCompare(a.refueled_at) || b.id - a.id);

  return carLogs[0]?.odometer_km ?? null;
}

export function computeConsumption(
  logs: FuelLog[],
  log: FuelLog,
): number | null {
  const carLogs = logs
    .filter((entry) => entry.car_id === log.car_id && entry.id !== log.id)
    .filter((entry) => entry.refueled_at <= log.refueled_at)
    .sort((a, b) => b.refueled_at.localeCompare(a.refueled_at) || b.id - a.id);

  const previous = carLogs[0];
  if (!previous) return null;

  const distance = log.odometer_km - previous.odometer_km;
  if (distance <= 0) return null;

  return (log.liters / distance) * 100;
}

export interface LogbookStats {
  entries: number;
  totalLiters: number;
  totalCost: number;
  avgPricePerLiter: number | null;
}

export function computeStats(logs: FuelLog[]): LogbookStats {
  if (logs.length === 0) {
    return { entries: 0, totalLiters: 0, totalCost: 0, avgPricePerLiter: null };
  }

  const totalLiters = logs.reduce((sum, log) => sum + log.liters, 0);
  const totalCost = logs.reduce((sum, log) => sum + log.total_cost_eur, 0);

  return {
    entries: logs.length,
    totalLiters,
    totalCost,
    avgPricePerLiter: totalLiters > 0 ? totalCost / totalLiters : null,
  };
}

export function formatNumber(value: number, locale: string, digits = 2): string {
  return value.toLocaleString(locale === "de" ? "de-AT" : "en-GB", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function startOfIsoWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getPeriodRange(
  period: LogbookPeriod,
  offset: number,
): { start: Date; end: Date } | null {
  if (period === "all") return null;

  const now = new Date();

  if (period === "week") {
    const start = startOfIsoWeek(now);
    start.setDate(start.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  const year = now.getFullYear() + offset;
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59, 999),
  };
}

export function filterLogsByPeriod(
  logs: FuelLog[],
  period: LogbookPeriod,
  offset: number,
): FuelLog[] {
  const range = getPeriodRange(period, offset);
  if (!range) return logs;

  return logs.filter((log) => {
    const date = new Date(log.refueled_at);
    return date >= range.start && date <= range.end;
  });
}

export function formatPeriodLabel(
  period: LogbookPeriod,
  offset: number,
  locale: string,
): string {
  const range = getPeriodRange(period, offset);
  if (!range) return "";

  const dateLocale = locale === "de" ? "de-AT" : "en-GB";

  if (period === "week") {
    const startLabel = range.start.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
    });
    const endLabel = range.end.toLocaleDateString(dateLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${startLabel} – ${endLabel}`;
  }

  if (period === "month") {
    return range.start.toLocaleDateString(dateLocale, { month: "long", year: "numeric" });
  }

  return String(range.start.getFullYear());
}

export interface LogbookGroup {
  key: string;
  label: string;
  logs: FuelLog[];
  stats: LogbookStats;
}

export function groupLogsForDisplay(
  logs: FuelLog[],
  period: LogbookPeriod,
  offset: number,
  locale: string,
): LogbookGroup[] {
  const sorted = [...logs].sort(
    (a, b) => b.refueled_at.localeCompare(a.refueled_at) || b.id - a.id,
  );

  if (period !== "all") {
    const label = formatPeriodLabel(period, offset, locale);
    return [
      {
        key: `${period}-${offset}`,
        label,
        logs: sorted,
        stats: computeStats(sorted),
      },
    ];
  }

  const dateLocale = locale === "de" ? "de-AT" : "en-GB";
  const groups = new Map<string, FuelLog[]>();

  for (const log of sorted) {
    const date = new Date(log.refueled_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    groups.set(key, [...(groups.get(key) ?? []), log]);
  }

  return Array.from(groups.entries()).map(([key, groupLogs]) => {
    const [year, month] = key.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString(dateLocale, {
      month: "long",
      year: "numeric",
    });
    return {
      key,
      label,
      logs: groupLogs,
      stats: computeStats(groupLogs),
    };
  });
}


export function downloadLogbookCsv(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
