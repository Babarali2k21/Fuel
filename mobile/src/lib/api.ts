import { API_URL } from "./config";

export type FuelType = "DIE" | "SUP" | "GAS";

export interface OpeningHoursEntry {
  day: string;
  label: string;
  from_time: string;
  to_time: string;
}

export interface StationLocation {
  address: string;
  city: string;
  postal_code: string;
  latitude: number;
  longitude: number;
}

export interface Station {
  id: number;
  name: string;
  location: StationLocation;
  distance_km: number;
  price_per_liter: number | null;
  fuel_type: string;
  open: boolean;
  opening_hours?: OpeningHoursEntry[];
  opening_hours_today?: string;
  has_toilet?: boolean | null;
}

export interface StationCost {
  station: Station;
  fuel_cost: number;
  detour_cost: number;
  total_cost: number;
  extra_distance_km: number;
  explanation: string;
}

export interface RecommendationResponse {
  recommendation: StationCost;
  alternatives: StationCost[];
  nearest_station: StationCost;
  savings_vs_nearest: number;
  liters_needed: number;
  tier: string;
  cached: boolean;
}

export interface PredictionData {
  fuel_type: string;
  trend: "rising" | "falling" | "stable" | "insufficient_data";
  recommendation: "fuel_now" | "wait" | "neutral";
  message: string;
  current_avg_price: number | null;
  change_percent: number | null;
  price_history?: { date: string; price: number }[];
}

export interface ReverseGeocodeResult {
  city: string | null;
  address: string | null;
  postal_code: string | null;
  state: string | null;
  display_name: string;
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(typeof error.detail === "string" ? error.detail : "Request failed");
  }

  return response.json();
}

export const api = {
  getStations: (lat: number, lng: number, fuelType: FuelType) =>
    apiFetch<{ stations: Station[]; tier: string }>(
      `/v1/stations?latitude=${lat}&longitude=${lng}&fuel_type=${fuelType}`,
    ),

  getRecommendation: (body: Record<string, unknown>) =>
    apiFetch<RecommendationResponse>("/v1/recommend", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  reverseGeocode: (lat: number, lng: number, locale = "de") =>
    apiFetch<ReverseGeocodeResult>(
      `/v1/geocode/reverse?latitude=${lat}&longitude=${lng}&locale=${locale}`,
    ),

  getPrediction: (fuelType: FuelType, lat: number, lng: number) =>
    apiFetch<PredictionData>(`/v1/predict/${fuelType}?latitude=${lat}&longitude=${lng}`),
};

export async function fetchStationFuelPrices(
  lat: number,
  lng: number,
  stationId: number,
): Promise<{ DIE: number | null; SUP: number | null; GAS: number | null }> {
  const [diesel, superFuel, gas] = await Promise.all([
    api.getStations(lat, lng, "DIE"),
    api.getStations(lat, lng, "SUP"),
    api.getStations(lat, lng, "GAS"),
  ]);

  const findPrice = (stations: Station[]) =>
    stations.find((station) => station.id === stationId)?.price_per_liter ?? null;

  return {
    DIE: findPrice(diesel.stations),
    SUP: findPrice(superFuel.stations),
    GAS: findPrice(gas.stations),
  };
}
