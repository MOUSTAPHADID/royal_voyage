import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { FLIGHTS, HOTELS, Booking } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU, toMRU } from "@/lib/currency";

type PaymentMethod = "card" | "paypal" | "apple";

export default function PaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addBooking } = useApp();
  const params = useLocalSearchParams<{
    type: string;
    id: string;
    roomId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    passport?: string;
    nationality?: string;
    dateOfBirth?: string;
    price?: string;
    currency?: string;
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
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    roomType?: string;
    roomPrice?: string;
  }>();

  const isFlight = params.type === "flight";
  const flight = isFlight ? FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0] : null;
  const hotel = !isFlight ? HOTELS.find((h) => h.id === params.id) ?? HOTELS[0] : null;

  const basePrice = isFlight ? (flight?.price ?? 0) : (hotel?.pricePerNight ?? 0);
  const taxes = Math.round(basePrice * 0.1);
  const total = basePrice + taxes;

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(`${params.firstName ?? ""} ${params.lastName ?? ""}`.trim());
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    return cleaned.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return cleaned.slice(0, 2) + "/" + cleaned.slice(2);
    return cleaned;
  };

  const handlePay = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((r) => setTimeout(r, 2000));

    const ref = "RV-" + (isFlight ? "FL" : "HT") + "-" + Date.now().toString().slice(-6);
    const booking: Booking = {
      id: "b" + Date.now(),
      type: isFlight ? "flight" : "hotel",
      status: "confirmed",
      reference: ref,
      date: new Date().toISOString().split("T")[0],
      ...(isFlight && flight ? { flight, passengers: 1 } : {}),
      ...(hotel ? { hotel, checkIn: "2024-04-20", checkOut: "2024-04-25", guests: 2, rooms: 1 } : {}),
      totalPrice: total,
      currency: "MRU",
    };

    await addBooking(booking);
    setIsProcessing(false);

    router.replace({
      pathname: "/booking/confirmation" as any,
      params: {
        reference: ref,
        total: total.toString(),
        type: params.type,
        currency: "USD",
        passengerName: `${params.firstName ?? ""} ${params.lastName ?? ""}`.trim(),
        dateOfBirth: params.dateOfBirth,
        passportNumber: params.passport,
        nationality: params.nationality,
        email: params.email,
        phone: params.phone,
        airline: params.airline ?? flight?.airline ?? "",
        flightNumber: params.flightNumber ?? flight?.flightNumber ?? "",
        origin: params.origin ?? flight?.origin ?? "",
        destination: params.destination ?? flight?.destination ?? "",
        originCode: params.originCode ?? flight?.originCode ?? "",
        destinationCode: params.destinationCode ?? flight?.destinationCode ?? "",
        departureTime: params.departureTime ?? flight?.departureTime ?? "",
        arrivalTime: params.arrivalTime ?? flight?.arrivalTime ?? "",
        duration: params.duration ?? flight?.duration ?? "",
        cabinClass: params.cabinClass ?? "Economy",
        passengers: params.passengers ?? "1",
        children: params.children ?? "0",
        tripType: params.tripType ?? "oneway",
        returnDate: params.returnDate,
        hotelName: params.hotelName ?? hotel?.name ?? "",
        hotelCity: hotel?.city ?? "",
        hotelCountry: hotel?.country ?? "Mauritania",
        checkIn: params.checkIn ?? "",
        checkOut: params.checkOut ?? "",
        guests: params.guests ?? "1",
        roomType: params.roomType ?? "",
      },
    });
  };

  const paymentMethods: { id: PaymentMethod; label: string; icon: string }[] = [
    { id: "card", label: "Credit / Debit Card", icon: "💳" },
    { id: "paypal", label: "PayPal", icon: "🅿" },
    { id: "apple", label: "Apple Pay", icon: "🍎" },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Order Summary */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Order Summary</Text>
          {[
            { label: isFlight ? `رحلة: ${flight?.originCode} → ${flight?.destinationCode}` : `فندق: ${hotel?.name}`, value: formatMRU(toMRU(basePrice, "USD")) },
            { label: "ضرائب ورسوم (10%)", value: formatMRU(toMRU(taxes, "USD")) },
          ].map((item) => (
            <View key={item.label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.summaryValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatMRU(toMRU(total, "USD"))}</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Payment Method</Text>
          <View style={{ gap: 10 }}>
            {paymentMethods.map((method) => (
              <Pressable
                key={method.id}
                style={[
                  styles.methodOption,
                  {
                    borderColor: paymentMethod === method.id ? colors.primary : colors.border,
                    backgroundColor: paymentMethod === method.id ? colors.primary + "08" : colors.background,
                    borderWidth: paymentMethod === method.id ? 2 : 1,
                  },
                ]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Text style={{ fontSize: 22 }}>{method.icon}</Text>
                <Text style={[styles.methodLabel, { color: colors.foreground }]}>{method.label}</Text>
                {paymentMethod === method.id && (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: "#FFFFFF", fontSize: 12 }}>✓</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Card Details */}
        {paymentMethod === "card" && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Card Details</Text>

            {/* Card Preview */}
            <View style={[styles.cardPreview, { backgroundColor: colors.primary }]}>
              <Text style={styles.cardPreviewNumber}>
                {cardNumber || "•••• •••• •••• ••••"}
              </Text>
              <View style={styles.cardPreviewBottom}>
                <View>
                  <Text style={styles.cardPreviewLabel}>CARD HOLDER</Text>
                  <Text style={styles.cardPreviewName}>{cardName || "YOUR NAME"}</Text>
                </View>
                <View>
                  <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
                  <Text style={styles.cardPreviewName}>{expiry || "MM/YY"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Card Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={colors.muted}
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                keyboardType="number-pad"
                maxLength={19}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Cardholder Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="John Doe"
                placeholderTextColor={colors.muted}
                value={cardName}
                onChangeText={setCardName}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>Expiry Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.muted}
                  value={expiry}
                  onChangeText={(t) => setExpiry(formatExpiry(t))}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.foreground }]}>CVV</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="•••"
                  placeholderTextColor={colors.muted}
                  value={cvv}
                  onChangeText={(t) => setCvv(t.replace(/\D/g, "").slice(0, 3))}
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                />
              </View>
            </View>
          </View>
        )}

        {/* Security note */}
        <View style={[styles.securityNote, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
          <IconSymbol name="shield.fill" size={16} color={colors.success} />
          <Text style={[styles.securityText, { color: colors.success }]}>
            Your payment is secured with 256-bit SSL encryption
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Pay Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.payTotal, { color: colors.primary }]}>{formatMRU(toMRU(total, "USD"))}</Text>
          <Text style={[styles.payLabel, { color: colors.muted }]}>إجمالي المبلغ</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.payBtn,
            { backgroundColor: colors.secondary, opacity: pressed || isProcessing ? 0.85 : 1 },
          ]}
          onPress={handlePay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <IconSymbol name="creditcard.fill" size={18} color={colors.primary} />
              <Text style={[styles.payBtnText, { color: colors.primary }]}>Pay Now</Text>
            </>
          )}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 14,
    flex: 1,
    paddingRight: 8,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  methodLabel: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardPreview: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    height: 160,
    justifyContent: "space-between",
  },
  cardPreviewNumber: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 2,
    marginTop: 20,
  },
  cardPreviewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardPreviewLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardPreviewName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  securityText: {
    fontSize: 13,
    flex: 1,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  payTotal: {
    fontSize: 24,
    fontWeight: "700",
  },
  payLabel: {
    fontSize: 12,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  payBtnText: {
    fontSize: 17,
    fontWeight: "700",
  },
});
