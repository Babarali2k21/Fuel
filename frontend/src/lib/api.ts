const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

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
  route_optimized?: boolean;
  direct_route_km?: number | null;
  route_distance_km?: number | null;
}

export interface UserProfile {
  id: number;
  email: string;
  is_premium: boolean;
  subscription_status: string | null;
  plan: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  has_used_trial: boolean;
  trial_days: number;
}

export interface CarProfile {
  id: number;
  name: string;
  registration: string | null;
  fuel_type: FuelType;
  consumption_l_per_100km: number;
  tank_capacity_l: number;
  is_default: boolean;
}

export interface FuelLog {
  id: number;
  car_id: number;
  car_name: string;
  car_registration: string | null;
  refueled_at: string;
  odometer_km: number;
  liters: number;
  fuel_type: FuelType;
  total_cost_eur: number;
  price_per_liter: number | null;
  notes: string | null;
  created_at: string;
}

export interface PriceAlert {
  id: number;
  fuel_type: FuelType;
  threshold_eur: number;
  radius_km: number;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface DashboardData {
  total_savings_eur: number;
  monthly_savings_eur: number;
  decisions_count: number;
  best_decision: {
    station_name: string;
    savings_eur: number;
    date: string;
  } | null;
  recent_decisions?: {
    station_name: string;
    savings_eur: number;
    date: string;
  }[];
  monthly_breakdown?: {
    month: string;
    savings_eur: number;
  }[];
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

export interface GeocodeSearchResult extends ReverseGeocodeResult {
  latitude: number;
  longitude: number;
}

async function apiFetch<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return response.json();
}

export const api = {
  getRecommendation: (body: Record<string, unknown>, token?: string | null) =>
    apiFetch<RecommendationResponse>("/v1/recommend", { method: "POST", body: JSON.stringify(body) }, token),

  getStations: (lat: number, lng: number, fuelType: FuelType, token?: string | null) =>
    apiFetch<{ stations: Station[]; tier: string }>(
      `/v1/stations?latitude=${lat}&longitude=${lng}&fuel_type=${fuelType}`,
      {},
      token,
    ),

  reverseGeocode: (lat: number, lng: number, locale: string = "de") =>
    apiFetch<ReverseGeocodeResult>(
      `/v1/geocode/reverse?latitude=${lat}&longitude=${lng}&locale=${locale}`,
    ),

  geocodeAddress: (query: string, locale: string = "de") =>
    apiFetch<GeocodeSearchResult>(
      `/v1/geocode/search?q=${encodeURIComponent(query)}&locale=${locale}`,
    ),

  geocodeSuggest: (query: string, locale: string = "de") =>
    apiFetch<GeocodeSearchResult[]>(
      `/v1/geocode/suggest?q=${encodeURIComponent(query)}&locale=${locale}`,
    ),

  getMe: (token?: string | null) => apiFetch<UserProfile>("/v1/me", {}, token),

  getPrediction: (fuelType: FuelType, lat: number, lng: number, token?: string | null) =>
    apiFetch<PredictionData>(`/v1/predict/${fuelType}?latitude=${lat}&longitude=${lng}`, {}, token),

  getDashboard: (token?: string | null) => apiFetch<DashboardData>("/v1/dashboard", {}, token),

  getCars: (token?: string | null) => apiFetch<CarProfile[]>("/v1/cars", {}, token),

  createCar: (body: Omit<CarProfile, "id">, token?: string | null) =>
    apiFetch<CarProfile>("/v1/cars", { method: "POST", body: JSON.stringify(body) }, token),

  updateCar: (id: number, body: Partial<Omit<CarProfile, "id">>, token?: string | null) =>
    apiFetch<CarProfile>(`/v1/cars/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token),

  deleteCar: (id: number, token?: string | null) =>
    apiFetch<{ ok: boolean }>(`/v1/cars/${id}`, { method: "DELETE" }, token),

  getAlerts: (token?: string | null) => apiFetch<PriceAlert[]>("/v1/alerts", {}, token),

  createAlert: (body: Omit<PriceAlert, "id" | "active">, token?: string | null) =>
    apiFetch<PriceAlert>("/v1/alerts", { method: "POST", body: JSON.stringify(body) }, token),

  deleteAlert: (id: number, token?: string | null) =>
    apiFetch<{ ok: boolean }>(`/v1/alerts/${id}`, { method: "DELETE" }, token),

  getFuelLogs: (token?: string | null) => apiFetch<FuelLog[]>("/v1/fuel-logs", {}, token),

  createFuelLog: (
    body: {
      car_id: number;
      refueled_at: string;
      odometer_km: number;
      liters: number;
      fuel_type: FuelType;
      total_cost_eur: number;
      notes?: string | null;
    },
    token: string,
  ) => apiFetch<FuelLog>("/v1/fuel-logs", { method: "POST", body: JSON.stringify(body) }, token),

  deleteFuelLog: (id: number, token: string) =>
    apiFetch<{ ok: boolean }>(`/v1/fuel-logs/${id}`, { method: "DELETE" }, token),

  createCheckout: (plan: "monthly" | "yearly", token: string) =>
    apiFetch<{ checkout_url: string }>("/v1/stripe/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    }, token),

  getPortal: (token: string) => apiFetch<{ portal_url: string }>("/v1/stripe/portal", {}, token),
};
