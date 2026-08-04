import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ProfileStackParamList } from "../navigation/types";
import { useAppStore } from "../store/useAppStore";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type Props = NativeStackScreenProps<ProfileStackParamList, "Premium">;

const features = [
  "Unlimited price alerts",
  "AI fuel timing predictions",
  "Route optimization",
  "Premium support",
];

export function PremiumScreen({ navigation }: Props) {
  const upgradeToPremium = useAppStore((state) => state.upgradeToPremium);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.badge}>SpritCheck Premium</Text>
        <Text style={styles.title}>Fuel smarter, save more</Text>
        <Text style={styles.subtitle}>
          Everything you need to cut fuel costs with confidence.
        </Text>

        <Card style={styles.pricingCard}>
          <Text style={styles.price}>€4.99</Text>
          <Text style={styles.period}>per month · cancel anytime</Text>
        </Card>

        <Card>
          {features.map((feature, index) => (
            <View
              key={feature}
              style={[styles.featureRow, index < features.length - 1 && styles.featureBorder]}
            >
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </Card>

        <Button
          label="Upgrade now"
          variant="premium"
          fullWidth
          onPress={() => {
            upgradeToPremium();
            navigation.goBack();
          }}
        />
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
  badge: {
    alignSelf: "flex-start",
    backgroundColor: `${colors.premium}15`,
    color: colors.premium,
    fontWeight: "700",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: "hidden",
  },
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  pricingCard: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}20`,
  },
  price: {
    fontSize: 44,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: -1,
  },
  period: {
    ...typography.caption,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  featureBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  check: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 16,
  },
  featureText: {
    ...typography.body,
    fontSize: 15,
  },
});
