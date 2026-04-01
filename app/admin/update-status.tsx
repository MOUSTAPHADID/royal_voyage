import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Booking } from "@/lib/mock-data";
import { trpc } from "@/lib/trpc";
import { formatMRU } from "@/lib/currency";

type BookingStatus = Booking["status"];

const STATUS_OPTIONS: {
  id: BookingStatus;
  label: string;
  labelAr: string;
  color: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "pending",
    label: "Pending",
    labelAr: "معلق",
    color: "#F59E0B",
    icon: "⏳",
    description: "الحجز في انتظار الدفع أو التأكيد",
  },
  {
    id: "processing",
    label: "Processing",
    labelAr: "قيد المعالجة",
    color: "#3B82F6",
    icon: "🔄",
    description: "جاري معالجة الحجز مع شركة الطيران/الفندق",
  },
  {
    id: "confirmed",
    label: "Confirmed",
    labelAr: "مؤكد",
    color: "#22C55E",
    icon: "✅",
    description: "تم تأكيد الحجز بنجاح",
  },
  {
    id: "airline_confirmed",
    label: "Airline Confirmed",
    labelAr: "مؤكد من شركة الطيران",
    color: "#10B981",
    icon: "✈️",
    description: "تم التأكيد الرسمي من شركة الطيران",
  },
  {
    id: "cancelled",
    label: "Cancelled",
    labelAr: "ملغى",
    color: "#EF4444",
    icon: "❌",
    description: "تم إلغاء الحجز",
  },
];

const STATUS_PUSH_MESSAGES: Record<BookingStatus, { title: string; body: string }> = {
  pending: {
    title: "⏳ حجزك في انتظار التأكيد",
    body: "سيتم تأكيد حجزك قريباً. شكراً لصبرك.",
  },
  processing: {
    title: "🔄 جاري معالجة حجزك",
    body: "نعمل على تأكيد حجزك مع شركة الطيران. سنُبلغك فور الانتهاء.",
  },
  confirmed: {
    title: "✅ تم تأكيد حجزك!",
    body: "تهانينا! تم تأكيد حجزك بنجاح. رحلة موفقة! ✈️",
  },
  airline_confirmed: {
    title: "✈️ تأكيد رسمي من شركة الطيران",
    body: "تم التأكيد الرسمي من شركة الطيران. يمكنك الآن إتمام تسجيل الوصول.",
  },
  cancelled: {
    title: "❌ تم إلغاء الحجز",
    body: "للأسف تم إلغاء حجزك. تواصل معنا لمزيد من المعلومات.",
  },
};

