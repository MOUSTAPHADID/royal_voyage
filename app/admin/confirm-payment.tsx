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
  Image,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { formatMRU } from "@/lib/currency";
import { addAdminNotification } from "@/lib/admin-notifications";

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
  multicaixa: "Multicaixa Express (AOA)",
};

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, updateBookingStatus, confirmBookingPayment, rejectBookingPayment } = useApp();
  const confirmPaymentMutation = trpc.email.confirmPayment.useMutation();
  const sendPushMutation = trpc.email.sendPushNotification.useMutation();

  const [confirming, setConfirming] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pending" | "confirmed" | "rejected">("all");
  const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

  // Filter bookings based on payment status
  const pendingBookings = bookings.filter((b) => {
    const matchesSearch =
      searchQuery.trim() === "" ||
      b.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passengerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.transferRef?.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotCancelled = b.status !== "cancelled";
    
    if (filterType === "pending") return matchesSearch && isNotCancelled && !b.paymentConfirmed && !b.paymentRejected;
    if (filterType === "confirmed") return matchesSearch && isNotCancelled && b.paymentConfirmed;
    if (filterType === "rejected") return matchesSearch && isNotCancelled && b.paymentRejected;
    return matchesSearch && isNotCancelled;
  });

  const pendingCount = bookings.filter((b) => b.status !== "cancelled" && !b.paymentConfirmed && !b.paymentRejected).length;
  const confirmedCount = bookings.filter((b) => b.status !== "cancelled" && b.paymentConfirmed).length;
  const rejectedCount = bookings.filter((b) => b.status !== "cancelled" && b.paymentRejected).length;

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
              // Update booking payment confirmed
              await confirmBookingPayment(bookingId);
              if (booking.status === "pending") {
                await updateBookingStatus(bookingId, "confirmed");
              }

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

                // Send push notification to customer
                if (booking.customerPushToken) {
                  try {
                    await sendPushMutation.mutateAsync({
                      expoPushToken: booking.customerPushToken,
                      title: "✅ تم تأكيد الدفع",
                      body: `تم تأكيد دفع حجزك ${booking.reference}. شكراً لثقتك!`,
                      data: { type: "payment_confirmed", bookingId: booking.id },
                    });
                  } catch {}
                }

                Alert.alert(
                  "✅ تم التأكيد",
                  `تم تأكيد دفع الحجز ${booking.reference} بنجاح.\nتم إرسال بريد تأكيد للزبون.`,
                  [{ text: "حسناً" }]
                );
              } else {
                // Send push notification even without email
                if (booking.customerPushToken) {
                  try {
                    await sendPushMutation.mutateAsync({
                      expoPushToken: booking.customerPushToken,
                      title: "✅ تم تأكيد الدفع",
                      body: `تم تأكيد دفع حجزك ${booking.reference}. شكراً لثقتك!`,
                      data: { type: "payment_confirmed", bookingId: booking.id },
                    });
                  } catch {}
                }

                Alert.alert(
                  "✅ تم التأكيد",
                  `تم تأكيد دفع الحجز ${booking.reference}.\n(لا يوجد بريد إلكتروني للزبون)`,
                  [{ text: "حسناً" }]
                );
              }

              // Save admin notification
              await addAdminNotification({
                type: "payment_confirmed",
                title: `تأكيد دفع: ${booking.reference}`,
                body: `تم تأكيد دفع ${booking.passengerName ?? "زبون"} - ${formatMRU(booking.totalPrice)}`,
                bookingId: booking.id,
              });
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

  const handleRejectPayment = async (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || !rejectReason.trim()) {
      Alert.alert("خطأ", "يرجى إدخال سبب الرفض");
      return;
    }

    setRejecting(bookingId);
    try {
      await rejectBookingPayment(bookingId, rejectReason.trim());

      // Send push notification to customer about rejection
      if (booking.customerPushToken) {
        try {
          await sendPushMutation.mutateAsync({
            expoPushToken: booking.customerPushToken,
            title: "❌ رفض الدفع",
            body: `تم رفض دفع حجزك ${booking.reference}. السبب: ${rejectReason.trim()}`,
            data: { type: "payment_rejected", bookingId: booking.id },
          });
        } catch {}
      }

      // Save admin notification
      await addAdminNotification({
        type: "payment_rejected",
        title: `رفض دفع: ${booking.reference}`,
        body: `تم رفض دفع ${booking.passengerName ?? "زبون"} - السبب: ${rejectReason.trim()}`,
        bookingId: booking.id,
      });

      Alert.alert("❌ تم الرفض", `تم رفض دفع الحجز ${booking.reference}.\nتم إرسال إشعار للزبون.`);
      setShowRejectModal(null);
      setRejectReason("");
    } catch (err: any) {
      Alert.alert("خطأ", `فشل رفض الدفع: ${err?.message ?? "خطأ غير معروف"}`);
    } finally {
      setRejecting(null);
    }
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
          {(["all", "pending", "confirmed", "rejected"] as const).map((f) => {
            const count = f === "all" ? pendingBookings.length : f === "pending" ? pendingCount : f === "confirmed" ? confirmedCount : rejectedCount;
            return (
              <Pressable
                key={f}
                style={({ pressed }) => [
                  styles.filterBtn,
                  filterType === f && { backgroundColor: f === "rejected" ? "#EF4444" : f === "confirmed" ? colors.success : colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
                onPress={() => setFilterType(f)}
              >
                <Text style={[styles.filterLabel, filterType === f && { color: "#fff" }]}>
                  {f === "all" ? `الكل` : f === "pending" ? `معلق (${count})` : f === "confirmed" ? `مؤكد (${count})` : `مرفوض (${count})`}
                </Text>
              </Pressable>
            );
          })}
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
                    {booking.transferRef ? (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.muted }]}>رقم الإيصال</Text>
                        <Text style={[styles.detailValue, { color: "#003087", fontWeight: "700" }]} numberOfLines={1}>
                          {booking.transferRef}
                        </Text>
                      </View>
                    ) : null}
                    {booking.passengerEmail ? (
                      <View style={styles.detailItem}>
                        <Text style={[styles.detailLabel, { color: colors.muted }]}>البريد</Text>
                        <Text style={[styles.detailValue, { color: colors.foreground }]} numberOfLines={1}>
                          {booking.passengerEmail}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* إيصال الدفع */}
                  {booking.receiptImage && (
                    <View style={{ marginHorizontal: 14, marginBottom: 10 }}>
                      <Text style={[styles.detailLabel, { color: colors.muted, marginBottom: 6 }]}>📸 إيصال الدفع</Text>
                      <Pressable
                        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                        onPress={() => setPreviewReceipt(booking.receiptImage!)}
                      >
                        <Image
                          source={{ uri: booking.receiptImage }}
                          style={{ width: "100%" as any, height: 160, borderRadius: 10, backgroundColor: colors.border }}
                          resizeMode="cover"
                        />
                        <View style={styles.receiptBadge}>
                          <IconSymbol name="eye.fill" size={14} color="#FFFFFF" />
                          <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>اضغط للمعاينة</Text>
                        </View>
                      </Pressable>
                      {booking.receiptImageAt && (
                        <Text style={{ color: colors.muted, fontSize: 10, marginTop: 4 }}>
                          تم الرفع: {new Date(booking.receiptImageAt).toLocaleString("ar-SA", { dateStyle: "medium", timeStyle: "short" })}
                        </Text>
                      )}
                    </View>
                  )}

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

                  {/* Payment status badge */}
                  {booking.paymentConfirmed && (
                    <View style={[styles.deadlineBanner, { backgroundColor: "#22C55E15", borderColor: "#22C55E30" }]}>
                      <Text style={{ color: "#22C55E", fontSize: 12, fontWeight: "700" }}>✅ تم تأكيد الدفع — {booking.paymentConfirmedAt ? new Date(booking.paymentConfirmedAt).toLocaleDateString("ar-SA") : ""}</Text>
                    </View>
                  )}
                  {booking.paymentRejected && (
                    <View style={[styles.deadlineBanner, { backgroundColor: "#EF444415", borderColor: "#EF444430" }]}>
                      <Text style={{ color: "#EF4444", fontSize: 12, fontWeight: "700" }}>❌ تم رفض الدفع: {booking.paymentRejectedReason}</Text>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={{ flexDirection: "row", gap: 8, margin: 14, marginTop: 4 }}>
                    {!booking.paymentConfirmed && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.confirmBtn,
                          { backgroundColor: colors.primary, flex: 1, margin: 0 },
                          pressed && { opacity: 0.8 },
                          isConfirming && { opacity: 0.6 },
                        ]}
                        onPress={() => handleConfirmPayment(booking.id)}
                        disabled={isConfirming}
                      >
                        {isConfirming ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.confirmBtnText}>✅ تأكيد الدفع</Text>
                        )}
                      </Pressable>
                    )}
                    {!booking.paymentRejected && !booking.paymentConfirmed && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.confirmBtn,
                          { backgroundColor: "#EF4444", flex: 1, margin: 0 },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => { setShowRejectModal(booking.id); setRejectReason(""); }}
                      >
                        <Text style={styles.confirmBtnText}>❌ رفض الدفع</Text>
                      </Pressable>
                    )}
                    {booking.paymentConfirmed && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.confirmBtn,
                          { backgroundColor: colors.success, flex: 1, margin: 0 },
                          pressed && { opacity: 0.8 },
                        ]}
                        onPress={() => handleConfirmPayment(booking.id)}
                      >
                        <Text style={styles.confirmBtnText}>إعادة إرسال التأكيد</Text>
                      </Pressable>
                    )}
                  </View>

                  {/* Reject Modal */}
                  {showRejectModal === booking.id && (
                    <View style={[styles.rejectModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <Text style={[{ color: colors.foreground, fontWeight: "700", fontSize: 14, marginBottom: 8 }]}>سبب رفض الدفع:</Text>
                      <TextInput
                        style={[styles.rejectInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                        placeholder="مثال: لم يتم استلام المبلغ..."
                        placeholderTextColor={colors.muted}
                        value={rejectReason}
                        onChangeText={setRejectReason}
                        multiline
                        numberOfLines={3}
                      />
                      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                        <Pressable
                          style={({ pressed }) => [{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", opacity: pressed ? 0.8 : 1 }]}
                          onPress={() => handleRejectPayment(booking.id)}
                          disabled={rejecting === booking.id}
                        >
                          {rejecting === booking.id ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={{ color: "#fff", fontWeight: "700" }}>تأكيد الرفض</Text>
                          )}
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.border, alignItems: "center", opacity: pressed ? 0.8 : 1 }]}
                          onPress={() => { setShowRejectModal(null); setRejectReason(""); }}
                        >
                          <Text style={{ color: colors.foreground, fontWeight: "600" }}>إلغاء</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* معاينة الإيصال */}
      <Modal visible={!!previewReceipt} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <Pressable style={styles.previewCloseBtn} onPress={() => setPreviewReceipt(null)}>
            <IconSymbol name="xmark" size={24} color="#FFFFFF" />
          </Pressable>
          {previewReceipt && (
            <Image
              source={{ uri: previewReceipt }}
              style={{ width: "90%" as any, height: "70%" as any, borderRadius: 16 }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
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
  rejectModal: {
    marginHorizontal: 14,
    marginBottom: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  rejectInput: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: "top",
  },
  receiptBadge: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewCloseBtn: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
