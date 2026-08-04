from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.auth import is_premium_user
from app.core.config import settings
from app.core.database import get_db
from app.middleware.premium_gate import get_optional_user, require_auth, require_premium
from app.models import CarProfile, FuelLog, PriceAlert, SavingsLog, Subscription, User
from app.schemas import (
    CarProfileCreate,
    CarProfileResponse,
    CarProfileUpdate,
    CheckoutRequest,
    CheckoutResponse,
    DashboardResponse,
    FuelLogCreate,
    FuelLogResponse,
    PortalResponse,
    PredictionResponse,
    PriceAlertCreate,
    PriceAlertResponse,
    RecommendRequest,
    RecommendationResponse,
    ReverseGeocodeResponse,
    GeocodeSearchResponse,
    StationCostSchema,
    StationSchema,
    UserResponse,
)
from app.services.cost_engine import CostEngine
from app.services.fuel_service import CachedFuelService
from app.services.geocoding import GeocodingService
from app.services.google_routes import GoogleRoutesService
from app.services.prediction import PredictionService
from app.services.stripe_service import StripeService

router = APIRouter()
fuel_service = CachedFuelService()
cost_engine = CostEngine()
geocoding_service = GeocodingService()
google_routes = GoogleRoutesService()
prediction_service = PredictionService()
stripe_service = StripeService()


def _station_schema(station) -> StationSchema:
    return StationSchema(
        id=station.id,
        name=station.name,
        location={
            "address": station.location.address,
            "city": station.location.city,
            "postal_code": station.location.postal_code,
            "latitude": station.location.latitude,
            "longitude": station.location.longitude,
        },
        distance_km=station.distance_km,
        price_per_liter=station.price_per_liter,
        fuel_type=station.fuel_type,
        open=station.open,
        opening_hours=station.opening_hours or [],
        opening_hours_today=station.opening_hours_today,
        has_toilet=station.has_toilet,
    )


def _cost_schema(result) -> StationCostSchema:
    return StationCostSchema(
        station=_station_schema(result.station),
        fuel_cost=result.fuel_cost,
        detour_cost=result.detour_cost,
        total_cost=result.total_cost,
        extra_distance_km=result.extra_distance_km,
        explanation=result.explanation,
    )


@router.get("/health")
async def health():
    return {"status": "ok", "service": "spritcheck-api"}


@router.get("/v1/geocode/reverse", response_model=ReverseGeocodeResponse)
async def reverse_geocode(latitude: float, longitude: float, locale: str = "de"):
    try:
        result = await geocoding_service.reverse_geocode(latitude, longitude, locale)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not resolve address") from exc

    display_name = result.get("display_name") or result.get("city") or f"{latitude:.4f}, {longitude:.4f}"
    return ReverseGeocodeResponse(
        city=result.get("city"),
        address=result.get("address"),
        postal_code=result.get("postal_code"),
        state=result.get("state"),
        display_name=display_name,
    )


@router.get("/v1/geocode/search", response_model=GeocodeSearchResponse)
async def geocode_search(q: str, locale: str = "de"):
    try:
        result = await geocoding_service.geocode_address(q, locale)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not geocode address") from exc

    return GeocodeSearchResponse(
        latitude=result["latitude"],
        longitude=result["longitude"],
        city=result.get("city"),
        address=result.get("address"),
        postal_code=result.get("postal_code"),
        state=result.get("state"),
        display_name=result["display_name"],
    )


@router.get("/v1/geocode/suggest", response_model=list[GeocodeSearchResponse])
async def geocode_suggest(q: str, locale: str = "de", limit: int = 6):
    try:
        results = await geocoding_service.geocode_suggestions(q, locale, limit=min(limit, 8))
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Could not fetch address suggestions") from exc

    return [
        GeocodeSearchResponse(
            latitude=result["latitude"],
            longitude=result["longitude"],
            city=result.get("city"),
            address=result.get("address"),
            postal_code=result.get("postal_code"),
            state=result.get("state"),
            display_name=result["display_name"],
        )
        for result in results
    ]


