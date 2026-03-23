import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  Share,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { generateFlightTicket, generateHotelVoucher, COMPANY_INFO } from "@/lib/ticket-generator";
import { formatAmadeusPriceMRU } from "@/lib/currency";
import * as Notifications from "expo-notifications";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function scheduleBookingNotification(type: string, reference: string) {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: type === "flight" ? "✈️ Flight Booking Confirmed!" : "🏨 Hotel Booking Confirmed!",
        body: `Your booking is confirmed. Reference: ${reference}. Check your tickets in My Bookings.`,
        data: { reference, type },
        sound: true,
      },
      trigger: null, // immediate
    });
  } catch (e) {
    // Notifications not available on web
  }
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    reference: string;
    total: string;
    type: string;
    passengerName?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    nationality?: string;
    email?: string;
    phone?: string;
    airline?: string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    originCode?: string;
    destinationCode?: string;
    departureTime?: string;
    arrivalTime?: string;
    duration?: string;
    cabinClass?: string;
    passengers?: string;
    children?: string;
    tripType?: string;
    returnDate?: string;
    hotelName?: string;
    hotelCity?: string;
    hotelCountry?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    roomType?: string;
    currency?: string;
  }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  const isFlight = params.type === "flight";
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const formattedTotal = params.total
    ? formatAmadeusPriceMRU(params.total, params.currency ?? "EUR")
    : "—";

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

    // Send local notification
    scheduleBookingNotification(params.type ?? "flight", params.reference ?? "RV000");
  }, []);

  const getTicketText = (): string => {
    const adults = parseInt(params.passengers ?? params.guests ?? "1", 10);
    const children = parseInt(params.children ?? "0", 10);

    if (isFlight) {
      return generateFlightTicket({
        reference: params.reference ?? "RV000",
        passengerName: params.passengerName ?? "Passenger",
        dateOfBirth: params.dateOfBirth,
        passportNumber: params.passportNumber,
        nationality: params.nationality,
        email: params.email ?? COMPANY_INFO.email,
        phone: params.phone,
        airline: params.airline ?? "Royal Air Maroc",
        flightNumber: params.flightNumber ?? "AT000",
        origin: params.origin ?? "Nouakchott",
        originCode: params.originCode ?? "NKC",
        destination: params.destination ?? "Destination",
        destinationCode: params.destinationCode ?? "DST",
        departureTime: params.departureTime ?? "—",
        arrivalTime: params.arrivalTime ?? "—",
        duration: params.duration ?? "—",
        cabinClass: params.cabinClass ?? "Economy",
        adults,
        children,
        tripType: (params.tripType as "oneway" | "roundtrip") ?? "oneway",
        returnDate: params.returnDate,
        totalPrice: formattedTotal,
        currency: "MRU",
        issueDate: today,
      });
    } else {
      return generateHotelVoucher({
        reference: params.reference ?? "RV000",
        guestName: params.passengerName ?? "Guest",
        email: params.email ?? COMPANY_INFO.email,
        phone: params.phone,
        hotelName: params.hotelName ?? "Hotel",
        hotelCity: params.hotelCity ?? "City",
        hotelCountry: params.hotelCountry ?? "Mauritania",
        checkIn: params.checkIn ?? "—",
        checkOut: params.checkOut ?? "—",
        roomType: params.roomType ?? "Standard Room",
        adults,
        children,
        totalPrice: formattedTotal,
        currency: "MRU",
        issueDate: today,
      });
    }
  };

  const handleViewTicket = () => {
    const ticket = getTicketText();
    Alert.alert(
      isFlight ? "✈ Boarding Pass" : "🏨 Hotel Voucher",
      ticket,
      [
        { text: "Share", onPress: () => handleShareTicket() },
        { text: "Close", style: "cancel" },
      ]
    );
  };

  const handleShareTicket = async () => {
    try {
      const ticket = getTicketText();
      await Share.share({
        message: ticket,
        title: isFlight ? "Royal Voyage — Boarding Pass" : "Royal Voyage — Hotel Voucher",
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
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
          Your {isFlight ? "flight" : "hotel"} has been successfully booked.
          {"\n"}A ticket has been prepared for you.
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
            <Text style={[styles.refValue, { color: colors.primary }]}>{formattedTotal}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: colors.success + "15" }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>✓ Confirmed</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.refRow}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>Issue Date</Text>
            <Text style={[styles.refLabel, { color: colors.foreground }]}>{today}</Text>
          </View>
        </View>

        {/* Company Info Card */}
        <View style={[styles.companyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.companyHeader}>
            <IconSymbol name="crown.fill" size={18} color={colors.primary} />
            <Text style={[styles.companyName, { color: colors.primary }]}>Royal Voyage</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 8 }]} />
          <View style={styles.companyRow}>
            <IconSymbol name="phone.fill" size={14} color={colors.muted} />
            <Text style={[styles.companyText, { color: colors.foreground }]}>{COMPANY_INFO.phone}</Text>
          </View>
          <View style={styles.companyRow}>
            <IconSymbol name="envelope.fill" size={14} color={colors.muted} />
            <Text style={[styles.companyText, { color: colors.foreground }]}>{COMPANY_INFO.email}</Text>
          </View>
          <View style={styles.companyRow}>
            <IconSymbol name="location.fill" size={14} color={colors.muted} />
            <Text style={[styles.companyText, { color: colors.foreground }]}>{COMPANY_INFO.address}</Text>
          </View>
        </View>

        {/* Ticket Actions */}
        <View style={styles.ticketActions}>
          <Pressable
            style={({ pressed }) => [
              styles.ticketBtn,
              { backgroundColor: colors.primary + "18", borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleViewTicket}
          >
            <IconSymbol name="ticket.fill" size={18} color={colors.primary} />
            <Text style={[styles.ticketBtnText, { color: colors.primary }]}>
              View {isFlight ? "Boarding Pass" : "Hotel Voucher"}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.ticketBtn,
              { backgroundColor: colors.success + "18", borderColor: colors.success, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleShareTicket}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.success} />
            <Text style={[styles.ticketBtnText, { color: colors.success }]}>Share Ticket</Text>
          </Pressable>
        </View>

        {/* Main Actions */}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22, paddingHorizontal: 16 },
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
  refLabel: { fontSize: 14 },
  refBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  refBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700", letterSpacing: 1 },
  refValue: { fontSize: 18, fontWeight: "700" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 13, fontWeight: "700" },
  divider: { height: 1 },
  companyCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  companyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  companyName: { fontSize: 16, fontWeight: "700" },
  companyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  companyText: { fontSize: 13, lineHeight: 18 },
  ticketActions: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
  },
  ticketBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  ticketBtnText: { fontSize: 13, fontWeight: "700" },
  actions: { width: "100%", gap: 12 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  secondaryBtnText: { fontSize: 16, fontWeight: "600" },
});
