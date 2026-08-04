import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { FlatList, Linking, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/Button";
import { StationItem } from "../components/StationItem";
import { TabParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { googleMapsUrl } from "../types/station";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export function FavoritesScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();
  const favorites = useAppStore((state) => state.favorites);
  const stationsCache = useAppStore((state) => state.stationsCache);
  const stations = favorites
    .map((id) => stationsCache[id])
    .filter((station): station is NonNullable<typeof station> => station != null);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>Quick access to your saved stations</Text>
      </View>

      {stations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No saved stations yet</Text>
          <Text style={styles.emptyText}>
            Save a station from its detail page to see it here.
          </Text>
          <Button label="Find stations" onPress={() => navigation.navigate("Home")} />
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <StationItem
              station={item}
              compact
              onPress={() => void Linking.openURL(googleMapsUrl(item))}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  emptyTitle: {
    ...typography.headline,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 8,
  },
});