@router.get("/v1/stations")
async def get_stations(
    latitude: float,
    longitude: float,
    fuel_type: str = "DIE",
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    is_premium = is_premium_user(db, user)
    stations = await fuel_service.get_stations(
        latitude,
        longitude,
        fuel_type,
        bypass_cache=is_premium,
    )
    return {
        "stations": [_station_schema(station) for station in stations],
        "tier": "premium" if is_premium else "free",
    }


@router.post("/v1/recommend", response_model=RecommendationResponse)
async def recommend(
    payload: RecommendRequest,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    is_premium = is_premium_user(db, user)
    liters_needed = payload.liters_needed or max(payload.tank_capacity_l - payload.current_tank_l, 1.0)

    stations = await fuel_service.get_stations(
        payload.latitude,
        payload.longitude,
        payload.fuel_type,
        bypass_cache=is_premium,
    )
    priced_stations = fuel_service.filter_with_prices(stations)
    if not priced_stations:
        raise HTTPException(status_code=404, detail="Keine Tankstellen mit aktuellen Preisen gefunden.")

    driving_distances = None
    route_mode = False
    direct_route_km = None
    route_distance_km = None

    if is_premium:
        destinations = [
            (station.id, station.location.latitude, station.location.longitude)
            for station in priced_stations
        ]
        if payload.destination_lat and payload.destination_lng:
            direct_route_km = await google_routes.get_direct_route_distance(
                payload.latitude,
                payload.longitude,
                payload.destination_lat,
                payload.destination_lng,
            )
            driving_distances = await google_routes.get_route_stations_distances(
                payload.latitude,
                payload.longitude,
                payload.destination_lat,
                payload.destination_lng,
                destinations,
            )
            route_mode = bool(driving_distances and direct_route_km)
        else:
            driving_distances = await google_routes.get_driving_distances(
                payload.latitude,
                payload.longitude,
                destinations,
            )

    result = cost_engine.calculate(
        priced_stations,
        consumption_l_per_100km=payload.consumption_l_per_100km,
        liters_needed=liters_needed,
        tier="premium" if is_premium else "free",
        driving_distances=driving_distances,
        route_mode=route_mode,
        direct_route_km=direct_route_km,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Keine Empfehlung möglich.")

    if route_mode and driving_distances:
        route_distance_km = driving_distances.get(result.recommendation.station.id)

    if user:
        db.add(
            SavingsLog(
                user_id=user.id,
                recommended_station_id=result.recommendation.station.id,
                recommended_station_name=result.recommendation.station.name,
                estimated_savings_eur=result.savings_vs_nearest,
            )
        )
        db.commit()

    return RecommendationResponse(
        recommendation=_cost_schema(result.recommendation),
        alternatives=[_cost_schema(item) for item in result.alternatives],
        nearest_station=_cost_schema(result.nearest_station),
        savings_vs_nearest=result.savings_vs_nearest,
        liters_needed=result.liters_needed,
        tier=result.tier,
        cached=not is_premium,
        route_optimized=route_mode,
        direct_route_km=round(direct_route_km, 2) if direct_route_km else None,
        route_distance_km=round(route_distance_km, 2) if route_distance_km else None,
    )


@router.get("/v1/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    return UserResponse(
        id=user.id,
        email=user.email,
        is_premium=is_premium_user(db, user),
        subscription_status=subscription.status if subscription else None,
        plan=subscription.plan if subscription else None,
        current_period_end=subscription.current_period_end if subscription else None,
        trial_end=subscription.trial_end if subscription else None,
        cancel_at_period_end=subscription.cancel_at_period_end if subscription else False,
        has_used_trial=user.has_used_trial,
        trial_days=settings.stripe_trial_days,
    )


@router.get("/v1/predict/{fuel_type}", response_model=PredictionResponse)
async def predict(
    fuel_type: str,
    latitude: float,
    longitude: float,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
):
    if not settings.bypass_premium:
        if not user or not is_premium_user(db, user):
            raise HTTPException(status_code=403, detail="Premium subscription required")
    return await prediction_service.predict(db, fuel_type.upper(), latitude, longitude)


@router.get("/v1/cars", response_model=list[CarProfileResponse])
async def list_cars(user: User = Depends(require_premium), db: Session = Depends(get_db)):
    return db.query(CarProfile).filter(CarProfile.user_id == user.id).all()


@router.post("/v1/cars", response_model=CarProfileResponse)
async def create_car(
    payload: CarProfileCreate,
    user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    if payload.is_default:
        db.query(CarProfile).filter(CarProfile.user_id == user.id).update({"is_default": False})
    car = CarProfile(user_id=user.id, **payload.model_dump())
    db.add(car)
    db.commit()
    db.refresh(car)
    return car


@router.patch("/v1/cars/{car_id}", response_model=CarProfileResponse)
async def update_car(
    car_id: int,
    payload: CarProfileUpdate,
    user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    car = db.query(CarProfile).filter(CarProfile.id == car_id, CarProfile.user_id == user.id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car profile not found")

    updates = payload.model_dump(exclude_unset=True)
    if updates.get("is_default"):
        db.query(CarProfile).filter(CarProfile.user_id == user.id).update({"is_default": False})

    for key, value in updates.items():
        setattr(car, key, value)

    db.commit()
    db.refresh(car)
    return car


@router.delete("/v1/cars/{car_id}")
async def delete_car(car_id: int, user: User = Depends(require_premium), db: Session = Depends(get_db)):
    car = db.query(CarProfile).filter(CarProfile.id == car_id, CarProfile.user_id == user.id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car profile not found")
    db.delete(car)
    db.commit()
    return {"ok": True}


def _fuel_log_response(log: FuelLog) -> FuelLogResponse:
    return FuelLogResponse(
        id=log.id,
        car_id=log.car_id,
        car_name=log.car.name,
        car_registration=log.car.registration,
        refueled_at=log.refueled_at,
        odometer_km=log.odometer_km,
        liters=log.liters,
        fuel_type=log.fuel_type,
        total_cost_eur=log.total_cost_eur,
        price_per_liter=log.price_per_liter,
        notes=log.notes,
        created_at=log.created_at,
    )


@router.get("/v1/fuel-logs", response_model=list[FuelLogResponse])
async def list_fuel_logs(user: User = Depends(require_auth), db: Session = Depends(get_db)):
    logs = (
        db.query(FuelLog)
        .options(joinedload(FuelLog.car))
        .filter(FuelLog.user_id == user.id)
        .order_by(FuelLog.refueled_at.desc(), FuelLog.id.desc())
        .all()
    )
    return [_fuel_log_response(log) for log in logs]


@router.post("/v1/fuel-logs", response_model=FuelLogResponse)
async def create_fuel_log(
    payload: FuelLogCreate,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    car = db.query(CarProfile).filter(CarProfile.id == payload.car_id, CarProfile.user_id == user.id).first()
    if not car:
        raise HTTPException(status_code=404, detail="Car not found")

    log = FuelLog(
        user_id=user.id,
        car_id=payload.car_id,
        refueled_at=payload.refueled_at,
        odometer_km=payload.odometer_km,
        liters=payload.liters,
        fuel_type=payload.fuel_type,
        total_cost_eur=payload.total_cost_eur,
        price_per_liter=round(payload.total_cost_eur / payload.liters, 3),
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    log = (
        db.query(FuelLog)
        .options(joinedload(FuelLog.car))
        .filter(FuelLog.id == log.id)
        .first()
    )
    return _fuel_log_response(log)


@router.delete("/v1/fuel-logs/{log_id}")
async def delete_fuel_log(log_id: int, user: User = Depends(require_auth), db: Session = Depends(get_db)):
    log = db.query(FuelLog).filter(FuelLog.id == log_id, FuelLog.user_id == user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Fuel log not found")
    db.delete(log)
    db.commit()
    return {"ok": True}


@router.get("/v1/alerts", response_model=list[PriceAlertResponse])
async def list_alerts(user: User = Depends(require_premium), db: Session = Depends(get_db)):
    return db.query(PriceAlert).filter(PriceAlert.user_id == user.id).all()


@router.post("/v1/alerts", response_model=PriceAlertResponse)
async def create_alert(
    payload: PriceAlertCreate,
    user: User = Depends(require_premium),
    db: Session = Depends(get_db),
):
    alert = PriceAlert(user_id=user.id, **payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/v1/alerts/{alert_id}")
async def delete_alert(alert_id: int, user: User = Depends(require_premium), db: Session = Depends(get_db)):
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id, PriceAlert.user_id == user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return {"ok": True}


@router.get("/v1/dashboard", response_model=DashboardResponse)
async def dashboard(user: User = Depends(require_premium), db: Session = Depends(get_db)):
    logs = (
        db.query(SavingsLog)
        .filter(SavingsLog.user_id == user.id)
        .order_by(SavingsLog.created_at.desc())
        .all()
    )
    total = sum(log.estimated_savings_eur for log in logs)
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly = sum(log.estimated_savings_eur for log in logs if log.created_at >= month_start)
    best = max(logs, key=lambda log: log.estimated_savings_eur) if logs else None

    monthly_breakdown: dict[str, float] = {}
    for log in logs:
        key = log.created_at.strftime("%Y-%m")
        monthly_breakdown[key] = monthly_breakdown.get(key, 0.0) + log.estimated_savings_eur

    recent_decisions = [
        {
            "station_name": log.recommended_station_name,
            "savings_eur": log.estimated_savings_eur,
            "date": log.created_at.isoformat(),
        }
        for log in logs[:10]
    ]

    return DashboardResponse(
        total_savings_eur=round(total, 2),
        monthly_savings_eur=round(monthly, 2),
        decisions_count=len(logs),
        best_decision={
            "station_name": best.recommended_station_name,
            "savings_eur": best.estimated_savings_eur,
            "date": best.created_at.isoformat(),
        }
        if best
        else None,
        recent_decisions=recent_decisions,
        monthly_breakdown=[
            {"month": month, "savings_eur": round(amount, 2)}
            for month, amount in sorted(monthly_breakdown.items())
        ][-6:],
    )


@router.post("/v1/stripe/checkout", response_model=CheckoutResponse)
async def stripe_checkout(
    payload: CheckoutRequest,
    user: User = Depends(require_auth),
    db: Session = Depends(get_db),
):
    try:
        url = stripe_service.create_checkout_session(db, user, payload.plan)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return CheckoutResponse(checkout_url=url)


@router.get("/v1/stripe/portal", response_model=PortalResponse)
async def stripe_portal(user: User = Depends(require_auth)):
    try:
        url = stripe_service.create_portal_session(user)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return PortalResponse(portal_url=url)


@router.post("/v1/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature", "")
    try:
        stripe_service.handle_webhook(db, payload, signature)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"received": True}
