"use client";

import { Car, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useSafeAuth } from "@/components/Providers";
import { GlassCard, PrimaryButton } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api, type CarProfile, type FuelType } from "@/lib/api";
import { fuelTypeLabel } from "@/lib/logbook";

const fuelTypes: FuelType[] = ["DIE", "SUP", "GAS"];

interface VehicleManagerProps {
  cars: CarProfile[];
  selectedCarId: number | "";
  onSelectCar: (id: number) => void;
  onDeleteCar: (id: number) => void;
  onCreated: (carId: number) => void;
}

export function VehicleManager({
  cars,
  selectedCarId,
  onSelectCar,
  onDeleteCar,
  onCreated,
}: VehicleManagerProps) {
  const { t } = useTranslation();
  const { getToken } = useSafeAuth();
  const queryClient = useQueryClient();

  const [nickname, setNickname] = useState("");
  const [registration, setRegistration] = useState("");
  const [vehicleFuelType, setVehicleFuelType] = useState<FuelType>("DIE");
  const [consumption, setConsumption] = useState(7);
  const [tankCapacity, setTankCapacity] = useState(50);
  const [showForm, setShowForm] = useState(cars.length === 0);

  const createCar = useMutation({
    mutationFn: async () =>
      api.createCar(
        {
          name: nickname.trim() || t("settings.myCar"),
          registration: registration.trim() || null,
          fuel_type: vehicleFuelType,
          consumption_l_per_100km: consumption,
          tank_capacity_l: tankCapacity,
          is_default: cars.length === 0,
        },
        (await getToken())!,
      ),
    onSuccess: (car) => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      setNickname("");
      setRegistration("");
      setShowForm(false);
      onCreated(car.id);
    },
  });

  return (
    <div className="space-y-4">
      {cars.length > 0 && (
        <div className="space-y-2">
          {cars.map((car) => (
            <GlassCard key={car.id} className="flex items-center gap-2 p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 ring-1 ring-teal-400/20">
                <Car className="h-4 w-4 text-teal-300" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--text-primary)]">{car.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {[car.registration, fuelTypeLabel(car.fuel_type, t), `${car.consumption_l_per_100km} L/100km`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectCar(car.id)}
                className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ring-1 ${
                  selectedCarId === car.id
                    ? "bg-teal-400/15 text-teal-200 ring-teal-400/30"
                    : "text-[var(--text-muted)] ring-[var(--border)]"
                }`}
              >
                {selectedCarId === car.id ? t("logbook.activeVehicle") : t("logbook.selectVehicleAction")}
              </button>
              <button
                type="button"
                onClick={() => onDeleteCar(car.id)}
                className="shrink-0 rounded-lg p-1.5 text-red-300/80 hover:bg-red-400/10"
                aria-label={t("home.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {!showForm && cars.length > 0 && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border border-dashed border-[var(--border)] py-3 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          + {t("logbook.addVehicle")}
        </button>
      )}

      {(showForm || cars.length === 0) && (
        <GlassCard className="p-5">
          <h2 className="mb-4 font-medium text-[var(--text-primary)]">{t("logbook.addVehicle")}</h2>
          <div className="grid gap-3">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                {t("settings.carNickname")}
              </span>
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder={t("settings.carNicknamePlaceholder")}
                className="input-field"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                {t("settings.carRegistration")}
              </span>
              <input
                value={registration}
                onChange={(event) => setRegistration(event.target.value.toUpperCase())}
                placeholder={t("settings.carRegistrationPlaceholder")}
                className="input-field uppercase"
              />
            </label>
            <div>
              <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                {t("logbook.fuelType")}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {fuelTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setVehicleFuelType(type)}
                    className={`rounded-xl py-2 text-xs font-semibold ${
                      vehicleFuelType === type
                        ? "bg-teal-400/15 text-teal-200 ring-1 ring-teal-400/30"
                        : "bg-black/20 text-[var(--text-muted)] ring-1 ring-[var(--border)]"
                    }`}
                  >
                    {fuelTypeLabel(type, t)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                  {t("vehicle.consumption")}
                </span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="30"
                  value={consumption}
                  onChange={(event) => setConsumption(Number(event.target.value))}
                  className="input-field tabular-nums"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-[var(--text-muted)]">
                  {t("vehicle.capacity")}
                </span>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={tankCapacity}
                  onChange={(event) => setTankCapacity(Number(event.target.value))}
                  className="input-field tabular-nums"
                />
              </label>
            </div>
            <PrimaryButton
              onClick={() => createCar.mutate()}
              disabled={(!nickname.trim() && !registration.trim()) || createCar.isPending}
              className="w-full py-2.5"
            >
              {t("logbook.addVehicle")}
            </PrimaryButton>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