export default function UpdateStatusScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, updateBookingStatus, updateBookingTicketSent } = useApp();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");

  const sendPushNotification = trpc.email.sendPushNotification.useMutation();
  const sendAirlineConfirmedTicket = trpc.email.sendAirlineConfirmedTicket.useMutation();
  const sendAirlineConfirmedHotelTicket = trpc.email.sendAirlineConfirmedHotelTicket.useMutation();

  const filteredBookings = useMemo(() => {
    let result = bookings;
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }
    // Apply search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.reference.toLowerCase().includes(q) ||
          (b.passengerName && b.passengerName.toLowerCase().includes(q)) ||
          (b.flight?.airline && b.flight.airline.toLowerCase().includes(q)) ||
          (b.hotel?.name && b.hotel.name.toLowerCase().includes(q))
      );
    }
    return result;
  }, [bookings, search, statusFilter]);

  // Count bookings per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bookings.length };
    STATUS_OPTIONS.forEach((s) => {
      counts[s.id] = bookings.filter((b) => b.status === s.id).length;
    });
    return counts;
  }, [bookings]);

  const handleStatusChange = async (booking: Booking, newStatus: BookingStatus) => {
    if (booking.status === newStatus) return;

    Alert.alert(
      "تغيير الحالة",
      `تغيير حالة الحجز ${booking.reference} إلى "${STATUS_OPTIONS.find(s => s.id === newStatus)?.labelAr}"؟`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تأكيد",
          onPress: async () => {
            setSaving(booking.id);
            try {
              await updateBookingStatus(booking.id, newStatus);

              // If airline_confirmed → send PDF ticket (flight or hotel)
              if (newStatus === "airline_confirmed") {
                const email = booking.passengerEmail;
                const name = booking.passengerName ?? booking.guestName ?? "Guest";
                if (email) {
                  try {
                    if (booking.type === "flight") {
                      await sendAirlineConfirmedTicket.mutateAsync({
                        passengerName: name,
                        passengerEmail: email,
                        bookingRef: booking.reference,
                        pnr: booking.realPnr ?? booking.pnr,
                        ticketNumber: booking.ticketNumber ?? undefined,
                        origin: booking.flight?.originCode ?? booking.flight?.origin ?? "NKC",
                        originCity: booking.flight?.origin ?? "Nouakchott",
                        destination: booking.flight?.destinationCode ?? booking.flight?.destination ?? "",
                        destinationCity: booking.flight?.destination ?? "",
                        departureDate: booking.date ?? "",
                        departureTime: booking.flight?.departureTime ?? "",
                        arrivalTime: booking.flight?.arrivalTime ?? "",
                        airline: booking.flight?.airline ?? "",
                        flightNumber: booking.flight?.flightNumber ?? "",
                        cabinClass: booking.flight?.class ?? "ECONOMY",
                        passengers: booking.passengers ?? 1,
                        children: 0,
                        totalPrice: formatMRU(booking.totalPrice ?? 0),
                        currency: "MRU",
                        tripType: "one-way",
                        expoPushToken: booking.customerPushToken,
                      });
                      console.log("[Status] ✈️ Flight ticket sent to", email);
                    } else if (booking.type === "hotel" && booking.hotel) {
                      // Calculate nights
                      let nights = 1;
                      if (booking.checkIn && booking.checkOut) {
                        const d1 = new Date(booking.checkIn);
                        const d2 = new Date(booking.checkOut);
                        const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                        if (diff > 0) nights = diff;
                      }
                      await sendAirlineConfirmedHotelTicket.mutateAsync({
                        guestName: name,
                        guestEmail: email,
                        bookingRef: booking.reference,
                        pnr: booking.realPnr ?? booking.pnr,
                        ticketNumber: booking.ticketNumber ?? undefined,
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
                      console.log("[Status] 🏨 Hotel voucher sent to", email);
                    }
                    // Mark ticket as sent
                    await updateBookingTicketSent(booking.id);
                  } catch (err) {
                    console.error("[Status] Ticket email failed:", err);
                  }
                }
              } else if (booking.customerPushToken) {
                // For other statuses, send regular push notification
                const msg = STATUS_PUSH_MESSAGES[newStatus];
                try {
                  await sendPushNotification.mutateAsync({
                    expoPushToken: booking.customerPushToken,
                    title: msg.title,
                    body: `${msg.body} (${booking.reference})`,
                    data: { bookingRef: booking.reference, status: newStatus, type: "status_update" },
                  });
                } catch (err) {
                  console.error("[Status] Push failed:", err);
                }
              }

              const isAirlineConfirmed = newStatus === "airline_confirmed" && booking.passengerEmail;
              const docLabel = booking.type === "flight" ? "✈️ تذكرة PDF" : "🏨 قسيمة الفندق PDF";
              Alert.alert(
                "✅ تم التحديث",
                `تم تغيير الحالة إلى "${STATUS_OPTIONS.find(s => s.id === newStatus)?.labelAr}"` +
                (isAirlineConfirmed ? `\n${docLabel} أُرسل إلى ${booking.passengerEmail}` : "") +
                (booking.customerPushToken ? "\n🔔 تم إرسال إشعار Push للزبون" : "")
              );
            } catch (err) {
              Alert.alert("خطأ", "فشل تحديث الحالة");
            } finally {
              setSaving(null);
            }
          },
        },
      ]
    );
  };

  const getStatusInfo = (status: BookingStatus) =>
    STATUS_OPTIONS.find((s) => s.id === status) ?? STATUS_OPTIONS[0];

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
          <Text style={styles.headerTitle}>تتبع الطلبات</Text>
          <Text style={styles.headerSub}>تحديث حالة الحجوزات</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: "#C9A84C" }]}>
          <Text style={styles.badgeText}>{bookings.length}</Text>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.legendScroll}
        contentContainerStyle={styles.legendContent}
      >
        {/* All Tab */}
        <Pressable
          key="all"
          style={({ pressed }) => [
            styles.filterTab,
            {
              backgroundColor: statusFilter === "all" ? "#1B2B5E" : colors.surface,
              borderColor: statusFilter === "all" ? "#1B2B5E" : colors.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          onPress={() => setStatusFilter("all")}
        >
          <Text style={[styles.filterTabText, { color: statusFilter === "all" ? "#FFFFFF" : colors.foreground }]}>الكل</Text>
          <View style={[styles.filterBadge, { backgroundColor: statusFilter === "all" ? "#C9A84C" : colors.border }]}>
            <Text style={[styles.filterBadgeText, { color: statusFilter === "all" ? "#1B2B5E" : colors.muted }]}>
              {statusCounts.all}
            </Text>
          </View>
        </Pressable>
        {STATUS_OPTIONS.map((s) => (
          <Pressable
            key={s.id}
            style={({ pressed }) => [
              styles.filterTab,
              {
                backgroundColor: statusFilter === s.id ? s.color + "20" : colors.surface,
                borderColor: statusFilter === s.id ? s.color : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            onPress={() => setStatusFilter(s.id)}
          >
            <Text style={{ fontSize: 14 }}>{s.icon}</Text>
            <Text style={[styles.filterTabText, { color: statusFilter === s.id ? s.color : colors.foreground }]}>
              {s.labelAr}
            </Text>
            {statusCounts[s.id] > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: statusFilter === s.id ? s.color : colors.border }]}>
                <Text style={[styles.filterBadgeText, { color: statusFilter === s.id ? "#FFFFFF" : colors.muted }]}>
                  {statusCounts[s.id]}
                </Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="paperplane.fill" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="بحث بالمرجع أو الاسم..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {filteredBookings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد حجوزات</Text>
          </View>
        ) : (
          filteredBookings.map((booking) => {
            const currentStatus = getStatusInfo(booking.status);
            const isSaving = saving === booking.id;

            return (
              <View
                key={booking.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardLeft}>
                    <Text style={[styles.cardRef, { color: colors.foreground }]}>
                      {booking.reference}
                    </Text>
                    <Text style={[styles.cardName, { color: colors.muted }]}>
                      {booking.type === "flight"
                        ? `${booking.flight?.airline ?? "—"} · ${booking.flight?.originCode ?? ""} → ${booking.flight?.destinationCode ?? ""}`
                        : booking.hotel?.name ?? "—"}
                    </Text>
                    {booking.passengerName && (
                      <Text style={[styles.cardPassenger, { color: colors.muted }]}>
                        {booking.passengerName}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.currentStatus, { backgroundColor: currentStatus.color + "20" }]}>
                    <MaterialIcons name="info" size={16} color={currentStatus.color} />
                    <Text style={[styles.currentStatusText, { color: currentStatus.color }]}>
                      {currentStatus.labelAr}
                    </Text>
                  </View>
                </View>

                {/* Push Token Indicator */}
                <View style={[styles.tokenRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.tokenText, { color: colors.muted }]}>
                    {booking.customerPushToken ? "Push مسجّل — سيصل إشعار للزبون" : "Push غير مسجّل"}
                  </Text>
                </View>

                {/* Status Buttons */}
                <View style={[styles.statusButtons, { borderTopColor: colors.border }]}>
                  <Text style={[styles.changeLabel, { color: colors.muted }]}>تغيير الحالة:</Text>
                  <View style={styles.buttonsRow}>
                    {STATUS_OPTIONS.filter((s) => s.id !== booking.status).map((s) => (
                      <Pressable
                        key={s.id}
                        style={({ pressed }) => [
                          styles.statusBtn,
                          { backgroundColor: s.color + "15", borderColor: s.color + "50", opacity: pressed || isSaving ? 0.6 : 1 },
                        ]}
                        onPress={() => handleStatusChange(booking, s.id)}
                        disabled={isSaving}
                      >
                        <Text style={{ fontSize: 12 }}>{s.icon}</Text>
                        <Text style={[styles.statusBtnText, { color: s.color }]}>{s.labelAr}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
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
  badge: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#1B2B5E" },
  legendScroll: { maxHeight: 52 },
  legendContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabText: { fontSize: 12, fontWeight: "600" },
  filterBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: { fontSize: 10, fontWeight: "700" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14 },
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14, paddingBottom: 10 },
  cardLeft: { flex: 1 },
  cardRef: { fontSize: 14, fontWeight: "700" },
  cardName: { fontSize: 12, marginTop: 2 },
  cardPassenger: { fontSize: 12, marginTop: 2 },
  currentStatus: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  currentStatusText: { fontSize: 11, fontWeight: "700" },
  tokenRow: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 6 },
  tokenText: { fontSize: 11 },
  statusButtons: { borderTopWidth: 1, padding: 12 },
  changeLabel: { fontSize: 11, fontWeight: "600", marginBottom: 8 },
  buttonsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusBtnText: { fontSize: 11, fontWeight: "600" },
});
