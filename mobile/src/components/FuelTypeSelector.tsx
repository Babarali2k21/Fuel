import { Pressable, StyleSheet, Text, View } from "react-native";

import { FuelType } from "../lib/api";
import { colors } from "../theme/colors";

const OPTIONS: { value: FuelType; label: string }[] = [
  { value: "DIE", label: "Diesel" },
  { value: "SUP", label: "Super" },
  { value: "GAS", label: "LPG" },
];

interface FuelTypeSelectorProps {
  value: FuelType;
  onChange: (value: FuelType) => void;
}

export function FuelTypeSelector({ value, onChange }: FuelTypeSelectorProps) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: `${colors.primary}12`,
    borderColor: `${colors.primary}40`,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
  },
});
