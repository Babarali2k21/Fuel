from app.services.fuel.base import FuelDataProvider, FuelStation, StationLocation


class SpritCheckProvider(FuelDataProvider):
    """Placeholder provider for future api.spritcheck.at integration."""

    async def get_nearby_stations(
        self,
        latitude: float,
        longitude: float,
        fuel_type: str,
    ) -> list[FuelStation]:
        raise NotImplementedError(
            "SpritCheck API provider is not configured. Use EControlProvider instead."
        )
