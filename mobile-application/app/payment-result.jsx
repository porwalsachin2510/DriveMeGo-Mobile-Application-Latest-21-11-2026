import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Screen } from "../src/components/Screen";
import { Button, Card, Loading } from "../src/components/ui";
import { parsePaymentResult } from "../src/utils/paymentReturn";
import { colors, type } from "../src/theme";

const DESTINATIONS = {
  wallet: { path: "/(tabs)/wallet", label: "Go to Wallet" },
  booking: { path: "/(tabs)/trips", label: "View My Bookings" },
  renewal: { path: "/subscriptions", label: "View Subscription" },
};

const COPY = {
  success: {
    icon: "checkmark-circle",
    color: colors.success,
    title: "Payment successful",
    message: "Your payment was received. It may take a few seconds for your booking or balance to update.",
  },
  cancel: {
    icon: "close-circle",
    color: colors.danger || "#DC2626",
    title: "Payment cancelled",
    message: "No money was taken. Your booking is saved and you can complete payment later.",
  },
  unknown: {
    icon: "time",
    color: colors.navy,
    title: "Payment processing",
    message: "We are confirming your payment with the bank. Check your bookings shortly.",
  },
};

// Deep-link target for drivemego:///payment-result. When a checkout screen is
// still open (Android delivers the link as an intent), we just return to it so
// it shows its own result; on a cold start we show the result here.
export default function PaymentResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const result = useMemo(() => parsePaymentResult(params), [params]);
  const canReturn = router.canGoBack();

  useEffect(() => {
    ["bookings", "wallet", "notifications", "routes", "route-seats", "subscriptions"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
    if (canReturn) router.back();
  }, [canReturn, qc, router]);

  if (canReturn) return <Loading label="Returning to the app..." />;

  const copy = COPY[result.status] || COPY.unknown;
  const dest = DESTINATIONS[result.flow] || { path: "/", label: "Go to Home" };

  return (
    <Screen footer={<Button title={dest.label} onPress={() => router.replace(dest.path)} />}>
      <View style={styles.wrap}>
        <Card style={styles.card}>
          <Ionicons name={copy.icon} size={64} color={copy.color} />
          <Text style={[type.h1, styles.center]}>{copy.title}</Text>
          <Text style={[type.body, styles.center, { color: colors.muted }]}>{copy.message}</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", paddingTop: 60 },
  card: { alignItems: "center", gap: 12, padding: 24 },
  center: { textAlign: "center" },
});
