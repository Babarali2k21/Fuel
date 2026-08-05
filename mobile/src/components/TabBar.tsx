import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "../theme/colors";

const labels: Record<string, string> = {
  HomeTab: "Home",
  Insights: "Insights",
  Favorites: "Saved",
  Alerts: "Alerts",
  ProfileTab: "Profile",
};

const icons: Record<string, string> = {
  HomeTab: "⌂",
  Insights: "◔",
  Favorites: "★",
  Alerts: "◉",
  ProfileTab: "☺",
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={() => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={({ pressed }) => [
              styles.tab,
              isFocused && styles.tabActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.icon, isFocused && styles.iconActive]}>
              {icons[route.name] ?? "•"}
            </Text>
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {labels[route.name] ?? route.name}
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
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingHorizontal: 6,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 14,
  },
  tabActive: {
    backgroundColor: `${colors.primary}10`,
  },
  tabPressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 18,
    color: colors.textMuted,
    marginBottom: 2,
  },
  iconActive: {
    color: colors.primary,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
  },
});
