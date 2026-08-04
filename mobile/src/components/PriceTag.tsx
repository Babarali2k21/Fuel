import { StyleSheet, Text, View } from "react-native";

import { PriceTier } from "../types/station";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

interface PriceTagProps {
  price: number;
  tier: PriceTier;
  size?: "sm" | "lg";
}

const tierColors: Record<PriceTier, string> = {
  cheap: colors.priceCheap,
  average: colors.priceAverage,
  expensive: colors.priceExpensive,
};

export function PriceTag({ price, tier, size = "lg" }: PriceTagProps) {
  return (
    <View style={[styles.wrap, { backgroundColor: `${tierColors[tier]}18` }]}>
      <Text
        style={[
          size === "lg" ? typography.priceLarge : styles.small,
          { color: tierColors[tier] },
        ]}
      >
        €{price.toFixed(3)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  small: {
    fontSize: 18,
    fontWeight: "700",
  },
});
