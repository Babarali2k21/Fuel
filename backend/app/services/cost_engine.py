from dataclasses import dataclass

from app.services.fuel.base import FuelStation


@dataclass
class StationCostResult:
    station: FuelStation
    fuel_cost: float
    detour_cost: float
    total_cost: float
    extra_distance_km: float
    explanation: str


@dataclass
class RecommendationResult:
    recommendation: StationCostResult
    alternatives: list[StationCostResult]
    nearest_station: StationCostResult
    savings_vs_nearest: float
    liters_needed: float
    tier: str


class CostEngine:
    def calculate(
        self,
        stations: list[FuelStation],
        *,
        consumption_l_per_100km: float,
        liters_needed: float,
        tier: str = "free",
        driving_distances: dict[int, float] | None = None,
        route_mode: bool = False,
        direct_route_km: float | None = None,
    ) -> RecommendationResult | None:
        priced_stations = [s for s in stations if s.price_per_liter is not None]
        if not priced_stations:
            return None

        if route_mode and driving_distances and direct_route_km:
            eligible = [s for s in priced_stations if s.id in driving_distances]
            if not eligible:
                eligible = priced_stations
            nearest = min(eligible, key=lambda s: driving_distances.get(s.id, s.distance_km))
            nearest_distance = driving_distances.get(nearest.id, nearest.distance_km)
            baseline_km = direct_route_km
        elif driving_distances:
            nearest = min(
                priced_stations,
                key=lambda s: driving_distances.get(s.id, s.distance_km),
            )
            nearest_distance = driving_distances.get(nearest.id, nearest.distance_km)
            baseline_km = nearest_distance
        else:
            nearest = min(priced_stations, key=lambda s: s.distance_km)
            nearest_distance = nearest.distance_km
            baseline_km = nearest_distance

        nearest_result = self._compute_station_cost(
            nearest,
            consumption_l_per_100km,
            liters_needed,
            nearest_distance,
            nearest.price_per_liter or 0.0,
            baseline_km=baseline_km,
            tier=tier,
            route_mode=route_mode,
        )

        results: list[StationCostResult] = []
        for station in priced_stations:
            distance = driving_distances.get(station.id, station.distance_km) if driving_distances else station.distance_km
            if route_mode and driving_distances and station.id not in driving_distances:
                continue
            results.append(
                self._compute_station_cost(
                    station,
                    consumption_l_per_100km,
                    liters_needed,
                    distance,
                    station.price_per_liter or 0.0,
                    baseline_km=baseline_km,
                    tier=tier,
                    route_mode=route_mode,
                )
            )

        results.sort(key=lambda item: item.total_cost)
        best = results[0]
        savings = round(nearest_result.total_cost - best.total_cost, 2)

        if savings > 0 and best.station.id != nearest.id:
            best.explanation = self._build_explanation(best, nearest, savings, tier, route_mode=route_mode)
        elif best.station.id == nearest.id:
            if route_mode:
                best.explanation = "Die optimale Tankstelle entlang deiner Route ist auch die günstigste Option."
            else:
                best.explanation = "Die nächstgelegene Tankstelle ist auch die günstigste Option."
        else:
            best.explanation = "Alle Optionen haben ähnliche Gesamtkosten."

        return RecommendationResult(
            recommendation=best,
            alternatives=results[1:5],
            nearest_station=nearest_result,
            savings_vs_nearest=max(savings, 0.0),
            liters_needed=liters_needed,
            tier=tier,
        )

    def _compute_station_cost(
        self,
        station: FuelStation,
        consumption: float,
        liters_needed: float,
        distance_km: float,
        price_per_liter: float,
        baseline_km: float | None = None,
        tier: str = "free",
        route_mode: bool = False,
    ) -> StationCostResult:
        fuel_cost = round(price_per_liter * liters_needed, 2)
        reference = baseline_km if baseline_km is not None else distance_km
        extra_distance = max(distance_km - reference, 0.0)
        detour_liters = (extra_distance / 100.0) * consumption
        detour_cost = round(detour_liters * price_per_liter, 2)
        total_cost = round(fuel_cost + detour_cost, 2)

        explanation = ""
        if tier == "premium" and extra_distance > 0:
            if route_mode:
                explanation = f"Routen-Optimierung: {extra_distance:.1f} km Umweg entlang deiner Route."
            else:
                explanation = f"Premium-Routing: {extra_distance:.1f} km Umweg berücksichtigt."

        return StationCostResult(
            station=station,
            fuel_cost=fuel_cost,
            detour_cost=detour_cost,
            total_cost=total_cost,
            extra_distance_km=round(extra_distance, 2),
            explanation=explanation,
        )

    @staticmethod
    def _build_explanation(
        best: StationCostResult,
        nearest: FuelStation,
        savings: float,
        tier: str,
        *,
        route_mode: bool = False,
    ) -> str:
        extra = best.extra_distance_km
        if route_mode:
            base = (
                f"Optimaler Tankstopp entlang deiner Route: {extra:.1f} km Umweg "
                f"und €{savings:.2f} Ersparnis gegenüber dem nächsten Stopp."
            )
        else:
            base = f"Fahre {extra:.1f} km weiter und spare €{savings:.2f} gegenüber der nächsten Tankstelle."
        if tier == "premium":
            return f"{base} Verkehr und Route wurden berücksichtigt."
        return base
