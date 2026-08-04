"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useSafeAuth } from "@/components/Providers";
import { GlassCard, PrimaryButton } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api, type CarProfile, type FuelLog, type FuelType } from "@/lib/api";
import { formatNumber, fuelTypeLabel, getLastOdometerForCar } from "@/lib/logbook";

const fuelTypes: FuelType[] = ["DIE", "SUP", "GAS"];

interface NewFuelEntryFormProps {
  cars: CarProfile[];
  logs: FuelLog[];
  selectedCarId: number | "";
  onSelectCar: (id: number) => void;
  onNeedVehicle: () => void;
  onSaved: () => void;
}

export function NewFuelEntryForm({
  cars,
  logs,
  selectedCarId,
  onSelectCar,
  onNeedVehicle,
  onSaved,
}: NewFuelEntryFormProps) {
  const { t, locale } = useTranslation();
  const { getToken } = useSafeAuth();

  const selectedCar = cars.find((car) => car.id === selectedCarId);

  const [refueledAt, setRefueledAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [odometer, setOdometer] = useState("");
  const [liters, setLiters] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [fuelType, setFuelType] = useState<FuelType>("DIE");
  const [notes, setNotes] = useState("");

  const lastOdometer = useMemo(() => {
    if (selectedCarId === "") return null;
    return getLastOdometerForCar(logs, selectedCarId);
  }, [logs, selectedCarId]);

  useEffect(() => {
    if (selectedCar) setFuelType(selectedCar.fuel_type);
  }, [selectedCar]);

  useEffect(() => {
    if (odometer !== "" || lastOdometer === null) return;
    setOdometer(String(lastOdometer));
  }, [lastOdometer, odometer]);

  const litersNum = parseFloat(liters);
  const costNum = parseFloat(totalCost);
  const pricePreview =
    litersNum > 0 && costNum > 0 ? costNum / litersNum : null;

  const createLog = useMutation({
    mutationFn: async () =>
      api.createFuelLog(
        {
          car_id: selectedCarId as number,
          refueled_at: refueledAt,
          odometer_km: Number(odometer),
          liters: litersNum,
          fuel_type: fuelType,
          total_cost_eur: costNum,
          notes: notes.trim() || null,
        },
        (await getToken())!,
      ),
    onSuccess: () => {
      setLiters("");
      setTotalCost("");
      setNotes("");
      onSaved();
    },
  });

  if (cars.length === 0) {
    return (
      <GlassCard className="p-5 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{t("logbook.noVehicles")}</p>
        <button
          type="button"
          onClick={onNeedVehicle}
          className="mt-3 text-sm font-medium text-teal-300 hover:text-teal-200"
        >
          {t("logbook.addFirstVehicle")}
        </button>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <h2 className="mb-4 font-medium text-[var(--text-primary)]">{t("logbook.newEntry")}</h2>

      <div className="grid gap-3">
        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("logbook.selectVehicle")}
          </span>
          <select
            value={selectedCarId === "" ? "" : String(selectedCarId)}
            onChange={(event) => onSelectCar(Number(event.target.value))}
            className="input-field"
          >
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name}
                {car.registration ? ` (${car.registration})` : ""}
              </option>
            ))}
          </select>
        </label>

        {lastOdometer !== null && (
          <p className="text-xs text-[var(--text-muted)]">
            {t("logbook.lastOdometer", { km: formatNumber(lastOdometer, locale, 0) })}
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("logbook.date")}
          </span>
          <input
            type="date"
            value={refueledAt}
            onChange={(event) => setRefueledAt(event.target.value)}
            className="input-field"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("logbook.odometer")}
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={odometer}
            onChange={(event) => setOdometer(event.target.value)}
            placeholder={lastOdometer !== null ? String(lastOdometer) : "0"}
            className="input-field tabular-nums"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
              {t("logbook.liters")}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={liters}
              onChange={(event) => setLiters(event.target.value)}
              className="input-field tabular-nums"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
              {t("logbook.totalCost")}
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={totalCost}
              onChange={(event) => setTotalCost(event.target.value)}
              className="input-field tabular-nums"
            />
          </label>
        </div>

        {pricePreview !== null && (
          <p className="rounded-lg bg-teal-400/5 px-3 py-2 text-sm text-teal-200 ring-1 ring-teal-400/20">
            {t("logbook.pricePreview", {
              price: formatNumber(pricePreview, locale, 3),
            })}
          </p>
        )}

        <div>
          <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("logbook.fuelType")}
          </span>
          <div className="grid grid-cols-3 gap-2">
            {fuelTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFuelType(type)}
                className={`rounded-xl py-2 text-xs font-semibold ${
                  fuelType === type
                    ? "bg-teal-400/15 text-teal-200 ring-1 ring-teal-400/30"
                    : "bg-black/20 text-[var(--text-muted)] ring-1 ring-[var(--border)]"
                }`}
              >
                {fuelTypeLabel(type, t)}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
            {t("logbook.notes")}
          </span>
          <input
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("logbook.notesPlaceholder")}
            className="input-field"
          />
        </label>

        <PrimaryButton
          onClick={() => createLog.mutate()}
          disabled={
            selectedCarId === "" ||
            !odometer ||
            !liters ||
            !totalCost ||
            createLog.isPending
          }
          className="w-full py-2.5"
        >
          {t("logbook.addEntry")}
        </PrimaryButton>

        {createLog.isError && (
          <p className="text-sm text-red-300">
            {createLog.error instanceof Error ? createLog.error.message : t("home.recommendationFailed")}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
