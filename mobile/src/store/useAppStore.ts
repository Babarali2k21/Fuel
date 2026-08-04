import { create } from "zustand";

import { FuelType, Station } from "../lib/api";

export interface PriceAlert {
  id: string;
  stationId: number;
  stationName: string;
  targetPrice: number;
  fuelType: FuelType;
}

interface UserState {
  name: string;
  email: string;
  isPremium: boolean;
}

interface AppState {
  favorites: number[];
  alerts: PriceAlert[];
  user: UserState;
  fuelType: FuelType;
  stationsCache: Record<number, Station>;
  toggleFavorite: (stationId: number) => void;
  isFavorite: (stationId: number) => boolean;
  addAlert: (alert: Omit<PriceAlert, "id">) => void;
  removeAlert: (alertId: string) => void;
  upgradeToPremium: () => void;
  setFuelType: (fuelType: FuelType) => void;
  setStationsCache: (stations: Station[]) => void;
  getStation: (stationId: number) => Station | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  favorites: [],
  alerts: [],
  user: {
    name: "Alex Müller",
    email: "alex@example.com",
    isPremium: false,
  },
  fuelType: "DIE",
  stationsCache: {},
  toggleFavorite: (stationId) =>
    set((state) => ({
      favorites: state.favorites.includes(stationId)
        ? state.favorites.filter((id) => id !== stationId)
        : [...state.favorites, stationId],
    })),
  isFavorite: (stationId) => get().favorites.includes(stationId),
  addAlert: (alert) =>
    set((state) => ({
      alerts: [...state.alerts, { ...alert, id: `alert-${Date.now()}` }],
    })),
  removeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== alertId),
    })),
  upgradeToPremium: () =>
    set((state) => ({
      user: { ...state.user, isPremium: true },
    })),
  setFuelType: (fuelType) => set({ fuelType }),
  setStationsCache: (stations) =>
    set((state) => ({
      stationsCache: {
        ...state.stationsCache,
        ...Object.fromEntries(stations.map((station) => [station.id, station])),
      },
    })),
  getStation: (stationId) => get().stationsCache[stationId],
}));
