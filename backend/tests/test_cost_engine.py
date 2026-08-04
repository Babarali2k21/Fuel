from app.services.cost_engine import CostEngine
from app.services.fuel.base import FuelStation, StationLocation


def _station(station_id: int, name: str, distance: float, price: float) -> FuelStation:
    return FuelStation(
        id=station_id,
        name=name,
        location=StationLocation(
            address="Test",
            city="Wien",
            postal_code="1010",
            latitude=48.208,
            longitude=16.373,
        ),
        distance_km=distance,
        price_per_liter=price,
        fuel_type="DIE",
    )


def test_cost_engine_ranks_cheaper_station_despite_detour():
    engine = CostEngine()
    nearest = _station(1, "Nearest", 1.0, 2.0)
    cheaper = _station(2, "Cheaper", 3.0, 1.5)

    result = engine.calculate(
        [nearest, cheaper],
        consumption_l_per_100km=7.0,
        liters_needed=40.0,
    )

    assert result is not None
    assert result.recommendation.station.id == 2
    assert result.savings_vs_nearest > 0
    assert "spare" in result.recommendation.explanation.lower() or "weiter" in result.recommendation.explanation.lower()


def test_cost_engine_nearest_is_best_when_cheapest():
    engine = CostEngine()
    nearest = _station(1, "Nearest", 1.0, 1.5)
    farther = _station(2, "Farther", 5.0, 1.55)

    result = engine.calculate(
        [nearest, farther],
        consumption_l_per_100km=7.0,
        liters_needed=40.0,
    )

    assert result is not None
    assert result.recommendation.station.id == 1
