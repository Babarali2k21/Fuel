from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models import PriceSnapshot
from app.services.alerts import AlertService
from app.services.fuel_service import CachedFuelService

AUSTRIAN_LOCATIONS = [
    (48.2082, 16.3738, "Wien"),
    (47.0707, 15.4395, "Graz"),
    (48.3069, 14.2858, "Linz"),
    (47.8095, 13.0550, "Salzburg"),
    (47.2692, 11.4041, "Innsbruck"),
]

fuel_service = CachedFuelService()
alert_service = AlertService()
scheduler = AsyncIOScheduler()


async def snapshot_prices_job() -> None:
    db: Session = SessionLocal()
    try:
        for lat, lng, _city in AUSTRIAN_LOCATIONS:
            for fuel_type in ["DIE", "SUP", "GAS"]:
                stations = await fuel_service.get_stations(lat, lng, fuel_type, bypass_cache=True, ttl_seconds=3600)
                for station in fuel_service.filter_with_prices(stations):
                    db.add(
                        PriceSnapshot(
                            station_id=station.id,
                            station_name=station.name,
                            fuel_type=station.fuel_type,
                            price=station.price_per_liter or 0.0,
                            latitude=station.location.latitude,
                            longitude=station.location.longitude,
                            recorded_at=datetime.utcnow(),
                        )
                    )
        db.commit()
    finally:
        db.close()


async def check_alerts_job() -> None:
    db: Session = SessionLocal()
    try:
        await alert_service.check_alerts(db)
    finally:
        db.close()


def start_scheduler() -> None:
    if scheduler.running:
        return
    scheduler.add_job(snapshot_prices_job, "interval", hours=1, id="price_snapshots")
    scheduler.add_job(check_alerts_job, "interval", minutes=15, id="price_alerts")
    scheduler.start()
