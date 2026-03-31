import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { formatMRU } from "@/lib/currency";

type Period = "today" | "week" | "month" | "year" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  today: "اليوم",
  week: "هذا الأسبوع",
  month: "هذا الشهر",
  year: "هذا العام",
  all: "الكل",
};

export default function FinancialReportsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const [period, setPeriod] = useState<Period>("month");

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter((b) => {
      if (period === "all") return true;
      const bookingDate = new Date(b.date);
      switch (period) {
        case "today":
          return bookingDate.toDateString() === now.toDateString();
        case "week": {
          const weekAgo = new Date(now);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return bookingDate >= weekAgo;
        }
        case "month": {
          return (
            bookingDate.getMonth() === now.getMonth() &&
            bookingDate.getFullYear() === now.getFullYear()
          );
        }
        case "year":
          return bookingDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [bookings, period]);

  const stats = useMemo(() => {
    const confirmed = filteredBookings.filter((b) => b.paymentConfirmed);
    const pending = filteredBookings.filter((b) => b.status === "pending" && !b.paymentConfirmed);
    const cancelled = filteredBookings.filter((b) => b.status === "cancelled");
    const flights = filteredBookings.filter((b) => b.type === "flight");
    const hotels = filteredBookings.filter((b) => b.type === "hotel");

    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalPrice, 0);
    const pendingRevenue = pending.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalCommission = confirmed
      .filter((b) => b.commissionAmount && b.commissionAmount > 0)
      .reduce((sum, b) => sum + (b.commissionAmount || 0), 0);

    // Payment method breakdown
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    confirmed.forEach((b) => {
      const method = b.paymentMethod || "unknown";
      if (!paymentMethods[method]) paymentMethods[method] = { count: 0, amount: 0 };
      paymentMethods[method].count++;
      paymentMethods[method].amount += b.totalPrice;
    });

    // Daily breakdown for chart
    const dailyRevenue: Record<string, number> = {};
    confirmed.forEach((b) => {
      const day = b.date;
      dailyRevenue[day] = (dailyRevenue[day] || 0) + b.totalPrice;
    });

    // Business account revenue
    const businessRevenue = confirmed
      .filter((b) => b.businessAccountId)
      .reduce((sum, b) => sum + b.totalPrice, 0);

    return {
      totalBookings: filteredBookings.length,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      cancelledCount: cancelled.length,
      flightCount: flights.length,
      hotelCount: hotels.length,
      totalRevenue,
      pendingRevenue,
      totalCommission,
      paymentMethods,
      dailyRevenue,
      businessRevenue,
      avgBookingValue: confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0,
    };
  }, [filteredBookings]);

  const PAYMENT_METHOD_LABELS: Record<string, string> = {
    cash: "نقدي (مكتب)",
    bank_transfer: "تحويل بنكي",
    bankily: "بنكيلي",
    masrvi: "مصرفي",
    sedad: "سداد",
    hold_24h: "حجز مؤكد 24 ساعة",
    unknown: "غير محدد",
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.right" size={20} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>التقارير المالية</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodRow}
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <Pressable
              key={p}
              style={[
                styles.periodBtn,
                {
                  backgroundColor: period === p ? colors.primary : colors.surface,
                  borderColor: period === p ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  { color: period === p ? "#FFFFFF" : colors.foreground },
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Summary Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: "#DCFCE7", borderColor: "#22C55E30" }]}>
            <Text style={{ fontSize: 22 }}>💰</Text>
            <Text style={[styles.summaryValue, { color: "#16A34A" }]}>{formatMRU(stats.totalRevenue)}</Text>
            <Text style={[styles.summaryLabel, { color: "#166534" }]}>إجمالي الإيرادات</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#FEF3C7", borderColor: "#F59E0B30" }]}>
            <Text style={{ fontSize: 22 }}>⏳</Text>
            <Text style={[styles.summaryValue, { color: "#D97706" }]}>{formatMRU(stats.pendingRevenue)}</Text>
            <Text style={[styles.summaryLabel, { color: "#92400E" }]}>في الانتظار</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#E0F2FE", borderColor: "#0EA5E930" }]}>
            <Text style={{ fontSize: 22 }}>🏢</Text>
            <Text style={[styles.summaryValue, { color: "#0284C7" }]}>{formatMRU(stats.businessRevenue)}</Text>
            <Text style={[styles.summaryLabel, { color: "#075985" }]}>إيرادات تجارية</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#FCE7F3", borderColor: "#EC489930" }]}>
            <Text style={{ fontSize: 22 }}>📊</Text>
            <Text style={[styles.summaryValue, { color: "#BE185D" }]}>{formatMRU(stats.totalCommission)}</Text>
            <Text style={[styles.summaryLabel, { color: "#9D174D" }]}>العمولات</Text>
          </View>
        </View>

        {/* Booking Stats */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>إحصائيات الحجوزات</Text>
          <View style={styles.statsGrid}>
            {[
              { label: "إجمالي الحجوزات", value: stats.totalBookings, color: colors.primary },
              { label: "مؤكدة", value: stats.confirmedCount, color: "#22C55E" },
              { label: "في الانتظار", value: stats.pendingCount, color: "#F59E0B" },
              { label: "ملغاة", value: stats.cancelledCount, color: "#EF4444" },
              { label: "رحلات طيران", value: stats.flightCount, color: "#3B82F6" },
              { label: "فنادق", value: stats.hotelCount, color: "#8B5CF6" },
            ].map((item) => (
              <View key={item.label} style={styles.statItem}>
                <Text style={[styles.statItemValue, { color: item.color }]}>{item.value}</Text>
                <Text style={[styles.statItemLabel, { color: colors.muted }]}>{item.label}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.avgBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.avgLabel, { color: colors.muted }]}>متوسط قيمة الحجز</Text>
            <Text style={[styles.avgValue, { color: colors.primary }]}>{formatMRU(stats.avgBookingValue)}</Text>
          </View>
        </View>

        {/* Payment Methods Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>توزيع طرق الدفع</Text>
          {Object.entries(stats.paymentMethods).length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد بيانات</Text>
          ) : (
            Object.entries(stats.paymentMethods)
              .sort((a, b) => b[1].amount - a[1].amount)
              .map(([method, data]) => {
                const pct = stats.totalRevenue > 0 ? Math.round((data.amount / stats.totalRevenue) * 100) : 0;
                return (
                  <View key={method} style={[styles.methodRow, { borderBottomColor: colors.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.methodName, { color: colors.foreground }]}>
                        {PAYMENT_METHOD_LABELS[method] || method}
                      </Text>
                      <Text style={[styles.methodCount, { color: colors.muted }]}>
                        {data.count} حجز
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={[styles.methodAmount, { color: colors.foreground }]}>
                        {formatMRU(data.amount)}
                      </Text>
                      <View style={[styles.pctBadge, { backgroundColor: colors.primary + "15" }]}>
                        <Text style={[styles.pctText, { color: colors.primary }]}>{pct}%</Text>
                      </View>
                    </View>
                  </View>
                );
              })
          )}
        </View>

        {/* Daily Revenue */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>الإيرادات اليومية</Text>
          {Object.entries(stats.dailyRevenue).length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد بيانات</Text>
          ) : (
            Object.entries(stats.dailyRevenue)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 14)
              .map(([day, amount]) => {
                const maxAmount = Math.max(...Object.values(stats.dailyRevenue));
                const barWidth = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 5) : 5;
                return (
                  <View key={day} style={styles.dailyRow}>
                    <Text style={[styles.dailyDate, { color: colors.muted }]}>
                      {new Date(day).toLocaleDateString("ar-SA", { month: "short", day: "numeric" })}
                    </Text>
                    <View style={styles.dailyBarContainer}>
                      <View
                        style={[
                          styles.dailyBar,
                          { width: `${barWidth}%`, backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                    <Text style={[styles.dailyAmount, { color: colors.foreground }]}>
                      {formatMRU(amount)}
                    </Text>
                  </View>
                );
              })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  periodRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  statItem: {
    width: "30%",
    alignItems: "center",
    paddingVertical: 8,
  },
  statItemValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  statItemLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  avgBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  avgLabel: {
    fontSize: 13,
  },
  avgValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "600",
  },
  methodCount: {
    fontSize: 12,
    marginTop: 2,
  },
  methodAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  pctText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    paddingVertical: 20,
  },
  dailyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  dailyDate: {
    fontSize: 12,
    width: 50,
    textAlign: "right",
  },
  dailyBarContainer: {
    flex: 1,
    height: 20,
    borderRadius: 4,
    overflow: "hidden",
  },
  dailyBar: {
    height: "100%",
    borderRadius: 4,
    opacity: 0.7,
  },
  dailyAmount: {
    fontSize: 12,
    fontWeight: "600",
    width: 80,
    textAlign: "left",
  },
});
