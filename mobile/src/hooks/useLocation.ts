import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";

const FALLBACK = {
  latitude: 48.2082,
  longitude: 16.3738,
  label: "Wien, Austria",
};

export interface UserLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocation(FALLBACK);
        setError("Location permission denied. Showing Vienna.");
        return FALLBACK;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const next: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: "Your location",
      };

      try {
        const { api } = await import("../lib/api");
        const geocoded = await api.reverseGeocode(next.latitude, next.longitude);
        next.label = geocoded.display_name.split(",").slice(0, 2).join(",").trim();
      } catch {
        // Keep generic label if reverse geocode fails.
      }

      setLocation(next);
      return next;
    } catch (err) {
      setLocation(FALLBACK);
      setError(err instanceof Error ? err.message : "Could not get location");
      return FALLBACK;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { location, loading, error, refresh };
}
