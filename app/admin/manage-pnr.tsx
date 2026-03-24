import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

export default function ManagePnrScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, updateBookingPnr } = useApp();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pnrInput, setPnrInput] = useState("");
  const [saving, setSaving] = useState(false);

  const sendPnrUpdate = trpc.email.sendPnrUpdate.useMutation();
  const sendPushNotification = trpc.email.sendPushNotification.useMutation();

  // Only show flight bookings (PNR is for flights only)
  const flightBookings = useMemo(() => {
    const flights = bookings.filter((b) => b.type === "flight");
    if (!search.trim()) return flights;
    const q = search.toLowerCase();
    return flights.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        (b.pnr && b.pnr.toLowerCase().includes(q)) ||
        (b.realPnr && b.realPnr.toLowerCase().includes(q)) ||
        (b.passengerName && b.passengerName.toLowerCase().includes(q)) ||
        (b.flight?.airline && b.flight.airline.toLowerCase().includes(q))
    );
  }, [bookings, search]);

  const handleSavePnr = async (bookingId: string) => {
    const pnr = pnrInput.trim().toUpperCase();
    if (!pnr) {
      Alert.alert("خطأ", "يرجى إدخال رمز PNR");
      return;
    }
    if (pnr.length < 5 || pnr.length > 8) {
      Alert.alert("خطأ", "رمز PNR يجب أن يكون بين 5 و 8 أحرف");
      return;
    }
    const booking = flightBookings.find((b) => b.id === bookingId);
    setSaving(true);

    try {
      // 1. Update PNR in local storage
      await updateBookingPnr(bookingId, pnr);

      let emailSent = false;
      let pushSent = false;

      // 2. Send email notification to customer
      if (booking?.passengerEmail) {
        try {
          const emailResult = await sendPnrUpdate.mutateAsync({
            passengerName: booking.passengerName ?? "العميل الكريم",
            passengerEmail: booking.passengerEmail,
            bookingRef: booking.reference,
            pnr,
            origin: booking.flight?.originCode,
            destination: booking.flight?.destinationCode,
            departureDate: booking.date,
            airline: booking.flight?.airline,
            flightNumber: booking.flight?.flightNumber,
          });
          emailSent = emailResult.success;
          console.log("[PNR] Email sent:", emailSent);
        } catch (err) {
          console.error("[PNR] Email failed:", err);
        }
      }

      // 3. Send Push Notification to customer (works in APK, not Expo Go)
      if (booking?.customerPushToken && Platform.OS !== "web") {
        try {
          const pushResult = await sendPushNotification.mutateAsync({
            expoPushToken: booking.customerPushToken,
            title: "✈️ تم تحديث رمز حجزك",
            body: `رمز PNR لحجزك ${booking.reference} هو: ${pnr}`,
            data: { bookingRef: booking.reference, pnr, type: "pnr_update" },
          });
          pushSent = pushResult.success;
          console.log("[PNR] Push sent:", pushSent);
        } catch (err) {
          console.error("[PNR] Push failed:", err);
        }
      }

      setEditingId(null);
      setPnrInput("");

      // Show success message with details
      const details: string[] = [`✅ تم تحديث PNR إلى: ${pnr}`];
      if (booking?.passengerEmail) {
        details.push(emailSent
          ? `📧 تم إرسال بريد إلكتروني إلى: ${booking.passengerEmail}`
          : `⚠️ فشل إرسال البريد الإلكتروني`
        );
      } else {
        details.push("ℹ️ لا يوجد بريد إلكتروني للزبون");
      }
      if (booking?.customerPushToken) {
        details.push(pushSent ? "🔔 تم إرسال إشعار Push" : "⚠️ فشل إرسال إشعار Push");
      }

      Alert.alert("تم التحديث", details.join("\n"));
    } catch (err) {
      Alert.alert("خطأ", "فشل تحديث PNR. يرجى المحاولة مجدداً.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (bookingId: string, currentPnr?: string) => {
    setEditingId(bookingId);
    setPnrInput(currentPnr ?? "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setPnrInput("");
  };

  const getStatusColor = (status: string) => {
    if (status === "confirmed") return colors.success;
    if (status === "cancelled") return colors.error;
    return colors.warning;
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
          <Text style={styles.headerTitle}>إدارة PNR</Text>
          <Text style={styles.headerSub}>تحديث رموز الحجز الحقيقية</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: "#C9A84C" }]}>
          <Text style={styles.badgeText}>{flightBookings.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: "#1B2B5E15", borderColor: "#1B2B5E30" }]}>
          <IconSymbol name="paperplane.fill" size={16} color="#1B2B5E" />
          <Text style={[styles.infoText, { color: "#1B2B5E" }]}>
            بعد الحجز اليدوي مع شركة الطيران، أدخل رمز PNR الحقيقي هنا.
            سيُرسل تلقائياً بريد إلكتروني للزبون وإشعار Push (في APK).
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name="paperplane.fill" size={16} color={colors.muted} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="بحث بالمرجع أو الاسم أو PNR..."
            placeholderTextColor={colors.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <Pressable onPress={() => setSearch("")}>
              <IconSymbol name="chevron.right" size={16} color={colors.muted} />
            </Pressable>
          ) : null}
        </View>

        {/* Bookings List */}
        {flightBookings.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد حجوزات رحلات</Text>
          </View>
        ) : (
          flightBookings.map((booking) => {
            const isEditing = editingId === booking.id;
            const displayPnr = booking.realPnr || booking.pnr;
            const hasRealPnr = !!booking.realPnr;

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
                    <Text style={[styles.cardAirline, { color: colors.muted }]}>
                      {booking.flight?.airline ?? "—"} · {booking.flight?.flightNumber ?? ""}
                    </Text>
                    {booking.passengerName && (
                      <Text style={[styles.cardPassenger, { color: colors.muted }]}>
                        👤 {booking.passengerName}
                      </Text>
                    )}
                    {booking.passengerEmail && (
                      <Text style={[styles.cardPassenger, { color: colors.muted }]}>
                        📧 {booking.passengerEmail}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + "20" }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {booking.status === "confirmed" ? "مؤكد" : booking.status === "cancelled" ? "ملغى" : "معلق"}
                    </Text>
                  </View>
                </View>

                {/* Route */}
                <View style={styles.route}>
                  <Text style={[styles.routeCode, { color: "#1B2B5E" }]}>{booking.flight?.originCode ?? "—"}</Text>
                  <IconSymbol name="paperplane.fill" size={14} color={colors.muted} />
                  <Text style={[styles.routeCode, { color: "#1B2B5E" }]}>{booking.flight?.destinationCode ?? "—"}</Text>
                  <Text style={[styles.routeDate, { color: colors.muted }]}>{booking.date}</Text>
                </View>

                {/* Notification Status */}
                <View style={[styles.notifRow, { borderTopColor: colors.border }]}>
                  <View style={styles.notifItem}>
                    <Text style={[styles.notifLabel, { color: colors.muted }]}>
                      {booking.passengerEmail ? `📧 ${booking.passengerEmail}` : "📧 لا يوجد بريد"}
                    </Text>
                  </View>
                  <View style={styles.notifItem}>
                    <Text style={[styles.notifLabel, { color: colors.muted }]}>
                      {booking.customerPushToken ? "🔔 Push مسجّل" : "🔔 Push غير مسجّل"}
                    </Text>
                  </View>
                </View>

                {/* PNR Section */}
                <View style={[styles.pnrSection, { borderTopColor: colors.border }]}>
                  {!isEditing ? (
                    <View style={styles.pnrRow}>
                      <View style={styles.pnrLeft}>
                        <Text style={[styles.pnrLabel, { color: colors.muted }]}>PNR</Text>
                        <View style={styles.pnrValueRow}>
                          <Text style={[styles.pnrValue, { color: hasRealPnr ? colors.success : colors.warning }]}>
                            {displayPnr ?? "—"}
                          </Text>
                          {hasRealPnr && (
                            <View style={[styles.realBadge, { backgroundColor: colors.success + "20" }]}>
                              <Text style={[styles.realBadgeText, { color: colors.success }]}>حقيقي ✓</Text>
                            </View>
                          )}
                          {!hasRealPnr && (
                            <View style={[styles.realBadge, { backgroundColor: colors.warning + "20" }]}>
                              <Text style={[styles.realBadgeText, { color: colors.warning }]}>تلقائي</Text>
                            </View>
                          )}
                        </View>
                        {booking.realPnrUpdatedAt && (
                          <Text style={[styles.updatedAt, { color: colors.muted }]}>
                            آخر تحديث: {new Date(booking.realPnrUpdatedAt).toLocaleString("ar-MR")}
                          </Text>
                        )}
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.editBtn,
                          { backgroundColor: "#1B2B5E", opacity: pressed ? 0.7 : 1 },
                        ]}
                        onPress={() => handleEdit(booking.id, booking.realPnr)}
                      >
                        <Text style={styles.editBtnText}>
                          {hasRealPnr ? "تعديل" : "إدخال PNR"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={styles.editSection}>
                      <Text style={[styles.editLabel, { color: colors.foreground }]}>
                        أدخل رمز PNR من شركة الطيران:
                      </Text>
                      <TextInput
                        style={[styles.pnrTextInput, { borderColor: "#1B2B5E", color: colors.foreground, backgroundColor: colors.background }]}
                        placeholder="مثال: EWMAHE"
                        placeholderTextColor={colors.muted}
                        value={pnrInput}
                        onChangeText={setPnrInput}
                        autoCapitalize="characters"
                        maxLength={8}
                        autoFocus
                      />
                      <View style={styles.editActions}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.cancelBtn,
                            { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={handleCancel}
                        >
                          <Text style={[styles.cancelBtnText, { color: colors.muted }]}>إلغاء</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [
                            styles.saveBtn,
                            { backgroundColor: "#1B2B5E", opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={() => handleSavePnr(booking.id)}
                          disabled={saving}
                        >
                          <Text style={styles.saveBtnText}>{saving ? "جاري الإرسال..." : "حفظ وإرسال"}</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
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
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyText: { fontSize: 14 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 14,
    paddingBottom: 8,
  },
  cardLeft: { flex: 1 },
  cardRef: { fontSize: 14, fontWeight: "700" },
  cardAirline: { fontSize: 12, marginTop: 2 },
  cardPassenger: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "600" },
  route: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  routeCode: { fontSize: 16, fontWeight: "700" },
  routeDate: { fontSize: 12, marginLeft: "auto" },
  notifRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 12,
  },
  notifItem: { flex: 1 },
  notifLabel: { fontSize: 11 },
  pnrSection: { borderTopWidth: 1, padding: 14 },
  pnrRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pnrLeft: { flex: 1 },
  pnrLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.5 },
  pnrValueRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  pnrValue: { fontSize: 20, fontWeight: "800", letterSpacing: 2 },
  realBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  realBadgeText: { fontSize: 10, fontWeight: "600" },
  updatedAt: { fontSize: 10, marginTop: 4 },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  editSection: { gap: 10 },
  editLabel: { fontSize: 13, fontWeight: "500" },
  pnrTextInput: {
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
  },
  editActions: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "500" },
  saveBtn: { flex: 2, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  saveBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
