from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class StationLocationSchema(BaseModel):
    address: str
    city: str
    postal_code: str
    latitude: float
    longitude: float


class OpeningHoursEntrySchema(BaseModel):
    day: str
    label: str
    from_time: str
    to_time: str


class StationSchema(BaseModel):
    id: int
    name: str
    location: StationLocationSchema
    distance_km: float
    price_per_liter: float | None
    fuel_type: str
    open: bool = True
    opening_hours: list[OpeningHoursEntrySchema] = []
    opening_hours_today: str = ""
    has_toilet: bool | None = None


class RecommendRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    fuel_type: Literal["DIE", "SUP", "GAS"] = "DIE"
    consumption_l_per_100km: float = Field(7.0, gt=0, le=30)
    tank_capacity_l: float = Field(50.0, gt=0, le=200)
    current_tank_l: float = Field(10.0, ge=0)
    liters_needed: float | None = Field(None, gt=0)
    destination_lat: float | None = None
    destination_lng: float | None = None


class StationCostSchema(BaseModel):
    station: StationSchema
    fuel_cost: float
    detour_cost: float
    total_cost: float
    extra_distance_km: float
    explanation: str


class RecommendationResponse(BaseModel):
    recommendation: StationCostSchema
    alternatives: list[StationCostSchema]
    nearest_station: StationCostSchema
    savings_vs_nearest: float
    liters_needed: float
    tier: str
    cached: bool = False
    route_optimized: bool = False
    direct_route_km: float | None = None
    route_distance_km: float | None = None


class CarProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Vehicle nickname")
    registration: str | None = Field(None, max_length=20, description="License plate")
    fuel_type: Literal["DIE", "SUP", "GAS"]
    consumption_l_per_100km: float = Field(..., gt=0, le=30)
    tank_capacity_l: float = Field(50.0, gt=0, le=200)
    is_default: bool = False


class CarProfileUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    registration: str | None = Field(None, max_length=20)
    fuel_type: Literal["DIE", "SUP", "GAS"] | None = None
    consumption_l_per_100km: float | None = Field(None, gt=0, le=30)
    tank_capacity_l: float | None = Field(None, gt=0, le=200)
    is_default: bool | None = None


class CarProfileResponse(CarProfileCreate):
    id: int

    model_config = {"from_attributes": True}


class FuelLogCreate(BaseModel):
    car_id: int
    refueled_at: date
    odometer_km: float = Field(..., ge=0)
    liters: float = Field(..., gt=0, le=200)
    fuel_type: Literal["DIE", "SUP", "GAS"]
    total_cost_eur: float = Field(..., gt=0, le=1000)
    notes: str | None = Field(None, max_length=500)


class FuelLogResponse(BaseModel):
    id: int
    car_id: int
    car_name: str
    car_registration: str | None
    refueled_at: date
    odometer_km: float
    liters: float
    fuel_type: str
    total_cost_eur: float
    price_per_liter: float | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class PriceAlertCreate(BaseModel):
    fuel_type: Literal["DIE", "SUP", "GAS"]
    threshold_eur: float = Field(..., gt=0, le=5)
    radius_km: float = Field(10.0, gt=0, le=50)
    latitude: float
    longitude: float


class PriceAlertResponse(PriceAlertCreate):
    id: int
    active: bool

    model_config = {"from_attributes": True}


class PredictionResponse(BaseModel):
    fuel_type: str
    trend: Literal["rising", "falling", "stable", "insufficient_data"]
    recommendation: Literal["fuel_now", "wait", "neutral"]
    message: str
    current_avg_price: float | None = None
    change_percent: float | None = None
    price_history: list[dict] = []


class SavingsDecisionSchema(BaseModel):
    station_name: str
    savings_eur: float
    date: str


class DashboardResponse(BaseModel):
    total_savings_eur: float
    monthly_savings_eur: float
    decisions_count: int
    best_decision: dict | None
    recent_decisions: list[SavingsDecisionSchema] = []
    monthly_breakdown: list[dict] = []


class CheckoutRequest(BaseModel):
    plan: Literal["monthly", "yearly"]


class CheckoutResponse(BaseModel):
    checkout_url: str


class PortalResponse(BaseModel):
    portal_url: str


class UserResponse(BaseModel):
    id: int
    email: str
    is_premium: bool
    subscription_status: str | None = None
    plan: str | None = None
    current_period_end: datetime | None = None
    trial_end: datetime | None = None
    cancel_at_period_end: bool = False
    has_used_trial: bool = False
    trial_days: int = 7


class ReverseGeocodeResponse(BaseModel):
    city: str | None = None
    address: str | None = None
    postal_code: str | None = None
    state: str | None = None
    display_name: str


class GeocodeSearchResponse(BaseModel):
    latitude: float
    longitude: float
    city: str | None = None
    address: str | None = None
    postal_code: str | None = None
    state: str | None = None
    display_name: str
