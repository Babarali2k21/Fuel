"use client";

import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";

import { SecondaryButton } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import type { FuelLog } from "@/lib/api";
import {
  buildExportSummary,
  buildLogbookCsv,
  downloadLogbookPdf,
  getLogbookExportLabels,
} from "@/lib/logbook-export";
import { downloadLogbookCsv, formatPeriodLabel, type LogbookPeriod } from "@/lib/logbook";

interface FuelLogPeriodControlsProps {
  period: LogbookPeriod;
  periodOffset: number;
  onPeriodChange: (period: LogbookPeriod) => void;
  onOffsetChange: (offset: number) => void;
  logs: FuelLog[];
  allLogs: FuelLog[];
}

const periods: LogbookPeriod[] = ["week", "month", "year", "all"];

export function FuelLogPeriodControls({
  period,
  periodOffset,
  onPeriodChange,
  onOffsetChange,
  logs,
  allLogs,
}: FuelLogPeriodControlsProps) {
  const { t, locale } = useTranslation();
  const [exportingPdf, setExportingPdf] = useState(false);

  const periodLabels: Record<LogbookPeriod, string> = {
    week: t("logbook.periodWeek"),
    month: t("logbook.periodMonth"),
    year: t("logbook.periodYear"),
    all: t("logbook.periodAll"),
  };

  const periodSlug = period === "all" ? "all" : `${period}-${periodOffset}`;
  const exportLabels = getLogbookExportLabels(locale, period, periodOffset, t);
  const summaryText = buildExportSummary(logs, locale, t);

  const handleExportCsv = () => {
    const csv = buildLogbookCsv(logs, allLogs, locale, exportLabels);
    downloadLogbookCsv(csv, `spritcheck-logbook-${periodSlug}.csv`);
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await downloadLogbookPdf({
        logs,
        allLogs,
        locale,
        period,
        periodOffset,
        labels: exportLabels,
        filename: `spritcheck-logbook-${periodSlug}.pdf`,
        summaryText,
      });
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2 rounded-2xl bg-black/20 p-1 ring-1 ring-[var(--border)]">
        {periods.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              onPeriodChange(value);
              onOffsetChange(0);
            }}
            className={`rounded-xl py-2 text-xs font-semibold transition ${
              period === value
                ? "bg-gradient-to-b from-teal-400/20 to-teal-500/10 text-teal-200 ring-1 ring-teal-400/30"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            }`}
          >
            {periodLabels[value]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {period !== "all" && (
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-black/20 px-2 py-1.5 ring-1 ring-[var(--border)]">
            <button
              type="button"
              onClick={() => onOffsetChange(periodOffset - 1)}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)]"
              aria-label={t("logbook.prevPeriod")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="flex-1 truncate text-center text-sm font-medium text-[var(--text-primary)]">
              {formatPeriodLabel(period, periodOffset, locale)}
            </p>
            <button
              type="button"
              onClick={() => onOffsetChange(periodOffset + 1)}
              disabled={periodOffset >= 0}
              className="rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-secondary)] disabled:opacity-30"
              aria-label={t("logbook.nextPeriod")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <SecondaryButton
          type="button"
          onClick={handleExportCsv}
          disabled={logs.length === 0}
          className="shrink-0 px-3 py-2 text-xs"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          {t("logbook.exportCsv")}
        </SecondaryButton>

        <SecondaryButton
          type="button"
          onClick={() => void handleExportPdf()}
          disabled={logs.length === 0 || exportingPdf}
          className="shrink-0 px-3 py-2 text-xs"
        >
          <FileText className="h-3.5 w-3.5" />
          {exportingPdf ? t("logbook.exportingPdf") : t("logbook.exportPdf")}
        </SecondaryButton>
      </div>
    </div>
  );
}
