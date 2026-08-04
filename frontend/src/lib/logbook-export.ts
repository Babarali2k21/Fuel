import type { FuelLog } from "@/lib/api";

import {
  computeConsumption,
  computeStats,
  formatNumber,
  formatPeriodLabel,
  groupLogsForDisplay,
  type LogbookPeriod,
} from "./logbook";

function escapeCsv(value: string | number | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export interface LogbookExportLabels {
  title: string;
  period: string;
  generated: string;
  summary: string;
  columns: string[];
}

export interface LogbookExportRow {
  date: string;
  vehicle: string;
  registration: string;
  odometer: string;
  liters: string;
  fuelType: string;
  cost: string;
  pricePerLiter: string;
  consumption: string;
  notes: string;
}

export function buildLogbookCsv(
  logs: FuelLog[],
  allLogs: FuelLog[],
  locale: string,
  labels: LogbookExportLabels,
): string {
  const sorted = [...logs].sort(
    (a, b) => a.refueled_at.localeCompare(b.refueled_at) || a.id - b.id,
  );

  const csvRows = sorted.map((log) => {
    const consumption = computeConsumption(allLogs, log);
    const pricePerLiter = log.price_per_liter ?? log.total_cost_eur / log.liters;
    return [
      log.refueled_at,
      log.car_name,
      log.car_registration ?? "",
      log.odometer_km,
      log.liters,
      log.fuel_type,
      log.total_cost_eur,
      pricePerLiter.toFixed(3),
      consumption != null ? consumption.toFixed(1) : "",
      log.notes ?? "",
    ]
      .map(escapeCsv)
      .join(",");
  });

  return [labels.columns.join(","), ...csvRows].join("\n");
}

export function getLogbookExportLabels(
  locale: string,
  period: LogbookPeriod,
  periodOffset: number,
  t: (key: string, params?: Record<string, string | number>) => string,
): LogbookExportLabels {
  const periodLabel =
    period === "all"
      ? t("logbook.periodAll")
      : formatPeriodLabel(period, periodOffset, locale);

  if (locale === "de") {
    return {
      title: "SpritCheck Tankbuch",
      period: periodLabel,
      generated: `Erstellt am ${new Date().toLocaleDateString("de-AT")}`,
      summary: "Zusammenfassung",
      columns: [
        "Datum",
        "Fahrzeug",
        "Kennzeichen",
        "km",
        "Liter",
        "Kraftstoff",
        "EUR",
        "EUR/L",
        "L/100km",
        "Notiz",
      ],
    };
  }

  return {
    title: "SpritCheck Fuel Logbook",
    period: periodLabel,
    generated: `Generated on ${new Date().toLocaleDateString("en-GB")}`,
    summary: "Summary",
    columns: [
      "Date",
      "Vehicle",
      "Registration",
      "km",
      "Liters",
      "Fuel",
      "EUR",
      "EUR/L",
      "L/100km",
      "Notes",
    ],
  };
}

export function getLogbookExportRows(
  logs: FuelLog[],
  allLogs: FuelLog[],
  locale: string,
): LogbookExportRow[] {
  const sorted = [...logs].sort(
    (a, b) => a.refueled_at.localeCompare(b.refueled_at) || a.id - b.id,
  );

  const dateLocale = locale === "de" ? "de-AT" : "en-GB";

  return sorted.map((log) => {
    const consumption = computeConsumption(allLogs, log);
    const pricePerLiter = log.price_per_liter ?? log.total_cost_eur / log.liters;

    return {
      date: new Date(log.refueled_at).toLocaleDateString(dateLocale),
      vehicle: log.car_name,
      registration: log.car_registration ?? "",
      odometer: formatNumber(log.odometer_km, locale, 0),
      liters: formatNumber(log.liters, locale),
      fuelType: log.fuel_type,
      cost: formatNumber(log.total_cost_eur, locale),
      pricePerLiter: formatNumber(pricePerLiter, locale, 3),
      consumption: consumption != null ? formatNumber(consumption, locale, 1) : "",
      notes: log.notes ?? "",
    };
  });
}

export async function downloadLogbookPdf(options: {
  logs: FuelLog[];
  allLogs: FuelLog[];
  locale: string;
  period: LogbookPeriod;
  periodOffset: number;
  labels: LogbookExportLabels;
  filename: string;
  summaryText: string;
}): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const {
    logs,
    allLogs,
    locale,
    period,
    periodOffset,
    labels,
    filename,
    summaryText,
  } = options;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const rows = getLogbookExportRows(logs, allLogs, locale);
  const groups = groupLogsForDisplay(logs, period, periodOffset, locale);

  doc.setFontSize(16);
  doc.text(labels.title, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text(labels.period, 14, 23);
  doc.text(labels.generated, 14, 28);
  doc.setTextColor(0);

  doc.setFontSize(11);
  doc.text(labels.summary, 14, 36);
  doc.setFontSize(10);
  doc.text(summaryText, 14, 42);

  let startY = 48;

  if (groups.length > 1) {
    for (const group of groups) {
      if (startY > 180) {
        doc.addPage();
        startY = 16;
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${group.label} — ${group.stats.entries} · ${formatNumber(group.stats.totalLiters, locale)} L · €${formatNumber(group.stats.totalCost, locale)}`,
        14,
        startY,
      );
      doc.setFont("helvetica", "normal");
      startY += 4;

      const groupRows = getLogbookExportRows(group.logs, allLogs, locale).map((row) => [
        row.date,
        row.vehicle,
        row.registration,
        row.odometer,
        row.liters,
        row.fuelType,
        row.cost,
        row.pricePerLiter,
        row.consumption,
        row.notes,
      ]);

      autoTable(doc, {
        startY,
        head: [labels.columns],
        body: groupRows,
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [13, 148, 136], textColor: 255 },
        margin: { left: 14, right: 14 },
        theme: "grid",
      });

      startY = (doc as import("jspdf").jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        ?.finalY
        ? (doc as import("jspdf").jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
        : startY + 20;
    }
  } else {
    autoTable(doc, {
      startY,
      head: [labels.columns],
      body: rows.map((row) => [
        row.date,
        row.vehicle,
        row.registration,
        row.odometer,
        row.liters,
        row.fuelType,
        row.cost,
        row.pricePerLiter,
        row.consumption,
        row.notes,
      ]),
      styles: { fontSize: 8, cellPadding: 1.5 },
      headStyles: { fillColor: [13, 148, 136], textColor: 255 },
      margin: { left: 14, right: 14 },
      theme: "grid",
    });
  }

  doc.save(filename);
}

export function buildExportSummary(
  logs: FuelLog[],
  locale: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const stats = computeStats(logs);
  return t("logbook.exportSummary", {
    entries: stats.entries,
    liters: formatNumber(stats.totalLiters, locale),
    cost: formatNumber(stats.totalCost, locale),
    avg: stats.avgPricePerLiter
      ? formatNumber(stats.avgPricePerLiter, locale, 3)
      : "—",
  });
}
