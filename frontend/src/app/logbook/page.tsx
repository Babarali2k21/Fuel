"use client";

import { Car, Fuel, History } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AuthPrompt } from "@/components/AuthPrompt";
import { FuelLogHistory } from "@/components/logbook/FuelLogHistory";
import { FuelLogPeriodControls } from "@/components/logbook/FuelLogPeriodControls";
import { FuelLogStats } from "@/components/logbook/FuelLogStats";
import { NewFuelEntryForm } from "@/components/logbook/NewFuelEntryForm";
import { VehicleManager } from "@/components/logbook/VehicleManager";
import { useSafeAuth } from "@/components/Providers";
import { PageMain } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api } from "@/lib/api";
import { filterLogsByPeriod, type LogbookPeriod } from "@/lib/logbook";

type Tab = "fill" | "vehicles" | "history";

export default function LogbookPage() {
  const { t } = useTranslation();
  const { getToken, isSignedIn } = useSafeAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("fill");
  const [selectedCarId, setSelectedCarId] = useState<number | "">("");
  const [historyFilterCarId, setHistoryFilterCarId] = useState<number | "all">("all");
  const [period, setPeriod] = useState<LogbookPeriod>("month");
  const [periodOffset, setPeriodOffset] = useState(0);

  const carsQuery = useQuery({
    queryKey: ["cars"],
    enabled: isSignedIn,
    queryFn: async () => api.getCars((await getToken())!),
  });

  const logsQuery = useQuery({
    queryKey: ["fuel-logs"],
    enabled: isSignedIn,
    queryFn: async () => api.getFuelLogs((await getToken())!),
  });

  const deleteCar = useMutation({
    mutationFn: async (id: number) => api.deleteCar(id, (await getToken())!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
      setSelectedCarId("");
    },
  });

  const deleteLog = useMutation({
    mutationFn: async (id: number) => api.deleteFuelLog(id, (await getToken())!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["fuel-logs"] }),
  });

  const cars = carsQuery.data ?? [];
  const logs = logsQuery.data ?? [];

  const filteredLogs = useMemo(() => {
    const byCar =
      historyFilterCarId === "all"
        ? logs
        : logs.filter((log) => log.car_id === historyFilterCarId);
    return filterLogsByPeriod(byCar, period, periodOffset);
  }, [logs, historyFilterCarId, period, periodOffset]);

  useEffect(() => {
    if (selectedCarId !== "" || cars.length === 0) return;
    const defaultCar = cars.find((car) => car.is_default) ?? cars[0];
    if (defaultCar) setSelectedCarId(defaultCar.id);
  }, [cars, selectedCarId]);

  useEffect(() => {
    if (cars.length === 0) setTab("vehicles");
  }, [cars.length]);

  const tabs: { id: Tab; label: string; icon: typeof Fuel }[] = [
    { id: "fill", label: t("logbook.tabFill"), icon: Fuel },
    { id: "vehicles", label: t("logbook.tabVehicles"), icon: Car },
    { id: "history", label: t("logbook.tabHistory"), icon: History },
  ];

  return (
    <PageMain>
      <div className="mb-5">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {t("logbook.title")}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
          {t("logbook.title")}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("logbook.subtitle")}</p>
      </div>

      {!isSignedIn && (
        <AuthPrompt title={t("logbook.title")} description={t("logbook.signInRequired")} />
      )}

      {isSignedIn && (
        <div className="space-y-5">
          <FuelLogPeriodControls
            period={period}
            periodOffset={periodOffset}
            onPeriodChange={setPeriod}
            onOffsetChange={setPeriodOffset}
            logs={filteredLogs}
            allLogs={logs}
          />

          <FuelLogStats
            logs={filteredLogs}
            cars={cars}
            filterCarId={historyFilterCarId}
            onFilterChange={setHistoryFilterCarId}
          />

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/20 p-1 ring-1 ring-[var(--border)]">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition ${
                  tab === id
                    ? "bg-gradient-to-b from-teal-400/20 to-teal-500/10 text-teal-200 ring-1 ring-teal-400/30"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {tab === "fill" && (
            <NewFuelEntryForm
              cars={cars}
              logs={logs}
              selectedCarId={selectedCarId}
              onSelectCar={setSelectedCarId}
              onNeedVehicle={() => setTab("vehicles")}
              onSaved={() => {
                queryClient.invalidateQueries({ queryKey: ["fuel-logs"] });
                setTab("history");
              }}
            />
          )}

          {tab === "vehicles" && (
            <VehicleManager
              cars={cars}
              selectedCarId={selectedCarId}
              onSelectCar={setSelectedCarId}
              onDeleteCar={(id) => deleteCar.mutate(id)}
              onCreated={(carId) => {
                setSelectedCarId(carId);
                setTab("fill");
              }}
            />
          )}

          {tab === "history" && (
            <FuelLogHistory
              logs={filteredLogs}
              allLogs={logs}
              period={period}
              periodOffset={periodOffset}
              onDelete={(id) => deleteLog.mutate(id)}
            />
          )}
        </div>
      )}
    </PageMain>
  );
}
