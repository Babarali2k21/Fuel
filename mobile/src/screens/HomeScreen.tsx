import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomSheet } from "../components/BottomSheet";
import { FuelTypeSelector } from "../components/FuelTypeSelector";
import { StationItem } from "../components/StationItem";
import { StationMap } from "../components/StationMap";
import { useLocation } from "../hooks/useLocation";
import { useFuelTypeSelector, useStations } from "../hooks/useStations";
import { HomeStackParamList } from "../navigation/types";
import { getAveragePrice } from "../types/station";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type Props = NativeStackScreenProps<HomeStackParamList, "HomeMap">;

export function HomeScreen({ navigation }: Props) {
  const { location, loading: locationLoading, error: locationError, refresh: refreshLocation } =
    useLocation();
  const { stations, loading: stationsLoading, error: stationsError, refresh: refreshStations } =
    useStations(location.latitude, location.longitude, !locationLoading);
  const { fuelType, setFuelType } = useFuelTypeSelector();
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [refreshing, setRefreshing] = useState(false);

  const averagePrice = useMemo(() => getAveragePrice(stations), [stations]);
  const loading = locationLoading || stationsLoading;
  const error = locationError ?? stationsError;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshLocation();
    await refreshStations();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {loading && stations.length === 0 ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading stations…</Text>
        </View>
      ) : (
        <StationMap
          stations={stations}
          userLatitude={location.latitude}
          userLongitude={location.longitude}
          selectedId={selectedId}
          onSelectStation={(station) => {
            setSelectedId(station.id);
            navigation.navigate("StationDetail", { stationId: station.id });
          }}
        />
      )}

      <SafeAreaView style={styles.headerOverlay} edges={["top"]} pointerEvents="box-none">
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <Text style={styles.greeting}>Nearby fuel</Text>
            <Text style={styles.location} numberOfLines={1}>
              {location.label}
            </Text>
          </View>
          <Pressable style={styles.liveBadge} onPress={() => void onRefresh()}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>{refreshing ? "…" : "Live"}</Text>
          </Pressable>
        </View>
        <FuelTypeSelector value={fuelType} onChange={setFuelType} />
      </SafeAreaView>

      {error ? (
        <Pressable style={styles.errorBanner} onPress={() => void onRefresh()}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorAction}>Tap to retry</Text>
        </Pressable>
      ) : null}

      <BottomSheet
        title="Best prices near you"
        subtitle={
          loading
            ? "Fetching live E-Control prices…"
            : `${stations.length} stations · sorted by distance`
        }
        data={stations}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <StationItem
            station={item}
            averagePrice={averagePrice}
            onPress={() => {
              setSelectedId(item.id);
              navigation.navigate("StationDetail", { stationId: item.id });
            }}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  topBarLeft: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    ...typography.headline,
  },
  location: {
    ...typography.caption,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0EA",
    gap: 10,
  },
  loadingText: {
    ...typography.caption,
  },
  errorBanner: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 120,
    zIndex: 3,
    backgroundColor: "#FEF2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.priceExpensive,
    fontSize: 13,
    fontWeight: "600",
  },
  errorAction: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
});
