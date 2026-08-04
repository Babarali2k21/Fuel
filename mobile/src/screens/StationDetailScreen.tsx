import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { PriceTag } from "../components/PriceTag";
import { fetchStationFuelPrices, FuelType, Station } from "../lib/api";
import { HomeStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import {
  FUEL_LABELS,
  formatStationAddress,
  getAveragePrice,
  getPriceTier,
  googleMapsUrl,
  localizeOpeningHoursToday,
} from "../types/station";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useLocation } from "../hooks/useLocation";

type Props = NativeStackScreenProps<HomeStackParamList, "StationDetail">;

export function StationDetailScreen({ route, navigation }: Props) {
  const cached = useAppStore((state) => state.getStation(route.params.stationId));
  const { isFavorite, toggleFavorite, addAlert, fuelType } = useAppStore();
  const { location } = useLocation();
  const [station, setStation] = useState<Station | undefined>(cached);
  const [prices, setPrices] = useState<Partial<Record<FuelType, number | null>>>({});
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const fuelPrices = await fetchStationFuelPrices(
          location.latitude,
          location.longitude,
          route.params.stationId,
        );

        if (cancelled) return;

        setPrices(fuelPrices);

        if (cached) {
          setStation({
            ...cached,
            price_per_liter: fuelPrices[fuelType] ?? cached.price_per_liter,
          });
        } else if (fuelPrices.DIE != null) {
          const { api } = await import("../lib/api");
          const response = await api.getStations(location.latitude, location.longitude, "DIE");
          const found = response.stations.find((item) => item.id === route.params.stationId);
          if (found) setStation(found);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [cached, fuelType, location.latitude, location.longitude, route.params.stationId]);

  const average = useMemo(() => {
    const values = Object.values(prices).filter((price): price is number => price != null);
    if (values.length === 0) return station?.price_per_liter ?? 0;
    return values.reduce((sum, price) => sum + price, 0) / values.length;
  }, [prices, station?.price_per_liter]);

  if (loading && !station) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!station) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={typography.body}>Station not found.</Text>
      </SafeAreaView>
    );
  }

  const favorite = isFavorite(station.id);
  const priceRows: FuelType[] = ["DIE", "SUP", "GAS"];

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{station.name}</Text>
        <Pressable onPress={() => void Linking.openURL(googleMapsUrl(station))}>
          <Text style={styles.addressLink}>{formatStationAddress(station)}</Text>
        </Pressable>

        {station.opening_hours_today ? (
          <Text style={styles.metaLine}>
            Hours · {localizeOpeningHoursToday(station.opening_hours_today)}
          </Text>
        ) : null}
        {station.has_toilet === true && (
          <Text style={styles.metaLine}>Toilet available</Text>
        )}
        {station.has_toilet === false && (
          <Text style={styles.metaMuted}>No toilet</Text>
        )}

        <Card style={styles.card}>
          {priceRows.map((type) => {
            const price = prices[type];
            if (price == null) return null;
            return (
              <View key={type} style={styles.fuelRow}>
                <Text style={styles.fuelLabel}>{FUEL_LABELS[type]}</Text>
                <PriceTag price={price} tier={getPriceTier(price, average)} size="sm" />
              </View>
            );
          })}
          {Object.values(prices).every((price) => price == null) && (
            <Text style={styles.metaMuted}>No live prices available.</Text>
          )}
        </Card>

        <View style={styles.actions}>
          <Button
            label="Navigate"
            onPress={() => void Linking.openURL(googleMapsUrl(station))}
            fullWidth
          />
          <Button
            label={favorite ? "Saved" : "Save station"}
            variant="ghost"
            onPress={() => toggleFavorite(station.id)}
            fullWidth
          />
          <Button
            label="Set price alert"
            variant="secondary"
            onPress={() => {
              const current = prices[fuelType] ?? station.price_per_liter;
              if (current == null) return;
              addAlert({
                stationId: station.id,
                stationName: station.name,
                targetPrice: Number((current - 0.05).toFixed(3)),
                fuelType,
              });
              navigation.getParent()?.navigate("Alerts");
            }}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    ...typography.title,
  },
  addressLink: {
    ...typography.body,
    color: colors.secondary,
    textDecorationLine: "underline",
  },
  metaLine: {
    ...typography.caption,
    color: colors.primary,
  },
  metaMuted: {
    ...typography.caption,
  },
  card: {
    marginTop: 4,
  },
  fuelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  fuelLabel: {
    ...typography.headline,
    fontSize: 16,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
