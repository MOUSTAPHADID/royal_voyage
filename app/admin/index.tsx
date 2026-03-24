import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useTranslation } from "@/lib/i18n";
import { Booking } from "@/lib/mock-data";
import { formatMRU } from "@/lib/currency";
import { getPricingSettings } from "@/lib/pricing-settings";

const ADMIN_PIN = "36380112";

// Derive unique clients from bookings
type ClientRecord = {
  name: string;
  email: string;
  bookings: Booking[];
  totalSpent: number;
  lastBooking: string;
};

function deriveClients(bookings: Booking[]): ClientRecord[] {
  const map: Record<string, ClientRecord> = {};
  bookings.forEach((b) => {
    const key = (b as any).passengerName || (b as any).guestName || "Unknown";
    const email = (b as any).email || "—";
    if (!map[key]) {
      map[key] = { name: key, email, bookings: [], totalSpent: 0, lastBooking: b.date };
    }
    map[key].bookings.push(b);
    map[key].totalSpent += b.totalPrice ?? 0;
    if (b.date > map[key].lastBooking) map[key].lastBooking = b.date;
  });
  return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
}

export default function AdminScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings, user } = useApp();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"overview" | "bookings" | "clients" | "profits">("overview");

  // Redirect non-admin users
  useEffect(() => {
    if (!user?.isAdmin) {
      router.replace("/auth/login" as any);
    }
  }, [user]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const flights = bookings.filter((b) => b.type === "flight").length;
    const hotels = bookings.filter((b) => b.type === "hotel").length;
    const confirmed = bookings.filter((b) => b.status === "confirmed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;
    const pending = bookings.filter((b) => b.status === "pending").length;
    const revenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const avgRevenue = total > 0 ? revenue / total : 0;

    // Top destination
    const destCount: Record<string, number> = {};
    bookings.forEach((b) => {
      const dest = b.flight?.destination || b.hotel?.city || "Unknown";
      destCount[dest] = (destCount[dest] || 0) + 1;
    });
    const topDest = Object.entries(destCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    return { total, flights, hotels, confirmed, cancelled, pending, revenue, avgRevenue, topDest };
  }, [bookings]);

  const clients = useMemo(() => deriveClients(bookings), [bookings]);

  // حساب الأرباح الشهرية من رسوم الوكالة
  const profitStats = useMemo(() => {
    const pricing = getPricingSettings();
    const confirmed = bookings.filter((b) => b.status === "confirmed");

    // تصنيف الحجوزات حسب النوع
    const domesticFlights = confirmed.filter((b) => {
      if (b.type !== "flight") return false;
      const origin = b.flight?.originCode || "";
      const dest = b.flight?.destinationCode || "";
      const MR_AIRPORTS = ["NKC","NDB","ATR","KFA","MOM","OUZ","SEY","THI","TMD","ZLG","AEO","EMN","LEG","MBR","OGJ"];
      return MR_AIRPORTS.includes(origin.toUpperCase()) && MR_AIRPORTS.includes(dest.toUpperCase());
    });
    const internationalFlights = confirmed.filter((b) => b.type === "flight" && !domesticFlights.includes(b));
    const hotels = confirmed.filter((b) => b.type === "hotel");

    const domesticProfit = domesticFlights.length * pricing.agencyFeeDomesticMRU;
    const intlProfit = internationalFlights.length * pricing.agencyFeeMRU;
    const hotelProfit = hotels.length * pricing.agencyFeeMRU;

    // تجميع الأرباح حسب الشهر
    const monthlyMap: Record<string, { month: string; count: number; profit: number }> = {};
    confirmed.forEach((b) => {
      const monthKey = (b.date || "").substring(0, 7);
      if (!monthKey) return;
      if (!monthlyMap[monthKey]) {
        const [year, month] = monthKey.split("-");
        const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
        monthlyMap[monthKey] = { month: `${monthNames[parseInt(month) - 1]} ${year}`, count: 0, profit: 0 };
      }
      const isDomestic = domesticFlights.includes(b);
      const fee = b.type === "flight"
        ? (isDomestic ? pricing.agencyFeeDomesticMRU : pricing.agencyFeeMRU)
        : pricing.agencyFeeMRU;
      monthlyMap[monthKey].count += 1;
      monthlyMap[monthKey].profit += fee;
    });

    const months = Object.entries(monthlyMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 6)
      .map(([, v]) => v);

    const totalProfit = domesticProfit + intlProfit + hotelProfit;
    const avgMonthlyProfit = months.length > 0 ? months.reduce((s, m) => s + m.profit, 0) / months.length : 0;
    const maxProfit = months.length > 0 ? Math.max(...months.map((m) => m.profit)) : 1;

    const breakdown = [
      { label: "رحلات داخلية", count: domesticFlights.length, profit: domesticProfit, color: "#0a7ea4" },
      { label: "رحلات دولية", count: internationalFlights.length, profit: intlProfit, color: "#1B2B5E" },
      { label: "فنادق", count: hotels.length, profit: hotelProfit, color: "#C4973A" },
    ];

    return { months, totalProfit, avgMonthlyProfit, maxProfit, confirmedCount: confirmed.length, breakdown };
  }, [bookings]);

  const s = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: "#1B2B5E",
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "700",
      color: "#FFFFFF",
      textAlign: "center",
    },
    pinContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 32,
    },
    lockIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: "#1B2B5E",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    pinTitle: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 8,
    },
    pinHint: {
      fontSize: 13,
      color: colors.muted,
      marginBottom: 32,
    },
    pinInput: {
      width: "100%",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 20,
      letterSpacing: 8,
      color: colors.foreground,
      backgroundColor: colors.surface,
      textAlign: "center",
      marginBottom: 12,
    },
    pinError: {
      fontSize: 13,
      color: colors.error,
      marginBottom: 16,
    },
    pinBtn: {
      width: "100%",
      backgroundColor: "#1B2B5E",
      paddingVertical: 15,
      borderRadius: 12,
      alignItems: "center",
    },
    pinBtnText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
    },
    tabRow: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
    },
    tabText: {
      fontSize: 13,
      fontWeight: "600",
    },
    section: {
      padding: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.foreground,
      marginBottom: 12,
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      minWidth: "45%",
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 22,
      fontWeight: "800",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.muted,
    },
    barChart: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    barRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    barLabel: {
      width: 80,
      fontSize: 12,
      color: colors.muted,
    },
    barTrack: {
      flex: 1,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: "hidden",
    },
    barFill: {
      height: "100%",
      borderRadius: 5,
    },
    barValue: {
      width: 30,
      fontSize: 12,
      color: colors.foreground,
      textAlign: "right",
      marginLeft: 8,
    },
    bookingCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bookingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    bookingRef: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
    },
    bookingType: {
      fontSize: 11,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    bookingDate: {
      fontSize: 12,
      color: colors.muted,
    },
    bookingAmount: {
      fontSize: 14,
      fontWeight: "700",
      color: "#C9A84C",
    },
    statusBadge: {
      fontSize: 11,
      fontWeight: "600",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    clientCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    clientAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "#1B2B5E",
      alignItems: "center",
      justifyContent: "center",
    },
    clientAvatarText: {
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: 16,
    },
    clientName: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
    },
    clientEmail: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },
    clientStats: {
      marginTop: 4,
      flexDirection: "row",
      gap: 12,
    },
    clientStatText: {
      fontSize: 12,
      color: colors.muted,
    },
    clientAmount: {
      fontSize: 13,
      fontWeight: "700",
      color: "#C9A84C",
    },
    revenueCard: {
      backgroundColor: "#1B2B5E",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    revenueLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      marginBottom: 4,
    },
    revenueValue: {
      fontSize: 26,
      fontWeight: "800",
      color: "#C9A84C",
    },
    revenueSubLabel: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      marginTop: 2,
    },
    revenueSubValue: {
      fontSize: 13,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  });

  // Show loading while checking auth
  if (!user?.isAdmin) {
    return null;
  }

  const flightPct = stats.total > 0 ? stats.flights / stats.total : 0;
  const hotelPct = stats.total > 0 ? stats.hotels / stats.total : 0;
  const confirmedPct = stats.total > 0 ? stats.confirmed / stats.total : 0;
  const cancelledPct = stats.total > 0 ? stats.cancelled / stats.total : 0;

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} style={{ width: 30 }}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>{t.admin.title}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabRow}>
        {(["overview", "bookings", "clients", "profits"] as const).map((tab) => {
          const active = activeTab === tab;
          const label =
            tab === "overview" ? t.admin.overview :
            tab === "bookings" ? t.admin.bookings :
            tab === "clients" ? t.admin.clients :
            "الأرباح";
          return (
            <Pressable
              key={tab}
              style={s.tab}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, { color: active ? "#1B2B5E" : colors.muted }]}>
                {label}
              </Text>
              {active && (
                <View style={{ height: 2, width: "60%", backgroundColor: "#1B2B5E", borderRadius: 2, marginTop: 4 }} />
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <View style={s.section}>
            {/* Revenue Card */}
            <View style={s.revenueCard}>
              <View>
                <Text style={s.revenueLabel}>{t.admin.totalRevenue}</Text>
                <Text style={s.revenueValue}>{formatMRU(stats.revenue)}</Text>
                <Text style={s.revenueSubLabel}>{t.admin.avgRevenuePerBooking}</Text>
                <Text style={s.revenueSubValue}>{formatMRU(stats.avgRevenue)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <IconSymbol name="crown.fill" size={40} color="#C9A84C" />
                <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 8 }}>
                  {t.admin.topDestination}
                </Text>
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>
                  {stats.topDest}
                </Text>
              </View>
            </View>

            {/* Stats Grid */}
            <Text style={s.sectionTitle}>{t.admin.totalBookings}</Text>
            <View style={s.statsGrid}>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: "#1B2B5E" }]}>
                <Text style={[s.statValue, { color: "#1B2B5E" }]}>{stats.total}</Text>
                <Text style={s.statLabel}>{t.admin.totalBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: "#0a7ea4" }]}>
                <Text style={[s.statValue, { color: "#0a7ea4" }]}>{stats.flights}</Text>
                <Text style={s.statLabel}>{t.admin.flightBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: "#C9A84C" }]}>
                <Text style={[s.statValue, { color: "#C9A84C" }]}>{stats.hotels}</Text>
                <Text style={s.statLabel}>{t.admin.hotelBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: colors.success }]}>
                <Text style={[s.statValue, { color: colors.success }]}>{stats.confirmed}</Text>
                <Text style={s.statLabel}>{t.admin.confirmedBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: colors.error }]}>
                <Text style={[s.statValue, { color: colors.error }]}>{stats.cancelled}</Text>
                <Text style={s.statLabel}>{t.admin.cancelledBookings}</Text>
              </View>
              <View style={[s.statCard, { borderLeftWidth: 3, borderLeftColor: colors.warning }]}>
                <Text style={[s.statValue, { color: colors.warning }]}>{stats.pending}</Text>
                <Text style={s.statLabel}>{t.admin.pendingBookings}</Text>
              </View>
            </View>

            {/* بطاقة إدارة الأسعار */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/pricing" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#1B2B5E", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="tag.fill" size={22} color="#C9A84C" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>إدارة الأسعار</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>رسوم الوكالة وأسعار الصرف</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة إدارة PNR */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/manage-pnr" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#C9A84C", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="paperplane.fill" size={22} color="#1B2B5E" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>إدارة PNR</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تحديث رموز الحجز الحقيقية للزبائن</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة تتبع الطلبات */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/update-status" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="checkmark.circle.fill" size={22} color="#FFFFFF" />
                </View>
                <View>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>تتبع الطلبات</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تحديث حالة الحجوزات وإشعار الزبائن</Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* بطاقة تأكيد الدفع */}
            <Pressable
              style={[s.barChart, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }]}
              onPress={() => router.push("/admin/confirm-payment" as any)}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#22C55E", alignItems: "center", justifyContent: "center" }}>
                  <IconSymbol name="checkmark.seal.fill" size={22} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.sectionTitle, { marginBottom: 2 }]}>تأكيد الدفع</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>تأكيد دفع الحجوزات وإرسال تأكيد للزبون</Text>
                </View>
                {(() => {
                  const pendingCount = bookings.filter((b) => b.status !== "cancelled" && b.status !== "confirmed").length;
                  const cashPending = bookings.filter((b) => b.status === "confirmed" && b.paymentDeadline && new Date(b.paymentDeadline).getTime() > Date.now()).length;
                  const total = pendingCount + cashPending;
                  if (total === 0) return null;
                  return (
                    <View style={{ backgroundColor: "#EF4444", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginRight: 8 }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{total}</Text>
                    </View>
                  );
                })()}
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.muted} />
            </Pressable>

            {/* Distribution Bar Chart */}
            <Text style={s.sectionTitle}>{t.admin.revenue}</Text>
            <View style={s.barChart}>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{t.admin.flightBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${flightPct * 100}%`, backgroundColor: "#0a7ea4" }]} />
                </View>
                <Text style={s.barValue}>{stats.flights}</Text>
              </View>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{t.admin.hotelBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${hotelPct * 100}%`, backgroundColor: "#C9A84C" }]} />
                </View>
                <Text style={s.barValue}>{stats.hotels}</Text>
              </View>
              <View style={s.barRow}>
                <Text style={s.barLabel}>{t.admin.confirmedBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${confirmedPct * 100}%`, backgroundColor: "#22C55E" }]} />
                </View>
                <Text style={s.barValue}>{stats.confirmed}</Text>
              </View>
              <View style={[s.barRow, { marginBottom: 0 }]}>
                <Text style={s.barLabel}>{t.admin.cancelledBookings}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${cancelledPct * 100}%`, backgroundColor: "#EF4444" }]} />
                </View>
                <Text style={s.barValue}>{stats.cancelled}</Text>
              </View>
            </View>
          </View>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t.admin.recentBookings} ({bookings.length})</Text>
            {bookings.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32 }}>{t.admin.noBookings}</Text>
            ) : (
              bookings.slice().reverse().map((b) => {
                const statusColor =
                  b.status === "confirmed" ? colors.success :
                  b.status === "cancelled" ? colors.error :
                  colors.warning;
                const typeColor = b.type === "flight" ? "#0a7ea4" : "#C9A84C";
                const dest = b.flight
                  ? `${b.flight.originCode} → ${b.flight.destinationCode}`
                  : b.hotel?.name ?? "—";
                return (
                  <View key={b.id} style={s.bookingCard}>
                    <View style={s.bookingRow}>
                      <Text style={s.bookingRef}>{b.reference}</Text>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <Text style={[s.bookingType, { backgroundColor: typeColor + "20", color: typeColor }]}>
                          {b.type === "flight" ? t.admin.flight : t.admin.hotel}
                        </Text>
                        <Text style={[s.statusBadge, { backgroundColor: statusColor + "20", color: statusColor }]}>
                          {b.status === "confirmed" ? t.admin.confirmed :
                           b.status === "cancelled" ? t.admin.cancelled : t.admin.pending}
                        </Text>
                      </View>
                    </View>
                    <View style={s.bookingRow}>
                      <Text style={s.bookingDate}>{dest}</Text>
                      <Text style={s.bookingAmount}>{formatMRU(b.totalPrice ?? 0)}</Text>
                    </View>
                    <Text style={[s.bookingDate, { marginTop: 2 }]}>{b.date}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* CLIENTS TAB */}
        {activeTab === "clients" && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t.admin.allClients} ({clients.length})</Text>
            {clients.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32 }}>{t.admin.noBookings}</Text>
            ) : (
              clients.map((c, i) => (
                <View key={c.name + i} style={s.clientCard}>
                  <View style={s.clientAvatar}>
                    <Text style={s.clientAvatarText}>
                      {c.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.clientName}>{c.name}</Text>
                    <Text style={s.clientEmail}>{c.email}</Text>
                    <View style={s.clientStats}>
                      <Text style={s.clientStatText}>
                        {c.bookings.length} {t.admin.bookingsCount}
                      </Text>
                      <Text style={s.clientAmount}>
                        {formatMRU(c.totalSpent)}
                      </Text>
                    </View>
                    <Text style={[s.clientStatText, { marginTop: 2 }]}>
                      {t.admin.lastBooking}: {c.lastBooking}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* PROFITS TAB */}
        {activeTab === "profits" && (
          <View style={s.section}>
            {/* بطاقات الملخص */}
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
              <View style={[s.statCard, { flex: 1, backgroundColor: "#1B2B5E" }]}>
                <Text style={[s.statLabel, { color: "rgba(255,255,255,0.7)" }]}>إجمالي الأرباح</Text>
                <Text style={[s.statValue, { color: "#FFFFFF" }]}>{formatMRU(profitStats.totalProfit)}</Text>
              </View>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statLabel}>متوسط شهري</Text>
                <Text style={s.statValue}>{formatMRU(Math.round(profitStats.avgMonthlyProfit))}</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statLabel}>حجوزات مؤكدة</Text>
                <Text style={s.statValue}>{profitStats.confirmedCount}</Text>
              </View>
              <View style={[s.statCard, { flex: 1 }]}>
                <Text style={s.statLabel}>رسوم لكل حجز</Text>
                <Text style={s.statValue}>{formatMRU(getPricingSettings().agencyFeeMRU)}</Text>
              </View>
            </View>

            {/* مخطط الأرباح الشهرية */}
            <Text style={s.sectionTitle}>الأرباح الشهرية (6 أشهر)</Text>
            {profitStats.months.length === 0 ? (
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 32, marginBottom: 32 }}>
                لا توجد حجوزات مؤكدة بعد
              </Text>
            ) : (
              profitStats.months.map((m, i) => {
                const barWidth = profitStats.maxProfit > 0 ? (m.profit / profitStats.maxProfit) * 100 : 0;
                return (
                  <View key={i} style={[s.bookingCard, { marginBottom: 10 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{m.month}</Text>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: "#1B2B5E", fontWeight: "700", fontSize: 15 }}>{formatMRU(m.profit)}</Text>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{m.count} حجز</Text>
                      </View>
                    </View>
                    {/* شريط التقدم */}
                    <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                      <View style={{ height: 8, width: `${barWidth}%`, backgroundColor: "#1B2B5E", borderRadius: 4 }} />
                    </View>
                  </View>
                );
              })
            )}

            {/* تفصيل حسب نوع الحجز */}
            <Text style={[s.sectionTitle, { marginTop: 20 }]}>تفصيل حسب نوع الحجز</Text>
            {profitStats.breakdown.map((item, i) => (
              <View key={i} style={[s.bookingCard, { marginBottom: 10 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                    <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{item.label}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: item.color, fontWeight: "700", fontSize: 15 }}>{formatMRU(item.profit)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>{item.count} حجز</Text>
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
                  <View style={{
                    height: 6,
                    width: profitStats.totalProfit > 0 ? `${(item.profit / profitStats.totalProfit) * 100}%` : "0%",
                    backgroundColor: item.color,
                    borderRadius: 3
                  }} />
                </View>
              </View>
            ))}

            {/* أزرار الإجراءات */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#22C55E",
                  opacity: pressed ? 0.85 : 1,
                }]}
                onPress={() => router.push("/admin/profit-report" as any)}
              >
                <IconSymbol name="doc.text.fill" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>تصدير PDF</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: 14,
                  borderRadius: 14,
                  backgroundColor: "#0a7ea4",
                  opacity: pressed ? 0.85 : 1,
                }]}
                onPress={() => router.push("/admin/pricing" as any)}
              >
                <IconSymbol name="slider.horizontal.3" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>إدارة الأسعار</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}
