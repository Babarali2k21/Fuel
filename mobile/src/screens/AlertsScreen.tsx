import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "../store/useAppStore";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export function AlertsScreen() {
  const { alerts, removeAlert } = useAppStore();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Get notified when prices hit your target</Text>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No alerts yet</Text>
            <Text style={styles.emptyText}>
              Set a target price from any station detail screen.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <View style={styles.alertMeta}>
              <Text style={styles.alertName}>{item.stationName}</Text>
              <Text style={styles.alertFuel}>{item.fuelType.toUpperCase()}</Text>
            </View>
            <View style={styles.alertBottom}>
              <Text style={styles.alertTarget}>Target €{item.targetPrice.toFixed(3)}</Text>
              <Pressable onPress={() => removeAlert(item.id)} style={styles.removeBtn}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
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
    padding: 16,
    gap: 12,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  alertMeta: {
    gap: 4,
  },
  alertName: {
    ...typography.headline,
    fontSize: 16,
  },
  alertFuel: {
    ...typography.caption,
    color: colors.secondary,
  },
  alertBottom: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  alertTarget: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.primary,
  },
  removeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeText: {
    color: colors.priceExpensive,
    fontWeight: "600",
  },
  empty: {
    paddingTop: 80,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    ...typography.headline,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
