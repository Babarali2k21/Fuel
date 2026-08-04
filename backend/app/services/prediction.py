import math
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import PriceSnapshot
from app.schemas import PredictionResponse
from app.services.fuel_service import CachedFuelService


class PredictionService:
    def __init__(self) -> None:
        self.fuel_service = CachedFuelService()

    @staticmethod
    def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        radius = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
        )
        return radius * 2 * math.asin(math.sqrt(a))

    async def predict(self, db: Session, fuel_type: str, latitude: float, longitude: float) -> PredictionResponse:
        since = datetime.utcnow() - timedelta(days=14)
        all_snapshots = (
            db.query(PriceSnapshot)
            .filter(
                PriceSnapshot.fuel_type == fuel_type,
                PriceSnapshot.recorded_at >= since,
            )
            .order_by(PriceSnapshot.recorded_at.asc())
            .all()
        )

        snapshots = [
            item
            for item in all_snapshots
            if self._haversine_km(latitude, longitude, item.latitude, item.longitude) <= 60
        ]

        live_avg = await self._live_average(fuel_type, latitude, longitude)
        price_history = self._build_history(snapshots or all_snapshots)

        if len(snapshots) < 5:
            message = "Wir sammeln noch Preisdaten. Schau in ein paar Tagen wieder vorbei."
            if live_avg:
                message = "Aktueller Durchschnittspreis in deiner Nähe — Trenddaten werden noch aufgebaut."
            return PredictionResponse(
                fuel_type=fuel_type,
                trend="insufficient_data",
                recommendation="neutral",
                message=message,
                current_avg_price=live_avg,
                price_history=price_history,
            )

        recent = snapshots[-24:] if len(snapshots) >= 24 else snapshots[-5:]
        older = snapshots[: max(len(snapshots) // 2, 1)]

        recent_avg = sum(item.price for item in recent) / len(recent)
        older_avg = sum(item.price for item in older) / len(older)
        change_percent = ((recent_avg - older_avg) / older_avg) * 100 if older_avg else 0.0

        if change_percent > 1.5:
            trend = "rising"
            recommendation = "fuel_now"
            message = "Preise steigen tendenziell. Jetzt tanken könnte günstiger sein."
        elif change_percent < -1.5:
            trend = "falling"
            recommendation = "wait"
            message = "Preise sinken tendenziell. Warten könnte sich lohnen."
        else:
            trend = "stable"
            recommendation = "neutral"
            message = "Preise sind stabil. Tanken wenn du es brauchst."

        return PredictionResponse(
            fuel_type=fuel_type,
            trend=trend,
            recommendation=recommendation,
            message=message,
            current_avg_price=round(live_avg or recent_avg, 3),
            change_percent=round(change_percent, 2),
            price_history=price_history,
        )

    async def _live_average(self, fuel_type: str, latitude: float, longitude: float) -> float | None:
        try:
            stations = await self.fuel_service.get_stations(
                latitude, longitude, fuel_type, bypass_cache=True, ttl_seconds=120
            )
            priced = self.fuel_service.filter_with_prices(stations)
            nearby = [s for s in priced if s.price_per_liter and s.distance_km <= 25]
            if not nearby:
                return None
            return round(sum(s.price_per_liter for s in nearby) / len(nearby), 3)
        except Exception:
            return None

    @staticmethod
    def _build_history(snapshots: list[PriceSnapshot]) -> list[dict]:
        if not snapshots:
            return []

        by_day: dict[str, list[float]] = {}
        for item in snapshots[-168:]:
            day = item.recorded_at.date().isoformat()
            by_day.setdefault(day, []).append(item.price)

        return [
            {"date": day, "price": round(sum(prices) / len(prices), 3)}
            for day, prices in sorted(by_day.items())
        ][-14:]
