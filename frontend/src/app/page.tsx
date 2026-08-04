"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, MapPinned, Radar } from "lucide-react";

import { useSafeAuth } from "@/components/Providers";
import { BottomBar } from "@/components/BottomBar";
import { PricePrediction } from "@/components/PricePrediction";
import { RouteOptimizationBanner } from "@/components/RouteOptimizationBanner";
import { SavedVehicles } from "@/components/SavedVehicles";
import { StationList } from "@/components/StationList";
import { UserInputs } from "@/components/UserInputs";
import { GlassCard, PageMain, SectionLabel, SecondaryButton } from "@/components/ui";
import { useTranslation } from "@/i18n/provider";
import { api, type RecommendationResponse } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

export default function HomePage() {
  const { t, locale } = useTranslation();
  const {
    latitude,
    longitude,
    locationCity,
    locationAddress,
    fuelType,
    consumptionLPer100km,
    tankCapacityL,
    currentTankL,
    destinationLat,
    destinationLng,
    routeFromLat,
    routeFromLng,
    routeFromResolved,
    destinationResolved,
    setLocation,
    setLocationDetails,
  } = useAppStore();

  const routeActive =
    routeFromLat !== null &&
    routeFromLng !== null &&
    destinationLat !== null &&
    destinationLng !== null &&
    Boolean(routeFromResolved && destinationResolved);

  const { getToken, isSignedIn } = useSafeAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [resolvingLocation, setResolvingLocation] = useState(false);
  const [data, setData] = useState<RecommendationResponse | null>(null);
  const locationRequested = useRef(false);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t("home.geolocationUnsupported"));
      return;
    }

    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords.latitude, position.coords.longitude);
      },
      (geoError) => {
        if (latitude !== null && longitude !== null) {
          return;
        }
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? t("home.geolocationDenied")
            : t("home.geolocationFailed"),
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }, [latitude, longitude, setLocation, t]);

  const fetchRecommendation = useCallback(async () => {
    const originLat = routeActive ? routeFromLat : latitude;
    const originLng = routeActive ? routeFromLng : longitude;

    if (originLat === null || originLng === null) {
      setError(routeActive ? t("home.routeAddressesRequired") : t("home.enableLocationFirst"));
      return;
    }

    if (routeActive && (destinationLat === null || destinationLng === null)) {
      setError(t("home.routeAddressesRequired"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = isSignedIn ? await getToken() : null;
      const body: Record<string, unknown> = {
        latitude: originLat,
        longitude: originLng,
        fuel_type: fuelType,
        consumption_l_per_100km: consumptionLPer100km,
        tank_capacity_l: tankCapacityL,
        current_tank_l: currentTankL,
      };

      if (routeActive && destinationLat !== null && destinationLng !== null) {
        body.destination_lat = destinationLat;
        body.destination_lng = destinationLng;
      }

      const result = await api.getRecommendation(body, token);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("home.recommendationFailed"));
    } finally {
      setLoading(false);
    }
  }, [
    routeActive,
    routeFromLat,
    routeFromLng,
    latitude,
    longitude,
    fuelType,
    consumptionLPer100km,
    tankCapacityL,
    currentTankL,
    destinationLat,
    destinationLng,
    getToken,
    isSignedIn,
    t,
  ]);

  useEffect(() => {
    if (locationRequested.current) {
      return;
    }
    locationRequested.current = true;
    fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    if (latitude === null || longitude === null) {
      return;
    }

    let cancelled = false;
    setResolvingLocation(true);

    api
      .reverseGeocode(latitude, longitude, locale)
      .then((result) => {
        if (cancelled) return;

        const cityLine = result.city
          ? [result.postal_code, result.city].filter(Boolean).join(" ")
          : result.display_name;

        const detailLine = result.address || result.state || null;
        setLocationDetails(cityLine, detailLine);
      })
      .catch(() => {
        if (cancelled) return;
        setLocationDetails(
          `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`,
          t("home.addressUnavailable"),
        );
      })
      .finally(() => {
        if (!cancelled) {
          setResolvingLocation(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, locale, setLocationDetails, t]);

  useEffect(() => {
    const originLat = routeActive ? routeFromLat : latitude;
    const originLng = routeActive ? routeFromLng : longitude;

    if (originLat !== null && originLng !== null) {
      fetchRecommendation();
    }
  }, [
    routeActive,
    routeFromLat,
    routeFromLng,
    latitude,
    longitude,
    fuelType,
    destinationLat,
    destinationLng,
    fetchRecommendation,
  ]);

  const predictionLat = routeActive ? routeFromLat : latitude;
  const predictionLng = routeActive ? routeFromLng : longitude;

  const locationTitle = !latitude
    ? t("home.locationRequired")
    : resolvingLocation
      ? t("home.resolvingLocation")
      : locationCity || t("home.locationDetected");

  const locationSubtitle = !latitude
    ? t("home.locationHint")
    : resolvingLocation
      ? t("home.resolvingLocation")
      : locationAddress || "";

  return (
    <PageMain>
      <section className="hero-glow mb-6">
        <GlassCard strong className="p-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300/70">
            {t("home.engineLabel")}
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-[var(--text-primary)]">
            {t("home.heroTitle")}{" "}
            <span className="text-gradient-accent">{t("common.austria")}</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
            {t("home.heroSubtitle")}
          </p>
        </GlassCard>
      </section>

      <div className="mb-5">
        <SectionLabel>{routeActive ? t("home.routeTitle") : t("home.location")}</SectionLabel>
        {routeActive ? (
          <GlassCard className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("home.routeFrom")}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{routeFromResolved}</p>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("home.routeTo")}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{destinationResolved}</p>
              </div>
            </div>
          </GlassCard>
        ) : (
        <GlassCard className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${
                latitude
                  ? "bg-teal-400/10 ring-teal-400/25 text-teal-300"
                  : "bg-white/5 ring-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {latitude ? <MapPinned className="h-5 w-5" /> : <LocateFixed className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[var(--text-primary)]">{locationTitle}</p>
              {locationSubtitle && (
                <p className="truncate text-xs text-[var(--text-muted)]">{locationSubtitle}</p>
              )}
            </div>
            <SecondaryButton onClick={fetchLocation} className="shrink-0 px-4 py-2 text-xs">
              {latitude ? t("common.renew") : t("common.activate")}
            </SecondaryButton>
          </div>
          {locationError && (
            <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300">
              {locationError}
            </p>
          )}
        </GlassCard>
        )}
      </div>

      <div className="mb-5">
        <SavedVehicles />
        <UserInputs />
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mb-5">
        <SectionLabel>{t("home.recommendation")}</SectionLabel>

        {loading && !data && (
          <GlassCard className="p-6">
            <div className="flex items-center gap-3">
              <Radar className="h-5 w-5 animate-pulse text-teal-400" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3 rounded-lg" />
                <div className="skeleton h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          </GlassCard>
        )}

        {data ? (
          <>
            <RouteOptimizationBanner data={data} />
            <StationList
              recommendation={data.recommendation}
              alternatives={data.alternatives}
              savings={data.savings_vs_nearest}
            />
          </>
        ) : (
          !loading && (
            <GlassCard className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-400/10 ring-1 ring-teal-400/20">
                <Radar className="h-6 w-6 text-teal-300" />
              </div>
              <p className="font-medium text-[var(--text-primary)]">{t("home.readyTitle")}</p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("home.readySubtitle")}</p>
            </GlassCard>
          )
        )}
      </div>

      <PricePrediction fuelType={fuelType} latitude={predictionLat} longitude={predictionLng} />

      <BottomBar onRefresh={fetchRecommendation} loading={loading} tier={data?.tier ?? "free"} />
    </PageMain>
  );
}
