import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ConfirmationScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{ reference: string; total: string; type: string }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Success Icon */}
      <Animated.View
        style={[
          styles.successCircle,
          { backgroundColor: colors.success + "15", transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={[styles.innerCircle, { backgroundColor: colors.success }]}>
          <IconSymbol name="checkmark.circle.fill" size={48} color="#FFFFFF" />
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Booking Confirmed!</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>
          Your {params.type === "flight" ? "flight" : "hotel"} has been successfully booked.
          A confirmation email has been sent to you.
        </Text>

        {/* Reference Card */}
        <View style={[styles.refCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>Booking Reference</Text>
            <View style={[styles.refBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.refBadgeText}>{params.reference}</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>Total Paid</Text>
            <Text style={[styles.refValue, { color: colors.primary }]}>${params.total}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.success + "15" }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>✓ Confirmed</Text>
            </View>
          </View>
        </View>

        {/* QR Code placeholder */}
        <View style={[styles.qrContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.qrPlaceholder, { backgroundColor: colors.background }]}>
            <IconSymbol name="qrcode" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.qrLabel, { color: colors.muted }]}>
            Show this QR code at check-in
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.replace("/(tabs)/bookings" as any)}
          >
            <IconSymbol name="doc.text.fill" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>View My Bookings</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryBtn,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.replace("/(tabs)" as any)}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Back to Home</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  innerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "100%",
    alignItems: "center",
    gap: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  refCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  refRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  refLabel: {
    fontSize: 14,
  },
  refBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  refBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  refValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  divider: {
    height: 1,
  },
  qrContainer: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 12,
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  qrLabel: {
    fontSize: 13,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: 12,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
