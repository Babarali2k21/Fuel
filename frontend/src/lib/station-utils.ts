export interface OpeningHoursEntry {
  day: string;
  label: string;
  from_time: string;
  to_time: string;
}

export function googleMapsUrl(
  latitude: number,
  longitude: number,
  address?: string,
): string {
  const query = address
    ? encodeURIComponent(address)
    : `${latitude},${longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function formatStationAddress(location: {
  address: string;
  postal_code: string;
  city: string;
}): string {
  return `${location.address}, ${location.postal_code} ${location.city}`;
}

export function localizeOpeningHoursToday(
  hoursToday: string,
  locale: string,
): string {
  if (!hoursToday) return "";

  const normalized = hoursToday.trim().toLowerCase();
  if (normalized === "24 hours") {
    return locale === "de" ? "24 Stunden geöffnet" : "Open 24 hours";
  }
  if (normalized === "closed today") {
    return locale === "de" ? "Heute geschlossen" : "Closed today";
  }
  return hoursToday;
}
