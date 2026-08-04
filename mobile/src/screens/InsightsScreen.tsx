import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "../components/Card";
import { api, PredictionData } from "../lib/api";
import { useLocation } from "../hooks/useLocation";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export function InsightsScreen() {
  const { location } = useLocation();
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await api.getPrediction("DIE", location.latitude, location.longitude);
        if (!cancelled) setPrediction(data);
      } catch {
        if (!cancelled) setPrediction(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [location.latitude, location.longitude]);

  const history = prediction?.price_history ?? [];
  const max = Math.max(...history.map((point) => point.price), 0.01);
  const min = Math.min(...history.map((point) => point.price), max);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>AI-powered fuel savings for your area</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <Card>
              <Text style={styles.cardLabel}>Recommendation</Text>
              <Text style={styles.cardValue}>
                {prediction?.recommendation === "fuel_now"
                  ? "Fuel now"
                  : prediction?.recommendation === "wait"
                    ? "Wait if you can"
                    : "Neutral"}
              </Text>
              <Text style={styles.cardHint}>{prediction?.message ?? "No prediction available yet."}</Text>
            </Card>

            <Card>
              <Text style={styles.cardLabel}>Price trend</Text>
              <Text style={styles.cardValue}>
                {prediction?.trend === "rising"
                  ? "Rising"
                  : prediction?.trend === "falling"
                    ? "Falling"
                    : prediction?.trend === "stable"
                      ? "Stable"
                      : "Insufficient data"}
              </Text>
              {prediction?.change_percent != null && (
                <Text style={styles.cardHint}>
                  {prediction.change_percent > 0 ? "+" : ""}
                  {prediction.change_percent.toFixed(1)}% vs. recent average
                </Text>
              )}
            </Card>

            {history.length > 0 && (
              <Card padded={false}>
                <View style={styles.chartHeader}>
                  <Text style={styles.cardLabel}>Diesel history</Text>
                  <Text style={styles.chartValue}>
                    {prediction?.current_avg_price != null
                      ? `€${prediction.current_avg_price.toFixed(3)} avg`
                      : "Recent prices"}
                  </Text>
                </View>
                <View style={styles.chart}>
                  {history.slice(-7).map((point, index) => {
                    const height = 24 + ((point.price - min) / (max - min || 1)) * 72;
                    return (
                      <View key={`${point.date}-${index}`} style={styles.barWrap}>
                        <View style={[styles.bar, { height }]} />
                        <Text style={styles.barLabel}>{index + 1}</Text>
                      </View>
                    );
                  })}
                </View>
              </Card>
            )}
          </>
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
  title: {
    ...typography.title,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: 4,
  },
  loader: {
    marginTop: 40,
  },
  cardLabel: {
    ...typography.caption,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cardValue: {
    ...typography.headline,
    fontSize: 24,
    marginTop: 8,
    color: colors.primary,
  },
  cardHint: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  chartHeader: {
    padding: 16,
    paddingBottom: 0,
  },
  chartValue: {
    ...typography.headline,
    marginTop: 4,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 8,
  },
  barWrap: {
    flex: 1,
    alignItems: "center",
  },
  bar: {
    width: "100%",
    maxWidth: 28,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    opacity: 0.85,
  },
  barLabel: {
    ...typography.caption,
    marginTop: 6,
    fontSize: 11,
  },
});
