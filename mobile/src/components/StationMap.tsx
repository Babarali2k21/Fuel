import { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { Station } from "../lib/api";
import { getPriceTier, getAveragePrice, PriceTier } from "../types/station";

interface StationMapProps {
  stations: Station[];
  userLatitude: number;
  userLongitude: number;
  selectedId?: number;
  onSelectStation?: (station: Station) => void;
}

const pinColors: Record<PriceTier, string> = {
  cheap: "#22C55E",
  average: "#F59E0B",
  expensive: "#EF4444",
};

export function StationMap({
  stations,
  userLatitude,
  userLongitude,
  selectedId,
  onSelectStation,
}: StationMapProps) {
  const mapRef = useRef<MapView>(null);
  const average = useMemo(() => getAveragePrice(stations), [stations]);

  const region: Region = {
    latitude: userLatitude,
    longitude: userLongitude,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 500);
  }, [userLatitude, userLongitude]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={Platform.OS === "android"}
      userInterfaceStyle="light"
    >
      {stations.map((station) => {
        const price = station.price_per_liter;
        const tier = getPriceTier(price, average);
        const selected = station.id === selectedId;

        return (
          <Marker
            key={station.id}
            coordinate={{
              latitude: station.location.latitude,
              longitude: station.location.longitude,
            }}
            pinColor={selected ? "#2563EB" : pinColors[tier]}
            title={station.name}
            description={price != null ? `€${price.toFixed(3)}/L` : undefined}
            onPress={() => onSelectStation?.(station)}
            tracksViewChanges={false}
          />
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFill,
  },
});
