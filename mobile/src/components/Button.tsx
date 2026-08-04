import { Pressable, PressableProps, StyleSheet, Text, ViewStyle } from "react-native";

import { colors } from "../theme/colors";

type ButtonVariant = "primary" | "secondary" | "ghost" | "premium";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  label,
  variant = "primary",
  fullWidth = false,
  style,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        style as ViewStyle,
      ]}
    >
      <Text style={[styles.label, styles[`${variant}Label` as const]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  fullWidth: {
    width: "100%",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  premium: {
    backgroundColor: colors.premium,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryLabel: { color: "#FFFFFF" },
  secondaryLabel: { color: "#FFFFFF" },
  ghostLabel: { color: colors.text },
  premiumLabel: { color: "#FFFFFF" },
});
