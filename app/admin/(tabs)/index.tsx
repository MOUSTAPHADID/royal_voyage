import React, { useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: {
    title: "لوحة التحكم",
    welcome: "مرحباً",
    totalBookings: "إجمالي الحجوزات",
    pendingPayments: "بانتظار التأكيد",
    confirmedToday: "مؤكدة اليوم",
    totalRevenue: "الإيرادات",
    recentBookings: "آخر الحجوزات",
    noBookings: "لا توجد حجوزات بعد",
    viewAll: "عرض الكل",
    quickActions: "إجراءات سريعة",
    manageBookings: "الحجوزات",
    manageEmployees: "الموظفون",
    reports: "التقارير",
    settings: "الإعدادات",
    confirmed: "مؤكد",
    pending: "معلق",
    mru: "أوق",
  },
  fr: {
    title: "Tableau de bord",
    welcome: "Bonjour",
    totalBookings: "Total réservations",
    pendingPayments: "En attente",
    confirmedToday: "Confirmées auj.",
    totalRevenue: "Revenus",
    recentBookings: "Dernières réservations",
    noBookings: "Aucune réservation",
    viewAll: "Voir tout",
    quickActions: "Actions rapides",
    manageBookings: "Réservations",
    manageEmployees: "Employés",
    reports: "Rapports",
    settings: "Paramètres",
    confirmed: "Confirmé",
    pending: "En attente",
    mru: "MRU",
  },
};

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { employee, language } = useAdmin();
  const t = T[language];
  const isRTL = language === "ar";

  const { data: bookingsData, isLoading } = trpc.bookingContacts.list.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const stats = useMemo(() => {
    const all = bookingsData ?? [];
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: all.length,
      pending: all.filter((b: any) => !b.pnr).length,
      confirmedToday: all.filter((b: any) => b.pnr && b.createdAt?.toString().slice(0, 10) === today).length,
      revenue: all.filter((b: any) => b.pnr).reduce((sum: any, b: any) => {
        const price = parseFloat((b as any).totalPrice ?? "0");
        return sum + (isNaN(price) ? 0 : price);
      }, 0),
    };
  }, [bookingsData]);

  const recentBookings = useMemo(() => (bookingsData ?? []).slice(0, 8), [bookingsData]);

  const quickActions = [
    { icon: "calendar.badge.checkmark" as const, label: t.manageBookings, route: "/(tabs)/bookings" },
    { icon: "person.3.fill" as const, label: t.manageEmployees, route: "/(tabs)/employees" },
    { icon: "chart.bar.fill" as const, label: t.reports, route: "/(tabs)/reports" },
    { icon: "gear" as const, label: t.settings, route: "/(tabs)/settings" },
  ];

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.headerWelcome}>{t.welcome}, {employee?.name?.split(" ")[0] ?? "Admin"}</Text>
            <Text style={styles.headerTitle}>{t.title}</Text>
          </View>
          <View style={[styles.avatarCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
            <Text style={styles.avatarText}>{(employee?.name ?? "A").charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* KPI Cards */}
          <View style={styles.kpiGrid}>
            {[
              { label: t.totalBookings, value: String(stats.total), icon: "calendar.badge.checkmark" as const, color: colors.primary },
              { label: t.pendingPayments, value: String(stats.pending), icon: "clock.fill" as const, color: "#F59E0B" },
              { label: t.confirmedToday, value: String(stats.confirmedToday), icon: "checkmark.circle.fill" as const, color: "#22C55E" },
              { label: t.totalRevenue, value: `${stats.revenue.toLocaleString()} ${t.mru}`, icon: "banknote.fill" as const, color: "#8B5CF6" },
            ].map((kpi) => (
              <View key={kpi.label} style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.kpiIcon, { backgroundColor: kpi.color + "18" }]}>
                  <IconSymbol name={kpi.icon} size={20} color={kpi.color} />
                </View>
                <Text style={[styles.kpiValue, { color: colors.foreground }]} numberOfLines={1}>{kpi.value}</Text>
                <Text style={[styles.kpiLabel, { color: colors.muted }]} numberOfLines={2}>{kpi.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {t.quickActions}
            </Text>
            <View style={styles.actionsGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.route}
                  style={[styles.actionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.primary + "15" }]}>
                    <IconSymbol name={action.icon} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sectionHeader, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.recentBookings}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/bookings" as any)}>
                <Text style={[styles.viewAll, { color: colors.primary }]}>{t.viewAll}</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingRow}>
                {[1, 2, 3].map(i => (
                  <View key={i} style={[styles.skeletonRow, { backgroundColor: colors.border }]} />
                ))}
              </View>
            ) : recentBookings.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noBookings}</Text>
            ) : (
              recentBookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={[styles.bookingRow, { borderBottomColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/booking-detail/[id]" as any, params: { id: booking.duffelOrderId } })}
                  activeOpacity={0.7}
                >
                  <View style={[styles.bookingIcon, { backgroundColor: colors.primary + "15" }]}>
                    <IconSymbol name="airplane" size={16} color={colors.primary} />
                  </View>
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.bookingName, { color: colors.foreground }]} numberOfLines={1}>
                      {(booking as any).passengerName ?? "—"}
                    </Text>
                    <Text style={[styles.bookingRef, { color: colors.muted }]}>
                      {(booking as any).bookingRef ?? "—"} • {(booking as any).routeSummary ?? ""}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: (booking.pnr ? "#22C55E" : "#F59E0B") + "20" }]}>
                    <Text style={[styles.statusText, { color: booking.pnr ? "#22C55E" : "#F59E0B" }]}>
                      {booking.pnr ? t.confirmed : t.pending}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 24 },
  headerWelcome: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  headerTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  content: { padding: 16, gap: 16 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpiCard: { flex: 1, minWidth: "45%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  kpiValue: { fontSize: 18, fontWeight: "800" },
  kpiLabel: { fontSize: 11, lineHeight: 15 },
  section: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  sectionHeader: { justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 15, fontWeight: "700" },
  viewAll: { fontSize: 13, fontWeight: "600" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { flex: 1, minWidth: "44%", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, gap: 8 },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  loadingRow: { gap: 10 },
  skeletonRow: { height: 52, borderRadius: 10 },
  emptyText: { textAlign: "center", fontSize: 14, paddingVertical: 16 },
  bookingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, gap: 10 },
  bookingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  bookingInfo: { flex: 1 },
  bookingName: { fontSize: 14, fontWeight: "600" },
  bookingRef: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "600" },
});
