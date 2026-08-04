import { create } from "zustand";
import { persist } from "zustand/middleware";

import { detectBrowserLocale, type Locale } from "@/i18n";
import type { FuelType } from "@/lib/api";

interface AppState {
  locale: Locale;
  localeHydrated: boolean;
  latitude: number | null;
  longitude: number | null;
  locationCity: string | null;
  locationAddress: string | null;
  fuelType: FuelType;
  consumptionLPer100km: number;
  tankCapacityL: number;
  currentTankL: number;
  destinationLat: number | null;
  destinationLng: number | null;
  destinationAddress: string;
  destinationResolved: string | null;
  routeFromLat: number | null;
  routeFromLng: number | null;
  routeFromAddress: string;
  routeFromResolved: string | null;
  setLocale: (locale: Locale) => void;
  hydrateLocale: () => void;
  setLocation: (lat: number, lng: number) => void;
  setLocationDetails: (city: string | null, address: string | null) => void;
  clearLocationDetails: () => void;
  setFuelType: (fuelType: FuelType) => void;
  setConsumption: (value: number) => void;
  setTankCapacity: (value: number) => void;
  setCurrentTank: (value: number) => void;
  setDestination: (lat: number | null, lng: number | null) => void;
  setDestinationAddress: (destinationAddress: string) => void;
  setDestinationResolved: (destinationResolved: string | null, lat: number, lng: number) => void;
  setRouteFromAddress: (routeFromAddress: string) => void;
  setRouteFromResolved: (routeFromResolved: string | null, lat: number, lng: number) => void;
  clearDestination: () => void;
  clearRoute: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      locale: "de",
      localeHydrated: false,
      latitude: null,
      longitude: null,
      locationCity: null,
      locationAddress: null,
      fuelType: "DIE",
      consumptionLPer100km: 7.0,
      tankCapacityL: 50,
      currentTankL: 10,
      destinationLat: null,
      destinationLng: null,
      destinationAddress: "",
      destinationResolved: null,
      routeFromLat: null,
      routeFromLng: null,
      routeFromAddress: "",
      routeFromResolved: null,
      setLocale: (locale) => set({ locale }),
      hydrateLocale: () => {
        if (get().localeHydrated) return;
        const stored = get().locale;
        set({
          locale: stored || detectBrowserLocale(),
          localeHydrated: true,
        });
      },
      setLocation: (latitude, longitude) => {
        const prev = get();
        const unchanged =
          prev.latitude !== null &&
          prev.longitude !== null &&
          Math.abs(prev.latitude - latitude) < 0.0001 &&
          Math.abs(prev.longitude - longitude) < 0.0001;

        set({
          latitude,
          longitude,
          ...(unchanged ? {} : { locationCity: null, locationAddress: null }),
        });
      },
      setLocationDetails: (locationCity, locationAddress) => set({ locationCity, locationAddress }),
      clearLocationDetails: () => set({ locationCity: null, locationAddress: null }),
      setFuelType: (fuelType) => set({ fuelType }),
      setConsumption: (consumptionLPer100km) => set({ consumptionLPer100km }),
      setTankCapacity: (tankCapacityL) => set({ tankCapacityL }),
      setCurrentTank: (currentTankL) => set({ currentTankL }),
      setDestination: (destinationLat, destinationLng) => set({ destinationLat, destinationLng }),
      setDestinationAddress: (destinationAddress) =>
        set({
          destinationAddress,
          destinationResolved: null,
          destinationLat: null,
          destinationLng: null,
        }),
      setDestinationResolved: (destinationResolved, destinationLat, destinationLng) =>
        set({ destinationResolved, destinationLat, destinationLng }),
      clearDestination: () =>
        set({
          destinationAddress: "",
          destinationResolved: null,
          destinationLat: null,
          destinationLng: null,
        }),
      setRouteFromAddress: (routeFromAddress) =>
        set({
          routeFromAddress,
          routeFromResolved: null,
          routeFromLat: null,
          routeFromLng: null,
        }),
      setRouteFromResolved: (routeFromResolved, routeFromLat, routeFromLng) =>
        set({ routeFromResolved, routeFromLat, routeFromLng }),
      clearRoute: () =>
        set({
          destinationAddress: "",
          destinationResolved: null,
          destinationLat: null,
          destinationLng: null,
          routeFromAddress: "",
          routeFromResolved: null,
          routeFromLat: null,
          routeFromLng: null,
        }),
    }),
    {
      name: "spritcheck-preferences",
      partialize: (state) => ({
        locale: state.locale,
        latitude: state.latitude,
        longitude: state.longitude,
        locationCity: state.locationCity,
        locationAddress: state.locationAddress,
        fuelType: state.fuelType,
        consumptionLPer100km: state.consumptionLPer100km,
        tankCapacityL: state.tankCapacityL,
        currentTankL: state.currentTankL,
        destinationLat: state.destinationLat,
        destinationLng: state.destinationLng,
        destinationAddress: state.destinationAddress,
        destinationResolved: state.destinationResolved,
        routeFromLat: state.routeFromLat,
        routeFromLng: state.routeFromLng,
        routeFromAddress: state.routeFromAddress,
        routeFromResolved: state.routeFromResolved,
      }),
    },
  ),
);
