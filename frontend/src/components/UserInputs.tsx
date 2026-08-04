"use client";

import { Loader2, Droplets, Gauge, Fuel, Navigation } from "lucide-react";
import { useState } from "react";

import { PremiumFeatureGate } from "@/components/PremiumFeatureGate";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { GlassCard, PrimaryButton, SecondaryButton, SectionLabel } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api, type GeocodeSearchResult } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

const fuelKeys = [
  { value: "DIE", labelKey: "vehicle.diesel" },
  { value: "SUP", labelKey: "vehicle.super" },
  { value: "GAS", labelKey: "vehicle.gas" },
] as const;

type RouteField = "from" | "to";

export function UserInputs() {
  const { t, locale } = useTranslation();
  const {
    latitude,
    longitude,
    fuelType,
    consumptionLPer100km,
    tankCapacityL,
    currentTankL,
    destinationAddress,
    destinationResolved,
    routeFromAddress,
    routeFromResolved,
    setFuelType,
    setConsumption,
    setTankCapacity,
    setCurrentTank,
    setDestinationAddress,
    setDestinationResolved,
    setRouteFromAddress,
    setRouteFromResolved,
    clearRoute,
  } = useAppStore();

  const [routeEnabled, setRouteEnabled] = useState(
    Boolean(
      (destinationResolved || destinationAddress) && (routeFromResolved || routeFromAddress),
    ),
  );
  const [searchingField, setSearchingField] = useState<RouteField | null>(null);
  const [searchError, setSearchError] = useState<Partial<Record<RouteField, string>>>({});

  const tankPercent = Math.min(100, Math.round((currentTankL / tankCapacityL) * 100));

  const toggleRoute = (enabled: boolean) => {
    setRouteEnabled(enabled);
    setSearchError({});
    if (!enabled) {
      clearRoute();
    }
  };

  const searchAddress = async (field: RouteField) => {
    const query = (field === "from" ? routeFromAddress : destinationAddress).trim();
    if (query.length < 3) {
      setSearchError((prev) => ({ ...prev, [field]: t("home.destinationNotFound") }));
      return;
    }

    setSearchingField(field);
    setSearchError((prev) => ({ ...prev, [field]: undefined }));

    try {
      const result = await api.geocodeAddress(query, locale);
      if (field === "from") {
        setRouteFromResolved(result.display_name, result.latitude, result.longitude);
      } else {
        setDestinationResolved(result.display_name, result.latitude, result.longitude);
      }
    } catch {
      setSearchError((prev) => ({ ...prev, [field]: t("home.destinationNotFound") }));
    } finally {
      setSearchingField(null);
    }
  };

  const useCurrentLocationAsFrom = () => {
    if (latitude === null || longitude === null) {
      setSearchError((prev) => ({ ...prev, from: t("home.enableLocationFirst") }));
      return;
    }

    setRouteFromResolved(
      locationLabel(latitude, longitude, routeFromAddress),
      latitude,
      longitude,
    );
    setSearchError((prev) => ({ ...prev, from: undefined }));
  };

  return (
    <>
      <GlassCard className="mb-5 p-5">
        <SectionLabel>{t("vehicle.title")}</SectionLabel>

        <div className="mb-5">
          <p className="mb-2.5 text-sm font-medium text-[var(--text-secondary)]">{t("vehicle.fuel")}</p>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-black/20 p-1 ring-1 ring-[var(--border)]">
            {fuelKeys.map((option) => {
              const selected = fuelType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFuelType(option.value)}
                  className={`rounded-xl py-2.5 text-center text-sm font-semibold transition ${
                    selected
                      ? "bg-gradient-to-b from-teal-400/20 to-teal-500/10 text-teal-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-teal-400/30"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
              <Gauge className="h-3.5 w-3.5 text-teal-400/70" />
              {t("vehicle.consumption")}
            </span>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="30"
                step="0.1"
                className="input-field tabular-nums pr-14"
                value={consumptionLPer100km}
                onChange={(event) => setConsumption(Number(event.target.value))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                {t("vehicle.per100")}
              </span>
            </div>
          </label>

          <label className="block">
            <span className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
              <Fuel className="h-3.5 w-3.5 text-teal-400/70" />
              {t("vehicle.capacity")}
            </span>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="200"
                className="input-field tabular-nums pr-10"
                value={tankCapacityL}
                onChange={(event) => setTankCapacity(Number(event.target.value))}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)]">
                L
              </span>
            </div>
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)]">
              <Droplets className="h-3.5 w-3.5 text-teal-400/70" />
              {t("vehicle.tankLevel")}
            </span>
            <span className="text-sm font-semibold tabular-nums text-teal-300">
              {currentTankL} L · {tankPercent}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={tankCapacityL}
            step={1}
            value={currentTankL}
            onChange={(event) => setCurrentTank(Number(event.target.value))}
            className="mb-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-black/30 accent-teal-400"
          />
          <div className="h-2 overflow-hidden rounded-full bg-black/30 ring-1 ring-[var(--border)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500/80 via-teal-400 to-teal-300 transition-all duration-300"
              style={{ width: `${tankPercent}%` }}
            />
          </div>
        </div>
      </GlassCard>

      <PremiumFeatureGate
        title={t("home.routeTitle")}
        description={t("home.routePremiumDescription")}
      >
        <GlassCard className="mb-5 p-5">
          <SectionLabel>{t("home.routeTitle")}</SectionLabel>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">{t("home.routeFromToDescription")}</p>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-teal-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-200 ring-1 ring-teal-400/20">
            <Navigation className="h-3 w-3" />
            {t("home.routePremiumBadge")}
          </div>

          <label className="mb-4 flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={routeEnabled}
              onChange={(event) => toggleRoute(event.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)] accent-teal-400"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">{t("home.routeEnabled")}</span>
          </label>

          {routeEnabled && (
            <div className="space-y-4">
              <RouteAddressField
                label={t("home.routeFrom")}
                placeholder={t("home.routeFromPlaceholder")}
                value={routeFromAddress}
                resolved={routeFromResolved}
                resolvedLabel={t("home.routeFromResolved")}
                locale={locale}
                searching={searchingField === "from"}
                error={searchError.from}
                onChange={setRouteFromAddress}
                onSelect={(result) => {
                  setRouteFromResolved(result.display_name, result.latitude, result.longitude);
                  setSearchError((prev) => ({ ...prev, from: undefined }));
                }}
                onSearch={() => void searchAddress("from")}
                extraAction={
                  <SecondaryButton
                    type="button"
                    onClick={useCurrentLocationAsFrom}
                    className="w-full py-2 text-xs"
                  >
                    {t("home.useCurrentLocationAsFrom")}
                  </SecondaryButton>
                }
              />

              <RouteAddressField
                label={t("home.routeTo")}
                placeholder={t("home.routeToPlaceholder")}
                value={destinationAddress}
                resolved={destinationResolved}
                resolvedLabel={t("home.destinationResolved")}
                locale={locale}
                searching={searchingField === "to"}
                error={searchError.to}
                onChange={setDestinationAddress}
                onSelect={(result) => {
                  setDestinationResolved(result.display_name, result.latitude, result.longitude);
                  setSearchError((prev) => ({ ...prev, to: undefined }));
                }}
                onSearch={() => void searchAddress("to")}
              />
            </div>
          )}
        </GlassCard>
      </PremiumFeatureGate>
    </>
  );
}

function locationLabel(lat: number, lng: number, fallback: string): string {
  if (fallback.trim()) return fallback.trim();
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

function RouteAddressField({
  label,
  placeholder,
  value,
  resolved,
  resolvedLabel,
  locale,
  searching,
  error,
  onChange,
  onSelect,
  onSearch,
  extraAction,
}: {
  label: string;
  placeholder: string;
  value: string;
  resolved: string | null;
  resolvedLabel: string;
  locale: string;
  searching: boolean;
  error?: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodeSearchResult) => void;
  onSearch: () => void;
  extraAction?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <AddressAutocomplete
        label={label}
        placeholder={placeholder}
        value={value}
        locale={locale}
        onChange={onChange}
        onSelect={onSelect}
        onSubmit={onSearch}
      />

      {extraAction}

      <PrimaryButton
        type="button"
        onClick={onSearch}
        disabled={searching || value.trim().length < 3}
        className="w-full py-2.5"
      >
        {searching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("home.destinationSearching")}
          </>
        ) : (
          t("home.destinationSearch")
        )}
      </PrimaryButton>

      {resolved && (
        <div className="rounded-xl border border-teal-400/20 bg-teal-400/5 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/80">
            {resolvedLabel}
          </p>
          <p className="mt-1 text-sm text-teal-100">{resolved}</p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
