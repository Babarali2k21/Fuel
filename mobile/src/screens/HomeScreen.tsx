import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

type Props = NativeStackScreenProps<HomeStackParamList, "Home">;

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
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.flex}>
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

          <View style={styles.mapWrap}>
            {loading && stations.length === 0 ? (
              <View style={styles.center}>
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
          </View>

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
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  mapWrap: {
    flex: 1,
    minHeight: 220,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8F0EA",
    gap: 10,
  },
  loadingText: {
    ...typography.caption,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderTopWidth: 1,
    borderTopColor: "#FECACA",
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
