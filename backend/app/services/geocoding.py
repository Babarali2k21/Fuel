import httpx

from app.core.redis import cache_get, cache_set


class GeocodingService:
    REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
    SEARCH_URL = "https://nominatim.openstreetmap.org/search"
    USER_AGENT = "SpritCheck/1.0 (fuel recommendation app; contact@spritcheck.at)"

    async def reverse_geocode(
        self,
        latitude: float,
        longitude: float,
        locale: str = "de",
    ) -> dict[str, str | None]:
        cache_key = f"geocode:{round(latitude, 4)}:{round(longitude, 4)}:{locale}"
        cached = cache_get(cache_key)
        if cached is not None:
            return cached

        language = "de" if locale.startswith("de") else "en"
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "jsonv2",
            "addressdetails": 1,
            "accept-language": language,
            "zoom": 18,
        }
        headers = {"User-Agent": self.USER_AGENT}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.REVERSE_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

        address = data.get("address", {})
        city = self._pick_city(address)
        street = self._pick_street(address)
        postal_code = address.get("postcode")
        state = address.get("state")

        display_parts = [part for part in [street, self._format_city_line(postal_code, city)] if part]
        display_name = ", ".join(display_parts) if display_parts else data.get("display_name", city)

        result = {
            "city": city,
            "address": street,
            "postal_code": postal_code,
            "state": state,
            "display_name": display_name,
        }
        cache_set(cache_key, result, ttl_seconds=86400)
        return result

    async def geocode_address(self, query: str, locale: str = "de") -> dict[str, str | float | None]:
        normalized = " ".join(query.strip().split())
        if len(normalized) < 3:
            raise ValueError("Address query too short")

        cache_key = f"geocode:search:{normalized.lower()}:{locale}"
        cached = cache_get(cache_key)
        if cached is not None:
            return cached

        language = "de" if locale.startswith("de") else "en"
        params = {
            "q": normalized,
            "format": "jsonv2",
            "limit": 1,
            "addressdetails": 1,
            "countrycodes": "at",
            "accept-language": language,
        }
        headers = {"User-Agent": self.USER_AGENT}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.SEARCH_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

        if not data:
            raise ValueError("Address not found")

        result = self._parse_search_item(data[0], normalized)
        cache_set(cache_key, result, ttl_seconds=86400)
        return result

    async def geocode_suggestions(
        self,
        query: str,
        locale: str = "de",
        limit: int = 6,
    ) -> list[dict[str, str | float | None]]:
        normalized = " ".join(query.strip().split())
        if len(normalized) < 2:
            return []

        cache_key = f"geocode:suggest:{normalized.lower()}:{locale}:{limit}"
        cached = cache_get(cache_key)
        if cached is not None:
            return cached

        language = "de" if locale.startswith("de") else "en"
        params = {
            "q": normalized,
            "format": "jsonv2",
            "limit": limit,
            "addressdetails": 1,
            "countrycodes": "at",
            "accept-language": language,
        }
        headers = {"User-Agent": self.USER_AGENT}

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(self.SEARCH_URL, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()

        results = [self._parse_search_item(item, normalized) for item in data]
        cache_set(cache_key, results, ttl_seconds=3600)
        return results

    def _parse_search_item(self, item: dict, fallback: str) -> dict[str, str | float | None]:
        address = item.get("address", {})
        city = self._pick_city(address)
        street = self._pick_street(address)
        postal_code = address.get("postcode")
        state = address.get("state")

        display_parts = [part for part in [street, self._format_city_line(postal_code, city)] if part]
        display_name = ", ".join(display_parts) if display_parts else item.get("display_name", fallback)

        return {
            "latitude": float(item["lat"]),
            "longitude": float(item["lon"]),
            "city": city,
            "address": street,
            "postal_code": postal_code,
            "state": state,
            "display_name": display_name,
        }

    @staticmethod
    def _pick_city(address: dict) -> str | None:
        for key in ("city", "town", "village", "municipality", "county", "hamlet"):
            value = address.get(key)
            if value:
                return str(value)
        return None

    @staticmethod
    def _pick_street(address: dict) -> str | None:
        road = address.get("road") or address.get("pedestrian") or address.get("footway")
        house_number = address.get("house_number")
        if road and house_number:
            return f"{road} {house_number}"
        if road:
            return str(road)
        return None

    @staticmethod
    def _format_city_line(postal_code: str | None, city: str | None) -> str | None:
        if postal_code and city:
            return f"{postal_code} {city}"
        return city or postal_code
