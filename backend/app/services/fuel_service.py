from app.core.config import settings
from app.core.redis import cache_get, cache_set
from app.services.fuel.base import FuelDataProvider, FuelStation
from app.services.fuel.econtrol_provider import EControlProvider


class CachedFuelService:
    def __init__(self, provider: FuelDataProvider | None = None) -> None:
        self.provider = provider or EControlProvider()

    def _cache_key(self, latitude: float, longitude: float, fuel_type: str) -> str:
        lat = round(latitude, 3)
        lng = round(longitude, 3)
        return f"stations:{lat}:{lng}:{fuel_type.upper()}"

    async def get_stations(
        self,
        latitude: float,
        longitude: float,
        fuel_type: str,
        *,
        bypass_cache: bool = False,
        ttl_seconds: int | None = None,
    ) -> list[FuelStation]:
        cache_key = self._cache_key(latitude, longitude, fuel_type)
        ttl = ttl_seconds if ttl_seconds is not None else settings.free_cache_ttl_seconds

        if not bypass_cache:
            cached = cache_get(cache_key)
            if cached is not None:
                return [self._deserialize_station(item) for item in cached]

        stations = await self.provider.get_nearby_stations(latitude, longitude, fuel_type)
        cache_set(cache_key, [self._serialize_station(station) for station in stations], ttl)
        return stations

    @staticmethod
    def _serialize_station(station: FuelStation) -> dict:
        return {
            "id": station.id,
            "name": station.name,
            "location": {
                "address": station.location.address,
                "city": station.location.city,
                "postal_code": station.location.postal_code,
                "latitude": station.location.latitude,
                "longitude": station.location.longitude,
            },
            "distance_km": station.distance_km,
            "price_per_liter": station.price_per_liter,
            "fuel_type": station.fuel_type,
            "open": station.open,
            "opening_hours": station.opening_hours or [],
            "opening_hours_today": station.opening_hours_today,
            "has_toilet": station.has_toilet,
        }

    @staticmethod
    def _deserialize_station(data: dict) -> FuelStation:
        from app.services.fuel.base import StationLocation

        return FuelStation(
            id=data["id"],
            name=data["name"],
            location=StationLocation(
                address=data["location"]["address"],
                city=data["location"]["city"],
                postal_code=data["location"]["postal_code"],
                latitude=data["location"]["latitude"],
                longitude=data["location"]["longitude"],
            ),
            distance_km=data["distance_km"],
            price_per_liter=data["price_per_liter"],
            fuel_type=data["fuel_type"],
            open=data.get("open", True),
            opening_hours=data.get("opening_hours") or None,
            opening_hours_today=data.get("opening_hours_today", ""),
            has_toilet=data.get("has_toilet"),
        )

    @staticmethod
    def filter_with_prices(stations: list[FuelStation]) -> list[FuelStation]:
        return [station for station in stations if station.price_per_liter is not None and station.open]
