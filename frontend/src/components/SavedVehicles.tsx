"use client";

import { Car } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useSafeAuth } from "@/components/Providers";
import { GlassCard, SectionLabel } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export function SavedVehicles() {
  const { t } = useTranslation();
  const { getToken, isSignedIn } = useSafeAuth();
  const { setFuelType, setConsumption, setTankCapacity } = useAppStore();

  const carsQuery = useQuery({
    queryKey: ["cars"],
    enabled: isSignedIn,
    queryFn: async () => {
      const token = await getToken();
      return api.getCars(token!);
    },
    retry: false,
  });

  const cars = carsQuery.data ?? [];
  if (cars.length === 0) {
    return null;
  }

  return (
    <GlassCard className="mb-5 p-5">
      <SectionLabel>{t("home.savedCars")}</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {cars.map((car) => (
          <button
            key={car.id}
            type="button"
            onClick={() => {
              setFuelType(car.fuel_type);
              setConsumption(car.consumption_l_per_100km);
              setTankCapacity(car.tank_capacity_l);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-sm ring-1 ring-[var(--border)] transition hover:bg-teal-400/10 hover:ring-teal-400/30"
          >
            <Car className="h-3.5 w-3.5 text-teal-300" />
            <span className="font-medium text-[var(--text-primary)]">{car.name}</span>
            {car.registration && (
              <span className="text-xs text-[var(--text-muted)]">{car.registration}</span>
            )}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">{t("home.applyCarHint")}</p>
    </GlassCard>
  );
}
