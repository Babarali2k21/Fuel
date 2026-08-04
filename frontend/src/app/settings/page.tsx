"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Car, LineChart, Trash2 } from "lucide-react";
import { useState } from "react";

import { AuthPrompt } from "@/components/AuthPrompt";
import { PremiumFeatureGate } from "@/components/PremiumFeatureGate";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { useSafeAuth } from "@/components/Providers";
import { GlassCard, PageMain, PrimaryButton, SectionLabel } from "@/components/ui";
import { localizePredictionMessage } from "@/i18n";
import { useTranslation } from "@/i18n/provider";
import { api } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export default function SettingsPage() {
  const { t, locale } = useTranslation();
  const { getToken, isSignedIn } = useSafeAuth();
  const queryClient = useQueryClient();
  const { latitude, longitude, fuelType, setFuelType, setConsumption, setTankCapacity } = useAppStore();
  const [carNickname, setCarNickname] = useState("");
  const [carRegistration, setCarRegistration] = useState("");
  const [carConsumption, setCarConsumption] = useState(7);
  const [carTankCapacity, setCarTankCapacity] = useState(50);
  const [threshold, setThreshold] = useState(1.6);
  const [alertRadius, setAlertRadius] = useState(10);

  const carsQuery = useQuery({
    queryKey: ["cars"],
    enabled: isSignedIn,
    queryFn: async () => api.getCars((await getToken())!),
    retry: false,
  });

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    enabled: isSignedIn,
    queryFn: async () => api.getAlerts((await getToken())!),
    retry: false,
  });

  const predictionQuery = useQuery({
    queryKey: ["prediction", fuelType, latitude, longitude],
    enabled: isSignedIn && latitude !== null && longitude !== null,
    queryFn: async () => api.getPrediction(fuelType, latitude!, longitude!, await getToken()),
    retry: false,
  });

  const createCar = useMutation({
    mutationFn: async () =>
      api.createCar(
        {
          name: carNickname.trim() || t("settings.myCar"),
          registration: carRegistration.trim() || null,
          fuel_type: fuelType,
          consumption_l_per_100km: carConsumption,
          tank_capacity_l: carTankCapacity,
          is_default: true,
        },
        (await getToken())!,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cars"] });
      setCarNickname("");
      setCarRegistration("");
    },
  });

  const deleteCar = useMutation({
    mutationFn: async (id: number) => api.deleteCar(id, (await getToken())!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cars"] }),
  });

  const createAlert = useMutation({
    mutationFn: async () =>
      api.createAlert(
        {
          fuel_type: fuelType,
          threshold_eur: threshold,
          radius_km: alertRadius,
          latitude: latitude || 48.208,
          longitude: longitude || 16.373,
        },
        (await getToken())!,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteAlert = useMutation({
    mutationFn: async (id: number) => api.deleteAlert(id, (await getToken())!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const applyCar = (car: {
    fuel_type: typeof fuelType;
    consumption_l_per_100km: number;
    tank_capacity_l: number;
  }) => {
    setFuelType(car.fuel_type);
    setConsumption(car.consumption_l_per_100km);
    setTankCapacity(car.tank_capacity_l);
  };

  return (
    <PageMain>
      <div className="mb-6">
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          {t("settings.account")}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--text-primary)]">
          {t("settings.title")}
        </h1>
      </div>

      {!isSignedIn && (
        <AuthPrompt title={t("settings.title")} description={t("home.signInForSettings")} />
      )}

      {isSignedIn && (
        <div className="space-y-5">
          <SubscriptionSection />

          <PremiumFeatureGate
            title={t("settings.carProfiles")}
            description={t("settings.carProfilesDescription")}
          >
            <GlassCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-teal-300" />
              <h2 className="font-medium text-[var(--text-primary)]">{t("settings.carProfiles")}</h2>
            </div>
            <div className="mb-4 space-y-2">
              {(carsQuery.data || []).map((car) => (
                <div
                  key={car.id}
                  className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5 ring-1 ring-[var(--border)]"
                >
                  <div className="min-w-0 flex-1 text-sm text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">{car.name}</span>
                    {car.registration ? ` · ${car.registration}` : ""} · {car.fuel_type} ·{" "}
                    {car.consumption_l_per_100km} L/100km
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCar(car)}
                    className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-teal-300 ring-1 ring-teal-400/30"
                  >
                    {t("home.applyCar")}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCar.mutate(car.id)}
                    className="shrink-0 rounded-lg p-1.5 text-red-300/80 hover:bg-red-400/10"
                    aria-label={t("home.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid gap-2">
              <input
                value={carNickname}
                onChange={(event) => setCarNickname(event.target.value)}
                placeholder={t("settings.carNicknamePlaceholder")}
                className="input-field"
              />
              <input
                value={carRegistration}
                onChange={(event) => setCarRegistration(event.target.value.toUpperCase())}
                placeholder={t("settings.carRegistrationPlaceholder")}
                className="input-field uppercase"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="30"
                  value={carConsumption}
                  onChange={(event) => setCarConsumption(Number(event.target.value))}
                  className="input-field tabular-nums"
                  placeholder="L/100km"
                />
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={carTankCapacity}
                  onChange={(event) => setCarTankCapacity(Number(event.target.value))}
                  className="input-field tabular-nums"
                  placeholder="Tank L"
                />
              </div>
              <PrimaryButton onClick={() => createCar.mutate()} className="w-full py-2.5">
                {t("common.save")}
              </PrimaryButton>
            </div>
          </GlassCard>
          </PremiumFeatureGate>

          <PremiumFeatureGate
            title={t("settings.priceAlerts")}
            description={t("settings.priceAlertsDescription")}
          >
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-300" />
              <h2 className="font-medium text-[var(--text-primary)]">{t("settings.priceAlerts")}</h2>
            </div>
            <div className="mb-4 space-y-2">
              {(alertsQuery.data || []).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2.5 ring-1 ring-[var(--border)]"
                >
                  <div className="min-w-0 flex-1 text-sm text-[var(--text-secondary)]">
                    {t("settings.alertUnder", {
                      fuel: alert.fuel_type,
                      threshold: alert.threshold_eur.toFixed(2),
                      radius: alert.radius_km,
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteAlert.mutate(alert.id)}
                    className="shrink-0 rounded-lg p-1.5 text-red-300/80 hover:bg-red-400/10"
                    aria-label={t("home.delete")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                value={threshold}
                onChange={(event) => setThreshold(Number(event.target.value))}
                className="input-field tabular-nums"
                placeholder="€/L"
              />
              <input
                type="number"
                min="1"
                max="50"
                value={alertRadius}
                onChange={(event) => setAlertRadius(Number(event.target.value))}
                className="input-field tabular-nums"
                placeholder={t("settings.alertRadius")}
              />
            </div>
            <PrimaryButton onClick={() => createAlert.mutate()} className="mt-2 w-full py-2.5">
              {t("common.alert")}
            </PrimaryButton>
          </GlassCard>
          </PremiumFeatureGate>

          <PremiumFeatureGate
            title={t("settings.prediction")}
            description={t("settings.predictionDescription")}
          >
            <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <LineChart className="h-4 w-4 text-teal-300" />
              <h2 className="font-medium text-[var(--text-primary)]">{t("settings.prediction")}</h2>
            </div>
            {predictionQuery.isLoading && (
              <p className="text-sm text-[var(--text-secondary)]">{t("home.predictionLoading")}</p>
            )}
            {predictionQuery.data && (
              <>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  {localizePredictionMessage(predictionQuery.data.message, locale)}
                </p>
                {predictionQuery.data.current_avg_price && (
                  <p className="mt-3 text-lg font-semibold tabular-nums text-teal-300">
                    {t("common.avg")} €{predictionQuery.data.current_avg_price.toFixed(3)}/L
                  </p>
                )}
              </>
            )}
            {predictionQuery.error && (
              <p className="text-sm text-[var(--text-secondary)]">{t("home.predictionUnavailable")}</p>
            )}
            {latitude === null && (
              <p className="text-sm text-[var(--text-secondary)]">{t("home.predictionNeedsLocation")}</p>
            )}
          </GlassCard>
          </PremiumFeatureGate>
        </div>
      )}

      <GlassCard className="mt-6 p-5">
        <SectionLabel>{t("settings.privacy")}</SectionLabel>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
          {t("settings.privacyDescription")}
        </p>
        <a
          href="/privacy"
          className="mt-3 inline-block text-sm font-medium text-teal-300 hover:text-teal-200"
        >
          {t("common.privacyPolicy")} →
        </a>
      </GlassCard>
    </PageMain>
  );
}
