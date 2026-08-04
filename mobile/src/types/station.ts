import { Station } from "../lib/api";

export type PriceTier = "cheap" | "average" | "expensive";

export function extractBrand(name: string): string {
  const first = name.split(/[\s-]/)[0];
  return first || name.slice(0, 1);
}

export function formatStationAddress(station: Station): string {
  const { location } = station;
  return `${location.address}, ${location.postal_code} ${location.city}`;
}

export function getAveragePrice(stations: Station[]): number {
  const priced = stations.filter((station) => station.price_per_liter != null);
  if (priced.length === 0) return 0;
  return priced.reduce((sum, station) => sum + (station.price_per_liter ?? 0), 0) / priced.length;
}

export function getPriceTier(price: number | null, average: number): PriceTier {
  if (price == null || average <= 0) return "average";
  const delta = price - average;
  if (delta <= -0.02) return "cheap";
  if (delta >= 0.02) return "expensive";
  return "average";
}

export function localizeOpeningHoursToday(hoursToday: string): string {
  const normalized = hoursToday.trim().toLowerCase();
  if (normalized === "24 hours") return "24 Stunden geöffnet";
  if (normalized === "closed today") return "Heute geschlossen";
  return hoursToday;
}

export function googleMapsUrl(station: Station): string {
  const { latitude, longitude } = station.location;
  const address = encodeURIComponent(formatStationAddress(station));
  return `https://www.google.com/maps/search/?api=1&query=${address}`;
}

export const FUEL_LABELS: Record<string, string> = {
  DIE: "Diesel",
  SUP: "Super 95",
  GAS: "LPG",
};
