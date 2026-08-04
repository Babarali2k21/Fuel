from datetime import datetime
from zoneinfo import ZoneInfo

VIENNA_TZ = ZoneInfo("Europe/Vienna")

WEEKDAY_TO_CODE = {0: "MO", 1: "DI", 2: "MI", 3: "DO", 4: "FR", 5: "SA", 6: "SO"}

TOILET_KEYWORDS = ("wc", "toilette", "toilet", "restroom", "sanitär", "sanitaer")


def is_24h(from_time: str, to_time: str) -> bool:
    return from_time == "00:00" and to_time == "24:00"


def is_closed_day(from_time: str, to_time: str) -> bool:
    return from_time == "00:00" and to_time == "00:00"


def normalize_opening_hours(raw_hours: list[dict]) -> list[dict]:
    normalized: list[dict] = []
    for entry in raw_hours:
        day = entry.get("day", "")
        if day not in WEEKDAY_TO_CODE.values():
            continue
        normalized.append(
            {
                "day": day,
                "label": entry.get("label", day),
                "from_time": entry.get("from", "00:00"),
                "to_time": entry.get("to", "00:00"),
            }
        )
    return normalized


def format_hours_range(from_time: str, to_time: str) -> str:
    if is_24h(from_time, to_time):
        return "24h"
    if is_closed_day(from_time, to_time):
        return "closed"
    return f"{from_time}–{to_time}"


def summarize_today_hours(
    opening_hours: list[dict],
    *,
    now: datetime | None = None,
) -> str:
    if not opening_hours:
        return ""

    current = now or datetime.now(VIENNA_TZ)
    day_code = WEEKDAY_TO_CODE[current.weekday()]
    today = next((entry for entry in opening_hours if entry["day"] == day_code), None)
    if not today:
        return ""

    formatted = format_hours_range(today["from_time"], today["to_time"])
    if formatted == "24h":
        return "24 hours"
    if formatted == "closed":
        return "Closed today"
    return formatted


def infer_has_toilet(item: dict) -> bool | None:
    offers = (item.get("otherServiceOffers") or "").lower()
    if any(keyword in offers for keyword in TOILET_KEYWORDS):
        return True

    offer_info = item.get("offerInformation") or {}
    if offer_info.get("service"):
        return True

    raw_hours = item.get("openingHours") or []
    weekday_hours = [
        entry
        for entry in raw_hours
        if entry.get("day") in WEEKDAY_TO_CODE.values()
    ]
    if weekday_hours and all(
        is_24h(entry.get("from", ""), entry.get("to", "")) for entry in weekday_hours
    ):
        return True

    if offer_info.get("unattended"):
        return False

    return None
