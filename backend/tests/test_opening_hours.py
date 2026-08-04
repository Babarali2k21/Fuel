from datetime import datetime
from zoneinfo import ZoneInfo

from app.services.fuel.opening_hours import (
    infer_has_toilet,
    is_24h,
    is_closed_day,
    normalize_opening_hours,
    summarize_today_hours,
)


def test_normalize_opening_hours_skips_holidays():
    raw = [
        {"day": "MO", "label": "Montag", "from": "08:00", "to": "20:00"},
        {"day": "FE", "label": "Feiertag", "from": "00:00", "to": "00:00"},
    ]
    result = normalize_opening_hours(raw)
    assert len(result) == 1
    assert result[0]["day"] == "MO"
    assert result[0]["from_time"] == "08:00"


def test_summarize_today_hours_24h():
    hours = normalize_opening_hours(
        [{"day": "MO", "label": "Montag", "from": "00:00", "to": "24:00"}]
    )
    monday = datetime(2026, 8, 3, 12, 0, tzinfo=ZoneInfo("Europe/Vienna"))
    assert summarize_today_hours(hours, now=monday) == "24 hours"


def test_summarize_today_hours_closed():
    hours = normalize_opening_hours(
        [{"day": "SO", "label": "Sonntag", "from": "00:00", "to": "00:00"}]
    )
    sunday = datetime(2026, 8, 2, 12, 0, tzinfo=ZoneInfo("Europe/Vienna"))
    assert summarize_today_hours(hours, now=sunday) == "Closed today"


def test_infer_has_toilet_from_service_station():
    item = {
        "offerInformation": {"service": True, "unattended": False},
        "otherServiceOffers": "",
        "openingHours": [],
    }
    assert infer_has_toilet(item) is True


def test_infer_has_toilet_from_keywords():
    item = {
        "offerInformation": {"service": False, "unattended": False},
        "otherServiceOffers": "Shop, WC, Kaffee",
        "openingHours": [],
    }
    assert infer_has_toilet(item) is True


def test_infer_has_toilet_unattended():
    item = {
        "offerInformation": {"service": False, "unattended": True},
        "otherServiceOffers": "",
        "openingHours": [{"day": "MO", "from": "06:00", "to": "22:00"}],
    }
    assert infer_has_toilet(item) is False


def test_is_24h_and_closed_day():
    assert is_24h("00:00", "24:00") is True
    assert is_closed_day("00:00", "00:00") is True
