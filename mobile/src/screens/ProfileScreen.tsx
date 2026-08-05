import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { ProfileStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type Props = NativeStackScreenProps<ProfileStackParamList, "ProfileMain">;

const settings = [
  "Vehicle profiles",
  "Fuel logbook",
  "Notifications",
  "Language",
  "Privacy",
];

export function ProfileScreen({ navigation }: Props) {
  const user = useAppStore((state) => state.user);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.slice(0, 1)}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          {user.isPremium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          ) : (
            <Pressable
              style={styles.upgradeChip}
              onPress={() => navigation.navigate("Premium")}
            >
              <Text style={styles.upgradeChipText}>Upgrade</Text>
            </Pressable>
          )}
        </View>

        <Card>
          {settings.map((item, index) => (
            <Pressable
              key={item}
              style={[styles.settingRow, index < settings.length - 1 && styles.settingBorder]}
            >
              <Text style={styles.settingText}>{item}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
        </Card>

        {!user.isPremium && (
          <Pressable onPress={() => navigation.navigate("Premium")}>
            <Card style={styles.promoCard}>
              <Text style={styles.promoTitle}>Unlock SpritCheck Premium</Text>
              <Text style={styles.promoText}>
                Alerts, AI predictions, and route optimization in one plan.
              </Text>
            </Card>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: `${colors.secondary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.secondary,
  },
  name: {
    ...typography.headline,
  },
  email: {
    ...typography.caption,
    marginTop: 2,
  },
  premiumBadge: {
    marginLeft: "auto",
    backgroundColor: `${colors.premium}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  premiumText: {
    color: colors.premium,
    fontWeight: "700",
    fontSize: 12,
  },
  upgradeChip: {
    marginLeft: "auto",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  upgradeChipText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 12,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  settingText: {
    ...typography.body,
    fontSize: 15,
  },
  chevron: {
    fontSize: 22,
    color: colors.textMuted,
  },
  promoCard: {
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}25`,
  },
  promoTitle: {
    ...typography.headline,
    color: colors.primary,
  },
  promoText: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: 6,
    fontSize: 14,
  },
});
