import { ReactNode } from "react";
import { Pressable, PressableProps, StyleSheet, View, ViewStyle } from "react-native";

import { colors } from "../theme/colors";

interface CardProps extends PressableProps {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, style, ...props }: CardProps) {
  const content = (
    <View style={[styles.card, padded && styles.padded]}>{children}</View>
  );

  if (props.onPress) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [pressed && styles.pressed, style as ViewStyle]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={style as ViewStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 4,
  },
  padded: {
    padding: 16,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.995 }],
  },
});
