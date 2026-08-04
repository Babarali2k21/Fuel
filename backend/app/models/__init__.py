from datetime import date, datetime
from enum import Enum

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    CANCELED = "canceled"
    PAST_DUE = "past_due"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"


class SubscriptionPlan(str, Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    clerk_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    has_used_trial: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    subscription: Mapped["Subscription | None"] = relationship(back_populates="user", uselist=False)
    car_profiles: Mapped[list["CarProfile"]] = relationship(back_populates="user")
    fuel_logs: Mapped[list["FuelLog"]] = relationship(back_populates="user")
    savings_logs: Mapped[list["SavingsLog"]] = relationship(back_populates="user")
    price_alerts: Mapped[list["PriceAlert"]] = relationship(back_populates="user")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default=SubscriptionStatus.INCOMPLETE.value)
    plan: Mapped[str | None] = mapped_column(String(50), nullable=True)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    trial_end: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    cancel_at_period_end: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="subscription")


class CarProfile(Base):
    __tablename__ = "car_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(100))
    registration: Mapped[str | None] = mapped_column(String(20), nullable=True)
    fuel_type: Mapped[str] = mapped_column(String(10))
    consumption_l_per_100km: Mapped[float] = mapped_column(Float)
    tank_capacity_l: Mapped[float] = mapped_column(Float, default=50.0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="car_profiles")
    fuel_logs: Mapped[list["FuelLog"]] = relationship(back_populates="car")


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    car_id: Mapped[int] = mapped_column(ForeignKey("car_profiles.id", ondelete="CASCADE"))
    refueled_at: Mapped[date] = mapped_column(Date)
    odometer_km: Mapped[float] = mapped_column(Float)
    liters: Mapped[float] = mapped_column(Float)
    fuel_type: Mapped[str] = mapped_column(String(10))
    total_cost_eur: Mapped[float] = mapped_column(Float)
    price_per_liter: Mapped[float | None] = mapped_column(Float, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="fuel_logs")
    car: Mapped["CarProfile"] = relationship(back_populates="fuel_logs")


class PriceSnapshot(Base):
    __tablename__ = "price_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    station_id: Mapped[int] = mapped_column(Integer, index=True)
    station_name: Mapped[str] = mapped_column(String(255))
    fuel_type: Mapped[str] = mapped_column(String(10), index=True)
    price: Mapped[float] = mapped_column(Float)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)


class SavingsLog(Base):
    __tablename__ = "savings_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    recommended_station_id: Mapped[int] = mapped_column(Integer)
    recommended_station_name: Mapped[str] = mapped_column(String(255))
    estimated_savings_eur: Mapped[float] = mapped_column(Float)
    actual_choice: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="savings_logs")


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    fuel_type: Mapped[str] = mapped_column(String(10))
    threshold_eur: Mapped[float] = mapped_column(Float)
    radius_km: Mapped[float] = mapped_column(Float, default=10.0)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="price_alerts")
