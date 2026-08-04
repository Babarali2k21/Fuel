import httpx

from app.core.config import settings
from app.services.fuel.base import FuelDataProvider, FuelStation, StationLocation
from app.services.fuel.opening_hours import infer_has_toilet, normalize_opening_hours, summarize_today_hours

FUEL_TYPE_MAP = {
    "DIE": "DIE",
    "SUP": "SUP",
    "GAS": "GAS",
    "diesel": "DIE",
    "super": "SUP",
    "gas": "GAS",
}


class EControlProvider(FuelDataProvider):
    def __init__(self) -> None:
        self.base_url = settings.econtrol_base_url

    async def get_nearby_stations(
        self,
        latitude: float,
        longitude: float,
        fuel_type: str,
    ) -> list[FuelStation]:
        mapped_fuel = FUEL_TYPE_MAP.get(fuel_type, fuel_type.upper())
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "fuelType": mapped_fuel,
            "includeClosed": "false",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{self.base_url}/search/gas-stations/by-address",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

        stations: list[FuelStation] = []
        for item in data:
            price = self._extract_price(item.get("prices", []), mapped_fuel)
            location = item.get("location", {})
            opening_hours = normalize_opening_hours(item.get("openingHours") or [])
            stations.append(
                FuelStation(
                    id=item["id"],
                    name=item["name"],
                    location=StationLocation(
                        address=location.get("address", ""),
                        city=location.get("city", ""),
                        postal_code=location.get("postalCode", ""),
                        latitude=location.get("latitude", 0.0),
                        longitude=location.get("longitude", 0.0),
                    ),
                    distance_km=float(item.get("distance", 0.0)),
                    price_per_liter=price,
                    fuel_type=mapped_fuel,
                    open=bool(item.get("open", True)),
                    opening_hours=opening_hours or None,
                    opening_hours_today=summarize_today_hours(opening_hours),
                    has_toilet=infer_has_toilet(item),
                )
            )
        return stations

    @staticmethod
    def _extract_price(prices: list[dict], fuel_type: str) -> float | None:
        for price_entry in prices:
            if price_entry.get("fuelType") == fuel_type and price_entry.get("amount") is not None:
                return float(price_entry["amount"])
        return None
