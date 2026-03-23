import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { trpc } from "@/lib/trpc";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function BookingDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, cancelBooking } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sendingTicket, setSendingTicket] = useState(false);
  const sendFlightMutation = trpc.email.sendFlightTicket.useMutation();
  const sendHotelMutation = trpc.email.sendHotelConfirmation.useMutation();

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>Booking not found</Text>
        </View>
      </ScreenContainer>
    );
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: colors.success + "15", text: colors.success },
    pending: { bg: colors.warning + "15", text: colors.warning },
    cancelled: { bg: colors.error + "15", text: colors.error },
  };
  const statusStyle = statusColors[booking.status] ?? statusColors.pending;

  const handleRetrieveTicket = async () => {
    if (!booking) return;
    // Ask for email
    Alert.prompt(
      "استرداد التذكرة",
      "أدخل عنوان البريد الإلكتروني لإرسال التذكرة",
      async (email) => {
        if (!email) return;
        setSendingTicket(true);
        try {
          if (booking.type === "flight" && booking.flight) {
            await sendFlightMutation.mutateAsync({
              passengerName: booking.passengerName ?? "العميل",
              passengerEmail: email,
              bookingRef: booking.reference,
              origin: booking.flight.originCode,
              originCity: booking.flight.origin,
              destination: booking.flight.destinationCode,
              destinationCity: booking.flight.destination,
              departureDate: booking.date,
              departureTime: booking.flight.departureTime,
              arrivalTime: booking.flight.arrivalTime,
              airline: booking.flight.airline,
              flightNumber: booking.flight.flightNumber,
              cabinClass: booking.flight.class ?? "Economy",
              passengers: booking.passengers ?? 1,
              totalPrice: `${booking.totalPrice}`,
            });
          } else if (booking.type === "hotel" && booking.hotel) {
            const checkInDate = booking.checkIn ?? "";
            const checkOutDate = booking.checkOut ?? "";
            const nights = checkInDate && checkOutDate
              ? Math.max(1, Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86400000))
              : 1;
            await sendHotelMutation.mutateAsync({
              guestName: booking.guestName ?? "العميل",
              guestEmail: email,
              bookingRef: booking.reference,
              hotelName: booking.hotel.name,
              hotelCity: booking.hotel.city,
              hotelCountry: booking.hotel.country ?? "Mauritania",
              stars: booking.hotel.stars ?? 3,
              checkIn: checkInDate,
              checkOut: checkOutDate,
              nights,
              guests: booking.guests ?? 1,
              totalPrice: `${booking.totalPrice}`,
            });
          }
          Alert.alert("تم الإرسال ✓", `تم إرسال التذكرة إلى ${email}`);
        } catch {
          Alert.alert("خطأ", "فشل إرسال التذكرة. تحقق من البريد وحاول مجدداً.");
        } finally {
          setSendingTicket(false);
        }
      },
      "plain-text",
      "",
      "email-address"
    );
  };

  const handleChangeBooking = () => {
    router.push({ pathname: "/booking/change" as any, params: { id: booking?.id } });
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      [
        { text: "Keep Booking", style: "cancel" },
        {
          text: "Cancel Booking",
          style: "destructive",
          onPress: () => {
            cancelBooking(booking.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <Pressable style={[styles.shareBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.text + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            Booking {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </Text>
          <Text style={[styles.refText, { color: statusStyle.text }]}>{booking.reference}</Text>
        </View>

        {/* Main Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: booking.type === "flight" ? colors.primary + "15" : colors.secondary + "20" }]}>
              <Text style={{ fontSize: 28 }}>{booking.type === "flight" ? "✈" : "🏨"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainTitle, { color: colors.foreground }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.airline} · ${booking.flight?.flightNumber}`
                  : booking.hotel?.name ?? "Hotel"}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.muted }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.originCode} → ${booking.flight?.destinationCode}`
                  : `${booking.hotel?.city}, ${booking.hotel?.country}`}
              </Text>
            </View>
          </View>

          {booking.type === "flight" && booking.flight ? (
            <View style={[styles.routeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.routePoint}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.departureTime}</Text>
                <Text style={[styles.routeCode, { color: colors.primary }]}>{booking.flight.originCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.origin}</Text>
              </View>
              <View style={styles.routeCenter}>
                <Text style={[styles.routeDuration, { color: colors.muted }]}>{booking.flight.duration}</Text>
                <View style={styles.routeLine}>
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                  <Text style={{ fontSize: 16 }}>✈</Text>
                  <View style={[styles.line, { backgroundColor: colors.border }]} />
                  <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
                </View>
                <Text style={[styles.routeStops, { color: booking.flight.stops === 0 ? colors.success : colors.warning }]}>
                  {booking.flight.stops === 0 ? "Direct" : `${booking.flight.stops} stop`}
                </Text>
              </View>
              <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.arrivalTime}</Text>
                <Text style={[styles.routeCode, { color: colors.secondary }]}>{booking.flight.destinationCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.destination}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Booking Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Booking Information</Text>
          {[
            { label: "Booking Date", value: booking.date },
            { label: "Reference", value: booking.reference },
            ...(booking.type === "flight" ? [
              { label: "Class", value: booking.flight?.class ?? "Economy" },
              { label: "Passengers", value: `${booking.passengers ?? 1}` },
            ] : [
              { label: "Check-in", value: booking.checkIn ?? "-" },
              { label: "Check-out", value: booking.checkOut ?? "-" },
              { label: "Guests", value: `${booking.guests ?? 1}` },
              { label: "Rooms", value: `${booking.rooms ?? 1}` },
            ]),
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total Paid</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>${booking.totalPrice}</Text>
          </View>
        </View>

        {/* QR Code */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: "center" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Boarding Pass / Voucher</Text>
          <View style={[styles.qrBox, { backgroundColor: colors.background }]}>
            <IconSymbol name="qrcode" size={100} color={colors.primary} />
          </View>
          <Text style={[styles.qrLabel, { color: colors.muted }]}>
            Present this QR code at check-in
          </Text>
        </View>

        {/* Action Buttons */}
        {booking.status !== "cancelled" && (
          <View style={styles.actionRow}>
            {/* Retrieve Ticket */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.primary + "15", borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleRetrieveTicket}
              disabled={sendingTicket}
            >
              {sendingTicket ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <IconSymbol name="envelope.fill" size={16} color={colors.primary} />
              )}
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>
                استرداد التذكرة
              </Text>
            </Pressable>

            {/* Change Booking */}
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.warning + "15", borderColor: colors.warning, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleChangeBooking}
            >
              <IconSymbol name="pencil" size={16} color={colors.warning} />
              <Text style={[styles.actionBtnText, { color: colors.warning }]}>
                تغيير الحجز
              </Text>
            </Pressable>
          </View>
        )}

        {/* Cancel */}
        {booking.status !== "cancelled" && (
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              { borderColor: colors.error, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={handleCancel}
          >
            <IconSymbol name="xmark" size={16} color={colors.error} />
            <Text style={[styles.cancelBtnText, { color: colors.error }]}>إلغاء الحجز</Text>
          </Pressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  refText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  typeIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: 14,
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  routePoint: {
    minWidth: 70,
  },
  routeTime: {
    fontSize: 20,
    fontWeight: "700",
  },
  routeCode: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },
  routeCity: {
    fontSize: 11,
    marginTop: 2,
  },
  routeCenter: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  routeDuration: {
    fontSize: 12,
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  line: {
    flex: 1,
    height: 1.5,
  },
  routeStops: {
    fontSize: 11,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
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
  qrBox: {
    width: 140,
    height: 140,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  qrLabel: {
    fontSize: 13,
    textAlign: "center",
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginBottom: 0,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 8,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    margin: 16,
    marginBottom: 0,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
