import { Pressable, StyleSheet, Text, View } from "react-native";

import { Station } from "../lib/api";
import {
  extractBrand,
  formatStationAddress,
  getAveragePrice,
  getPriceTier,
  localizeOpeningHoursToday,
} from "../types/station";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { PriceTag } from "./PriceTag";

interface StationItemProps {
  station: Station;
  onPress?: () => void;
  compact?: boolean;
  averagePrice?: number;
}

export function StationItem({
  station,
  onPress,
  compact = false,
  averagePrice,
}: StationItemProps) {
  const average = averagePrice ?? getAveragePrice([station]);
  const tier = getPriceTier(station.price_per_liter, average);
  const brand = extractBrand(station.name);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <View style={styles.brandBadge}>
          <Text style={styles.brandText}>{brand.slice(0, 1)}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name} numberOfLines={1}>
            {station.name}
          </Text>
          <Text style={styles.distance}>{station.distance_km.toFixed(1)} km away</Text>
          {!compact && (
            <>
              <Text style={styles.address} numberOfLines={1}>
                {formatStationAddress(station)}
              </Text>
              {station.opening_hours_today ? (
                <Text style={styles.hours}>
                  {localizeOpeningHoursToday(station.opening_hours_today)}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>
      {station.price_per_liter != null && (
        <PriceTag price={station.price_per_liter} tier={tier} size={compact ? "sm" : "lg"} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.secondary}12`,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: {
    ...typography.headline,
    color: colors.secondary,
    fontSize: 18,
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    ...typography.headline,
    fontSize: 16,
  },
  distance: {
    ...typography.caption,
    marginTop: 2,
  },
  address: {
    ...typography.caption,
    marginTop: 2,
    color: colors.textMuted,
  },
  hours: {
    ...typography.caption,
    marginTop: 2,
    color: colors.primary,
  },
});
