from datetime import datetime, timedelta

import resend
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import PriceAlert, User
from app.services.fuel_service import CachedFuelService


class AlertService:
    def __init__(self) -> None:
        self.fuel_service = CachedFuelService()
        if settings.resend_api_key:
            resend.api_key = settings.resend_api_key

    async def check_alerts(self, db: Session) -> int:
        alerts = db.query(PriceAlert).filter(PriceAlert.active.is_(True)).all()
        triggered = 0

        for alert in alerts:
            if alert.last_triggered_at:
                cooldown = datetime.utcnow() - alert.last_triggered_at
                if cooldown < timedelta(hours=24):
                    continue

            stations = await self.fuel_service.get_stations(
                alert.latitude,
                alert.longitude,
                alert.fuel_type,
                bypass_cache=True,
                ttl_seconds=60,
            )
            priced = self.fuel_service.filter_with_prices(stations)
            matches = [
                station
                for station in priced
                if station.price_per_liter is not None
                and station.price_per_liter <= alert.threshold_eur
                and station.distance_km <= alert.radius_km
            ]

            if matches:
                user = db.query(User).filter(User.id == alert.user_id).first()
                if user:
                    await self._send_alert_email(user.email, alert, matches[0])
                    alert.last_triggered_at = datetime.utcnow()
                    triggered += 1

        db.commit()
        return triggered

    async def _send_alert_email(self, email: str, alert: PriceAlert, station) -> None:
        if not settings.resend_api_key:
            return

        resend.Emails.send(
            {
                "from": "SpritCheck <alerts@spritcheck.at>",
                "to": [email],
                "subject": f"Preisalarm: {alert.fuel_type} unter €{alert.threshold_eur:.2f}",
                "html": (
                    f"<p>Gute Nachricht! <strong>{station.name}</strong> bietet "
                    f"{alert.fuel_type} für <strong>€{station.price_per_liter:.3f}/L</strong> "
                    f"in deiner Nähe ({station.distance_km:.1f} km).</p>"
                ),
            }
        )
