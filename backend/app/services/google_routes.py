import asyncio

import httpx

from app.core.config import settings


class GoogleRoutesService:
    async def _compute_route_km(
        self,
        client: httpx.AsyncClient,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
        intermediates: list[dict] | None = None,
    ) -> float | None:
        payload: dict = {
            "origin": {"location": {"latLng": {"latitude": origin_lat, "longitude": origin_lng}}},
            "destination": {
                "location": {"latLng": {"latitude": destination_lat, "longitude": destination_lng}}
            },
            "travelMode": "DRIVE",
            "routingPreference": "TRAFFIC_AWARE",
        }
        if intermediates:
            payload["intermediates"] = intermediates

        response = await client.post(
            "https://routes.googleapis.com/directions/v2:computeRoutes",
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": settings.google_maps_api_key,
                "X-Goog-FieldMask": "routes.distanceMeters",
            },
            json=payload,
        )
        if response.status_code != 200:
            return None

        routes = response.json().get("routes", [])
        if not routes:
            return None
        return routes[0]["distanceMeters"] / 1000.0

    async def get_direct_route_distance(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
    ) -> float | None:
        if not settings.google_maps_api_key:
            return None

        async with httpx.AsyncClient(timeout=20.0) as client:
            return await self._compute_route_km(
                client, origin_lat, origin_lng, destination_lat, destination_lng
            )

    async def get_driving_distances(
        self,
        origin_lat: float,
        origin_lng: float,
        destinations: list[tuple[int, float, float]],
        *,
        max_stations: int = 15,
    ) -> dict[int, float]:
        if not settings.google_maps_api_key or not destinations:
            return {}

        batch = destinations[:max_stations]
        async with httpx.AsyncClient(timeout=20.0) as client:
            tasks = [
                self._compute_route_km(client, origin_lat, origin_lng, lat, lng)
                for _, lat, lng in batch
            ]
            results = await asyncio.gather(*tasks)

        distances: dict[int, float] = {}
        for (station_id, _, _), distance in zip(batch, results, strict=False):
            if distance is not None:
                distances[station_id] = distance
        return distances

    async def get_route_stations_distances(
        self,
        origin_lat: float,
        origin_lng: float,
        destination_lat: float,
        destination_lng: float,
        stations: list[tuple[int, float, float]],
        *,
        max_stations: int = 15,
        max_detour_ratio: float = 1.35,
    ) -> dict[int, float]:
        """Total driving distance origin → station → destination for multi-stop optimization."""
        if not settings.google_maps_api_key:
            return {}

        direct_km = await self.get_direct_route_distance(
            origin_lat, origin_lng, destination_lat, destination_lng
        )
        if direct_km is None:
            return {}

        async with httpx.AsyncClient(timeout=25.0) as client:
            tasks = [
                self._compute_route_km(
                    client,
                    origin_lat,
                    origin_lng,
                    destination_lat,
                    destination_lng,
                    intermediates=[{"location": {"latLng": {"latitude": lat, "longitude": lng}}}],
                )
                for _, lat, lng in stations[: max_stations * 2]
            ]
            results = await asyncio.gather(*tasks)

        distances: dict[int, float] = {}
        for (station_id, _, _), route_km in zip(stations[: max_stations * 2], results, strict=False):
            if route_km is None:
                continue
            if route_km <= direct_km * max_detour_ratio:
                distances[station_id] = route_km
        return distances
