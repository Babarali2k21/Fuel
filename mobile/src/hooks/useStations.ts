import { useCallback, useEffect, useState } from "react";

import { api, FuelType, Station } from "../lib/api";
import { useAppStore } from "../store/useAppStore";

export function useStations(latitude: number, longitude: number, enabled = true) {
  const fuelType = useAppStore((state) => state.fuelType);
  const setStationsCache = useAppStore((state) => state.setStationsCache);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.getStations(latitude, longitude, fuelType);
      const priced = response.stations
        .filter((station) => station.open && station.price_per_liter != null)
        .sort((a, b) => a.distance_km - b.distance_km);

      setStations(priced);
      setStationsCache(priced);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stations");
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, fuelType, latitude, longitude, setStationsCache]);

  useEffect(() => {
    void load();
  }, [load]);

  return { stations, loading, error, refresh: load };
}

export function useFuelTypeSelector() {
  const fuelType = useAppStore((state) => state.fuelType);
  const setFuelType = useAppStore((state) => state.setFuelType);
  return { fuelType, setFuelType };
}

export type { FuelType };
