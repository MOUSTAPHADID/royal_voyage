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
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU } from "@/lib/currency";
import { trpc } from "@/lib/trpc";

export default function AdminBookingDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, updateBookingTicketSent } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [resending, setResending] = useState(false);

  const sendAirlineConfirmedTicket = trpc.email.sendAirlineConfirmedTicket.useMutation();
  const sendAirlineConfirmedHotelTicket = trpc.email.sendAirlineConfirmedHotelTicket.useMutation();

  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>الحجز غير موجود</Text>
        </View>
      </ScreenContainer>
    );
  }

  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: colors.success + "15", text: colors.success },
    pending: { bg: colors.warning + "15", text: colors.warning },
    cancelled: { bg: colors.error + "15", text: colors.error },
    processing: { bg: "#3B82F615", text: "#3B82F6" },
    airline_confirmed: { bg: "#10B98115", text: "#10B981" },
  };
  const statusLabels: Record<string, string> = {
    confirmed: "مؤكد ✅",
    pending: "معلق ⏳",
    cancelled: "ملغى ❌",
    processing: "قيد المعالجة 🔄",
    airline_confirmed: "مؤكد من شركة الطيران ✈️",
  };
  const statusStyle = statusColors[booking.status] ?? statusColors.pending;

  const handleResendTicket = async () => {
    const email = booking.passengerEmail;
    if (!email) {
      Alert.alert("خطأ", "لا يوجد بريد إلكتروني مسجّل لهذا الحجز.");
      return;
    }

    Alert.alert(
      "إعادة إرسال التذكرة",
      `سيتم إرسال التذكرة PDF إلى:\n${email}\n\nهل تريد المتابعة؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "إرسال",
          onPress: async () => {
            setResending(true);
            try {
              const name = booking.passengerName ?? booking.guestName ?? "Guest";
              if (booking.type === "flight" && booking.flight) {
                await sendAirlineConfirmedTicket.mutateAsync({
                  passengerName: name,
                  passengerEmail: email,
                  bookingRef: booking.reference,
                  pnr: booking.realPnr ?? booking.pnr,
                  origin: booking.flight.originCode ?? booking.flight.origin ?? "NKC",
                  originCity: booking.flight.origin ?? "Nouakchott",
                  destination: booking.flight.destinationCode ?? booking.flight.destination ?? "",
                  destinationCity: booking.flight.destination ?? "",
                  departureDate: booking.date ?? "",
                  departureTime: booking.flight.departureTime ?? "",
                  arrivalTime: booking.flight.arrivalTime ?? "",
                  airline: booking.flight.airline ?? "",
                  flightNumber: booking.flight.flightNumber ?? "",
                  cabinClass: booking.flight.class ?? "ECONOMY",
                  passengers: booking.passengers ?? 1,
                  children: 0,
                  totalPrice: formatMRU(booking.totalPrice ?? 0),
                  currency: "MRU",
                  tripType: "one-way",
                  expoPushToken: booking.customerPushToken,
                });
              } else if (booking.type === "hotel" && booking.hotel) {
                let nights = 1;
                if (booking.checkIn && booking.checkOut) {
                  const diff = Math.round(
                    (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                    (1000 * 60 * 60 * 24)
                  );
                  if (diff > 0) nights = diff;
                }
                await sendAirlineConfirmedHotelTicket.mutateAsync({
                  guestName: name,
                  guestEmail: email,
                  bookingRef: booking.reference,
                  pnr: booking.realPnr ?? booking.pnr,
                  hotelName: booking.hotel.name,
                  hotelCity: booking.hotel.city,
                  hotelCountry: booking.hotel.country ?? "Mauritania",
                  stars: booking.hotel.stars ?? 3,
                  checkIn: booking.checkIn ?? "",
                  checkOut: booking.checkOut ?? "",
                  nights,
                  roomType: "Standard Room",
                  guests: booking.guests ?? 1,
                  children: 0,
                  totalPrice: formatMRU(booking.totalPrice ?? 0),
                  currency: "MRU",
                  expoPushToken: booking.customerPushToken,
                });
              }
              await updateBookingTicketSent(booking.id);
              Alert.alert(
                "✅ تم الإرسال",
                `تم إرسال التذكرة PDF بنجاح إلى:\n${email}`
              );
            } catch (err) {
              console.error("[Admin] Resend ticket failed:", err);
              Alert.alert("خطأ", "فشل إرسال التذكرة. تحقق من الاتصال وحاول مجدداً.");
            } finally {
              setResending(false);
            }
          },
        },
      ]
    );
  };

  const paymentLabels: Record<string, string> = {
    cash: "💵 نقداً",
    bank_transfer: "🏦 تحويل بنكي",
    bankily: "📱 Bankily",
    masrvi: "📱 Masrvi",
    sedad: "📱 Sedad",
    paypal: "🌐 PayPal (عملة أجنبية)",
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>تفاصيل الحجز</Text>
          <Text style={styles.headerSub}>{booking.reference}</Text>
        </View>
        {/* Ticket sent indicator */}
        {booking.ticketSent && (
          <View style={styles.ticketSentBadge}>
            <Text style={styles.ticketSentIcon}>✉️</Text>
            <Text style={styles.ticketSentText}>أُرسلت</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg, borderColor: statusStyle.text + "30" }]}>
          <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusLabels[booking.status] ?? booking.status}
          </Text>
          <Text style={[styles.refText, { color: statusStyle.text }]}>{booking.reference}</Text>
        </View>

        {/* Ticket Sent Info */}
        {booking.ticketSent && booking.ticketSentAt && (
          <View style={[styles.ticketSentBanner, { backgroundColor: "#10B98110", borderColor: "#10B98130" }]}>
            <Text style={{ fontSize: 16 }}>✉️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#10B981", fontWeight: "700", fontSize: 13 }}>تم إرسال التذكرة</Text>
              <Text style={{ color: "#10B981", fontSize: 11, marginTop: 2 }}>
                {new Date(booking.ticketSentAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
              </Text>
            </View>
          </View>
        )}

        {/* Booking Type Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.typeIcon, { backgroundColor: booking.type === "flight" ? "#1B2B5E15" : "#C9A84C15" }]}>
              <Text style={{ fontSize: 28 }}>{booking.type === "flight" ? "✈️" : "🏨"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mainTitle, { color: colors.foreground }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.airline ?? "—"} · ${booking.flight?.flightNumber ?? "—"}`
                  : booking.hotel?.name ?? "—"}
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.muted }]}>
                {booking.type === "flight"
                  ? `${booking.flight?.originCode ?? "—"} → ${booking.flight?.destinationCode ?? "—"}`
                  : `${booking.hotel?.city ?? "—"}, ${booking.hotel?.country ?? "—"}`}
              </Text>
            </View>
          </View>

          {/* Flight Route */}
          {booking.type === "flight" && booking.flight && (
            <View style={[styles.routeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.departureTime}</Text>
                <Text style={[styles.routeCode, { color: "#1B2B5E" }]}>{booking.flight.originCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.origin}</Text>
              </View>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{booking.flight.duration}</Text>
                <Text style={{ fontSize: 20, marginVertical: 2 }}>→</Text>
                <Text style={{ color: booking.flight.stops === 0 ? colors.success : colors.warning, fontSize: 11 }}>
                  {booking.flight.stops === 0 ? "مباشر" : `${booking.flight.stops} توقف`}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.routeTime, { color: colors.foreground }]}>{booking.flight.arrivalTime}</Text>
                <Text style={[styles.routeCode, { color: "#C9A84C" }]}>{booking.flight.destinationCode}</Text>
                <Text style={[styles.routeCity, { color: colors.muted }]}>{booking.flight.destination}</Text>
              </View>
            </View>
          )}

          {/* Hotel Dates */}
          {booking.type === "hotel" && (
            <View style={[styles.routeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 2 }}>تسجيل الدخول</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{booking.checkIn ?? "—"}</Text>
              </View>
              <Text style={{ color: colors.muted, fontSize: 18 }}>→</Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ fontSize: 11, color: colors.muted, marginBottom: 2 }}>تسجيل الخروج</Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>{booking.checkOut ?? "—"}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Customer Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>معلومات العميل</Text>
          {[
            { label: "الاسم", value: booking.passengerName ?? booking.guestName ?? "—" },
            { label: "البريد الإلكتروني", value: booking.passengerEmail ?? "—" },
            { label: "طريقة الدفع", value: paymentLabels[booking.paymentMethod ?? ""] ?? booking.paymentMethod ?? "—" },
            { label: "Push Token", value: booking.customerPushToken ? "✅ مسجّل" : "❌ غير مسجّل" },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* PNR */}
        {(booking.realPnr || booking.pnr) && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>رمز PNR</Text>
            <View style={[
              styles.pnrBox,
              booking.realPnr
                ? { backgroundColor: colors.success + "10", borderColor: colors.success }
                : { backgroundColor: "#1B2B5E10", borderColor: "#1B2B5E" }
            ]}>
              <Text style={[styles.pnrLabel, { color: colors.muted }]}>
                {booking.realPnr ? "PNR رسمي من شركة الطيران" : "PNR مؤقت"}
              </Text>
              <Text style={[styles.pnrValue, { color: booking.realPnr ? colors.success : "#1B2B5E" }]}>
                {booking.realPnr || booking.pnr}
              </Text>
              {booking.realPnrUpdatedAt && (
                <Text style={[styles.pnrHint, { color: colors.muted }]}>
                  تحديث: {new Date(booking.realPnrUpdatedAt).toLocaleString("ar-MR", { dateStyle: "short", timeStyle: "short" })}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Price */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ملخص السعر</Text>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>الإجمالي المدفوع</Text>
            <Text style={[styles.totalValue, { color: "#1B2B5E" }]}>{formatMRU(booking.totalPrice ?? 0)}</Text>
          </View>
        </View>

        {/* Resend Ticket Button */}
        {booking.status === "airline_confirmed" && booking.passengerEmail && (
          <Pressable
            style={({ pressed }) => [
              styles.resendBtn,
              { backgroundColor: "#10B981", opacity: pressed || resending ? 0.7 : 1 },
            ]}
            onPress={handleResendTicket}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 18 }}>✉️</Text>
            )}
            <Text style={styles.resendBtnText}>
              {booking.ticketSent ? "إعادة إرسال التذكرة PDF" : "إرسال التذكرة PDF"}
            </Text>
          </Pressable>
        )}

        {/* Send ticket for non-airline_confirmed if email exists */}
        {booking.status !== "airline_confirmed" && booking.passengerEmail && (
          <Pressable
            style={({ pressed }) => [
              styles.resendBtn,
              { backgroundColor: "#1B2B5E", opacity: pressed || resending ? 0.7 : 1 },
            ]}
            onPress={handleResendTicket}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 18 }}>📧</Text>
            )}
            <Text style={styles.resendBtnText}>إرسال تذكرة للعميل</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  ticketSentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10B98130",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ticketSentIcon: { fontSize: 14 },
  ticketSentText: { fontSize: 11, fontWeight: "700", color: "#10B981" },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 14, fontWeight: "700", flex: 1 },
  refText: { fontSize: 12, fontWeight: "600" },
  ticketSentBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
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
  mainTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  mainSubtitle: { fontSize: 14 },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  routeTime: { fontSize: 20, fontWeight: "700" },
  routeCode: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  routeCity: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 14 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: "600", textAlign: "right", flex: 1, marginLeft: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 22, fontWeight: "700" },
  pnrBox: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  pnrLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  pnrValue: { fontSize: 34, fontWeight: "800", letterSpacing: 6 },
  pnrHint: { fontSize: 11, marginTop: 6, textAlign: "center" },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    margin: 16,
    marginBottom: 0,
    paddingVertical: 16,
    borderRadius: 14,
  },
  resendBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
