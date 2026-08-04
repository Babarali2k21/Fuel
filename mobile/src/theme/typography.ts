import { TextStyle } from "react-native";

import { colors } from "./colors";

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  } satisfies TextStyle,
  headline: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  } satisfies TextStyle,
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.text,
    lineHeight: 22,
  } satisfies TextStyle,
  caption: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textMuted,
  } satisfies TextStyle,
  priceLarge: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  } satisfies TextStyle,
} as const;
