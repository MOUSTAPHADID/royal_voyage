import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: { title: "التقارير المالية", totalRevenue: "إجمالي الإيرادات", totalBookings: "إجمالي الحجوزات", confirmedBookings: "حجوزات مؤكدة", pendingBookings: "حجوزات معلقة", avgTicket: "متوسط قيمة التذكرة", conversionRate: "معدل التحويل", mru: "أوق", thisMonth: "هذا الشهر", allTime: "الكل" },
  fr: { title: "Rapports financiers", totalRevenue: "Revenus totaux", totalBookings: "Total réservations", confirmedBookings: "Réservations confirmées", pendingBookings: "En attente", avgTicket: "Valeur moy. billet", conversionRate: "Taux de conversion", mru: "MRU", thisMonth: "Ce mois", allTime: "Tout" },
};

export default function ReportsScreen() {
  const colors = useColors();
  const { language } = useAdmin();
  const t = T[language];

  const { data: bookingsData, isLoading } = trpc.bookingContacts.list.useQuery();

  const stats = useMemo(() => {
    const all = bookingsData ?? [];
    const confirmed = all.filter(b => !!b.pnr);
    const revenue = confirmed.reduce((sum, b) => sum + parseFloat((b as any).totalPrice ?? "0"), 0);
    const avg = confirmed.length > 0 ? revenue / confirmed.length : 0;
    const conversion = all.length > 0 ? (confirmed.length / all.length) * 100 : 0;
    const now = new Date();
    const thisMonth = all.filter(b => {
      const d = new Date(b.createdAt ?? "");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthRevenue = thisMonth.filter(b => !!b.pnr).reduce((sum, b) => sum + parseFloat((b as any).totalPrice ?? "0"), 0);
    return { total: all.length, confirmed: confirmed.length, pending: all.length - confirmed.length, revenue, avg, conversion, thisMonth: thisMonth.length, monthRevenue };
  }, [bookingsData]);

  const metrics = [
    { label: t.totalRevenue, value: `${stats.revenue.toLocaleString()} ${t.mru}`, icon: "banknote.fill" as const, color: "#8B5CF6" },
    { label: t.totalBookings, value: String(stats.total), icon: "calendar.badge.checkmark" as const, color: colors.primary },
    { label: t.confirmedBookings, value: String(stats.confirmed), icon: "checkmark.circle.fill" as const, color: "#22C55E" },
    { label: t.pendingBookings, value: String(stats.pending), icon: "clock.fill" as const, color: "#F59E0B" },
    { label: t.avgTicket, value: `${Math.round(stats.avg).toLocaleString()} ${t.mru}`, icon: "chart.line.uptrend.xyaxis" as const, color: "#3B82F6" },
    { label: t.conversionRate, value: `${stats.conversion.toFixed(1)}%`, icon: "percent" as const, color: "#EC4899" },
  ];

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t.title}</Text>
      </View>
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* This month highlight */}
          <View style={[styles.highlight, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
            <IconSymbol name="calendar" size={20} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.highlightLabel, { color: colors.muted }]}>{t.thisMonth}</Text>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>{stats.thisMonth} {language === "ar" ? "حجز" : "réservations"} • {stats.monthRevenue.toLocaleString()} {t.mru}</Text>
            </View>
          </View>

          <View style={styles.grid}>
            {metrics.map(m => (
              <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.metricIcon, { backgroundColor: m.color + "18" }]}>
                  <IconSymbol name={m.icon} size={20} color={m.color} />
                </View>
                <Text style={[styles.metricValue, { color: colors.foreground }]} numberOfLines={1}>{m.value}</Text>
                <Text style={[styles.metricLabel, { color: colors.muted }]} numberOfLines={2}>{m.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { padding: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, gap: 16 },
  highlight: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 14, borderWidth: 1 },
  highlightLabel: { fontSize: 12 },
  highlightValue: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { flex: 1, minWidth: "45%", borderRadius: 14, padding: 14, borderWidth: 1, gap: 6 },
  metricIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  metricValue: { fontSize: 17, fontWeight: "800" },
  metricLabel: { fontSize: 11, lineHeight: 15 },
});
