import { useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";

import { Station } from "../lib/api";
import { getPriceTier, getAveragePrice } from "../types/station";
import { colors } from "../theme/colors";
import { PriceTier } from "../types/station";

interface StationMapProps {
  stations: Station[];
  userLatitude: number;
  userLongitude: number;
  selectedId?: number;
  onSelectStation?: (station: Station) => void;
}

const tierColors: Record<PriceTier, string> = {
  cheap: colors.priceCheap,
  average: colors.priceAverage,
  expensive: colors.priceExpensive,
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

  const initialRegion = {
    latitude: userLatitude,
    longitude: userLongitude,
    latitudeDelta: 0.06,
    longitudeDelta: 0.06,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
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
              onPress={() => onSelectStation?.(station)}
            >
              <View style={[styles.marker, selected && styles.markerSelected]}>
                <View style={[styles.markerDot, { backgroundColor: tierColors[tier] }]} />
                {price != null && (
                  <Text style={[styles.markerLabel, selected && styles.markerLabelSelected]}>
                    €{price.toFixed(2)}
                  </Text>
                )}
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    alignItems: "center",
  },
  markerSelected: {
    transform: [{ scale: 1.08 }],
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  markerLabel: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "700",
    color: colors.text,
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  markerLabelSelected: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
