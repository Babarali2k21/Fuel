from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class StationLocation:
    address: str
    city: str
    postal_code: str
    latitude: float
    longitude: float


@dataclass
class FuelStation:
    id: int
    name: str
    location: StationLocation
    distance_km: float
    price_per_liter: float | None
    fuel_type: str
    open: bool = True
    opening_hours: list[dict] | None = None
    opening_hours_today: str = ""
    has_toilet: bool | None = None


class FuelDataProvider(ABC):
    @abstractmethod
    async def get_nearby_stations(
        self,
        latitude: float,
        longitude: float,
        fuel_type: str,
    ) -> list[FuelStation]:
        pass
