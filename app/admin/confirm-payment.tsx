import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { formatMRU } from "@/lib/currency";

type PaymentMethodLabel = {
  [key: string]: string;
};

const PAYMENT_LABELS: PaymentMethodLabel = {
  cash: "دفع نقدي في المكتب",
  bank_transfer: "تحويل بنكي",
  bankily: "بنكيلي",
  masrvi: "مصرفي",
  sedad: "سداد",
  paypal: "PayPal (عملة أجنبية)",
};

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, updateBookingStatus } = useApp();
  const confirmPaymentMutation = trpc.email.confirmPayment.useMutation();

  const [confirming, setConfirming] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "flight" | "hotel">("all");

  // Show all non-cancelled bookings that have passengerEmail (real bookings)
  // Admin can confirm payment for cash bookings or any pending booking
  const pendingBookings = bookings.filter((b) => {
    const matchesType = filterType === "all" || b.type === filterType;
    const matchesSearch =
      searchQuery.trim() === "" ||
      b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotCancelled = b.status !== "cancelled";
    const isNotAlreadyConfirmed = b.status !== "confirmed" || b.paymentDeadline; // show cash confirmed too
    return matchesType && matchesSearch && isNotCancelled && isNotAlreadyConfirmed;
  });

  const handleConfirmPayment = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    Alert.alert(
      "تأكيد الدفع",
      `هل تريد تأكيد دفع الحجز ${booking.reference}؟\n\nسيتم إرسال بريد تأكيد للزبون${booking.customerPushToken ? " وإشعار Push" : ""}.`,
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تأكيد",
          style: "default",
          onPress: async () => {
            setConfirming(bookingId);
            try {
              // Update booking status to confirmed
              await updateBookingStatus(bookingId, "confirmed");

              // Send confirmation email + push if email available
              if (booking.passengerEmail) {
                const confirmedAt = new Date().toLocaleString("en-GB", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                await confirmPaymentMutation.mutateAsync({
                  passengerName: booking.passengerName ?? "Valued Customer",
                  passengerEmail: booking.passengerEmail,
                  bookingRef: booking.reference,
                  pnr: booking.realPnr ?? booking.pnr,
                  bookingType: booking.type,
                  // Flight fields
                  origin: booking.flight?.originCode,
                  destination: booking.flight?.destinationCode,
                  airline: booking.flight?.airline,
                  flightNumber: booking.flight?.flightNumber,
                  departureDate: booking.flight?.departureTime?.split("T")[0],
                  departureTime: booking.flight?.departureTime,
                  // Hotel fields
                  hotelName: booking.hotel?.name,
                  checkIn: booking.checkIn,
                  checkOut: booking.checkOut,
                  // Common
                  totalAmount: formatMRU(booking.totalPrice),
                  paymentMethod: PAYMENT_LABELS[booking.paymentMethod ?? "cash"] ?? booking.paymentMethod,
                  confirmedAt,
                  expoPushToken: booking.customerPushToken,
                });

                Alert.alert(
                  "✅ تم التأكيد",
                  `تم تأكيد دفع الحجز ${booking.reference} بنجاح.\nتم إرسال بريد تأكيد للزبون.`,
                  [{ text: "حسناً" }]
                );
              } else {
                Alert.alert(
                  "✅ تم التأكيد",
                  `تم تأكيد دفع الحجز ${booking.reference}.\n(لا يوجد بريد إلكتروني للزبون)`,
                  [{ text: "حسناً" }]
                );
              }
            } catch (err: any) {
              Alert.alert("خطأ", `فشل تأكيد الدفع: ${err?.message ?? "خطأ غير معروف"}`);
            } finally {
              setConfirming(null);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return colors.success;
      case "pending": return colors.warning;
      case "processing": return "#3B82F6";
      case "airline_confirmed": return "#10B981";
      default: return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "مؤكد ✅";
      case "pending": return "معلق ⏳";
      case "processing": return "قيد المعالجة 🔄";
      case "airline_confirmed": return "مؤكد من الطيران ✈️";
      default: return status;
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>تأكيد الدفع</Text>
          <Text style={styles.headerSub}>{pendingBookings.length} حجز</Text>
        </View>
      </View>

      {/* Search + Filter */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="بحث بالاسم أو المرجع..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterRow}>
          {(["all", "flight", "hotel"] as const).map((f) => (
            <Pressable
              key={f}
              style={({ pressed }) => [
                styles.filterBtn,
                filterType === f && { backgroundColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => setFilterType(f)}
            >
              <Text style={[styles.filterLabel, filterType === f && { color: "#fff" }]}>
                {f === "all" ? "الكل" : f === "flight" ? "✈ رحلات" : "🏨 فنادق"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {pendingBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد حجوزات معلقة</Text>
            <Text style={[styles.emptySubtitle, { color: colors.muted }]}>جميع الحجوزات تم تأكيدها</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {pendingBookings.map((booking) => {
              const isConfirming = confirming === booking.id;
              const isCash = !booking.paymentMethod || booking.paymentMethod === "cash";
              const statusColor = getStatusColor(booking.status);

              return (
                <View
                  key={booking.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={[styles.typeIcon, { backgroundColor: booking.type === "flight" ? colors.primary + "20" : "#F59E0B20" }]}>
                      <Text style={{ fontSize: 22 }}>{booking.type === "flight" ? "✈" : "🏨"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.refText, { color: colors.foreground }]}>{booking.reference}</Text>
                      <Text style={[styles.nameText, { color: colors.muted }]}>{booking.passengerName ?? "—"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + "20" }]}>
                      <Text style={[styles.statusLabel, { color: statusColor }]}>
                        {getStatusLabel(booking.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Booking Details */}
                  <View style={[styles.detailsRow, { borderTopColor: colors.border }]}>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>
                        {booking.type === "flight" ? "الرحلة" : "الفندق"}
                      </Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>
                        {booking.type === "flight"
                          ? `${booking.flight?.originCode ?? "?"} → ${booking.flight?.destinationCode ?? "?"}`
                          : booking.hotel?.name ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>المبلغ</Text>
                      <Text style={[styles.detailValue, { color: colors.primary, fontWeight: "700" }]}>
                        {formatMRU(booking.totalPrice)}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={[styles.detailLabel, { color: colors.muted }]}>طريقة الدفع</Text>
                      <Text style={[styles.detailValue, { color: colors.foreground }]}>
                        {PAYMENT_LABELS[booking.paymentMethod ?? "cash"] ?? "نقدي"}
                      </Text>
                    </View>
                    {booking.passengerEmail ? (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.muted }]}>البريد</Text>
                        <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                          {booking.passengerEmail}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Cash deadline warning */}
                  {isCash && booking.paymentDeadline && (() => {
                    const diff = new Date(booking.paymentDeadline).getTime() - Date.now();
                    if (diff <= 0) return (
                      <View style={[styles.deadlineBanner, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
                        <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "600" }}>⚠️ انتهت مهلة الدفع النقدي</Text>
                      </View>
                    );
                    const hours = Math.floor(diff / 3600000);
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    const isUrgent = hours < 2;
                    return (
                      <View style={[styles.deadlineBanner, { backgroundColor: isUrgent ? "#EF444415" : "#F59E0B15", borderColor: isUrgent ? "#EF444430" : "#F59E0B30" }]}>
                        <Text style={{ color: isUrgent ? "#EF4444" : "#F59E0B", fontSize: 12, fontWeight: "600" }}>
                          {isUrgent ? "⚠️" : "⏰"} مهلة الدفع: {hours > 0 ? `${hours}س ${minutes}د` : `${minutes} دقيقة`} متبقية
                        </Text>
                      </View>
                    );
                  })()}

                  {/* Confirm Button */}
                  {booking.status !== "confirmed" || booking.paymentDeadline ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.confirmBtn,
                        { backgroundColor: booking.status === "confirmed" ? colors.success : colors.primary },
                        pressed && { opacity: 0.8 },
                        isConfirming && { opacity: 0.6 },
                      ]}
                      onPress={() => handleConfirmPayment(booking.id)}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.confirmBtnText}>
                          {booking.status === "confirmed" ? "✅ تم التأكيد — إعادة إرسال البريد" : "✅ تأكيد الدفع وإرسال تأكيد للزبون"}
                        </Text>
                      )}
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
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
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  searchRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  filterLabel: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  list: { padding: 16, gap: 14 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  refText: { fontSize: 15, fontWeight: "700" },
  nameText: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusLabel: { fontSize: 11, fontWeight: "700" },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 12,
  },
  detailItem: { minWidth: "45%", flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  deadlineBanner: {
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmBtn: {
    margin: 14,
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySubtitle: { fontSize: 14 },
});
