import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { Booking } from "@/lib/mock-data";
import { useCurrency } from "@/lib/currency-context";
import { toMRUWithSettings, getAgencyFee, getMarkupPercent, applyMarkup } from "@/lib/pricing-settings";
import { usePricingSettings } from "@/hooks/use-pricing-settings";

type FilterClass = "all" | "economy" | "business" | "first";

function normalizeClassLabel(cls?: string): string {
  if (!cls) return "اقتصادي";
  const c = cls.toUpperCase();
  if (c.includes("FIRST")) return "أولى";
  if (c.includes("BUSINESS")) return "أعمال";
  return "اقتصادي";
}

function normalizeClassKey(cls?: string): "economy" | "business" | "first" {
  if (!cls) return "economy";
  const c = cls.toUpperCase();
  if (c.includes("FIRST")) return "first";
  if (c.includes("BUSINESS")) return "business";
  return "economy";
}

export default function PriceComparisonScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const { fmt } = useCurrency();
  const pricing = usePricingSettings();
  const [filterClass, setFilterClass] = useState<FilterClass>("all");

  // Only flight bookings with price data
  const flightBookings = useMemo(() => {
    return bookings
      .filter((b: Booking) => b.type === "flight" && b.flight && b.totalPrice > 0)
      .sort((a: Booking, b: Booking) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (filterClass === "all") return flightBookings;
    return flightBookings.filter((b: Booking) => normalizeClassKey(b.flight?.class) === filterClass);
  }, [flightBookings, filterClass]);

  // Summary stats
  const stats = useMemo(() => {
    let totalOriginal = 0;
    let totalDisplayed = 0;
    let totalProfit = 0;
    let count = 0;

    filteredBookings.forEach((b: Booking) => {
      if (!b.flight) return;
      const currency = b.flight.currency || b.currency || "EUR";
      const originalMRU = toMRUWithSettings(b.flight.price, currency);
      const agencyFee = getAgencyFee(b.flight.originCode, b.flight.destinationCode);
      const baseMRU = originalMRU + agencyFee;
      const displayedMRU = applyMarkup(baseMRU, b.flight.originCode, b.flight.destinationCode, b.flight.class);
      const profit = displayedMRU - originalMRU;

      totalOriginal += originalMRU;
      totalDisplayed += displayedMRU;
      totalProfit += profit;
      count++;
    });

    const avgMarkup = totalOriginal > 0 ? ((totalProfit / totalOriginal) * 100) : 0;

    return { totalOriginal, totalDisplayed, totalProfit, count, avgMarkup };
  }, [filteredBookings]);

  const classFilters: { key: FilterClass; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "economy", label: "اقتصادي" },
    { key: "business", label: "أعمال" },
    { key: "first", label: "أولى" },
  ];

  const renderBooking = ({ item }: { item: Booking }) => {
    if (!item.flight) return null;
    const currency = item.flight.currency || item.currency || "EUR";
    const originalMRU = toMRUWithSettings(item.flight.price, currency);
    const agencyFee = getAgencyFee(item.flight.originCode, item.flight.destinationCode);
    const baseMRU = originalMRU + agencyFee;
    const markupPct = getMarkupPercent(item.flight.originCode, item.flight.destinationCode, item.flight.class);
    const displayedMRU = applyMarkup(baseMRU, item.flight.originCode, item.flight.destinationCode, item.flight.class);
    const profit = displayedMRU - originalMRU;

    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header: Route + Date */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.route, { color: colors.foreground }]}>
              {item.flight.originCode} → {item.flight.destinationCode}
            </Text>
            <Text style={[styles.meta, { color: colors.muted }]}>
              {item.flight.airline} · {normalizeClassLabel(item.flight.class)} · {new Date(item.date).toLocaleDateString("ar-SA", { day: "2-digit", month: "short" })}
            </Text>
          </View>
          <View style={[styles.classBadge, { backgroundColor: normalizeClassKey(item.flight.class) === "first" ? "#FFD700" + "25" : normalizeClassKey(item.flight.class) === "business" ? colors.primary + "20" : colors.success + "15" }]}>
            <Text style={[styles.classBadgeText, { color: normalizeClassKey(item.flight.class) === "first" ? "#B8860B" : normalizeClassKey(item.flight.class) === "business" ? colors.primary : colors.success }]}>
              {normalizeClassLabel(item.flight.class)}
            </Text>
          </View>
        </View>

        {/* Price comparison row */}
        <View style={styles.priceRow}>
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: colors.muted }]}>سعر Duffel</Text>
            <Text style={[styles.priceValue, { color: colors.foreground }]}>{fmt(originalMRU)}</Text>
          </View>
          <View style={styles.arrowCol}>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: colors.muted }]}>رسوم الوكالة</Text>
            <Text style={[styles.priceValue, { color: colors.warning }]}>+{fmt(agencyFee)}</Text>
          </View>
          <View style={styles.arrowCol}>
            <IconSymbol name="chevron.right" size={16} color={colors.muted} />
          </View>
          <View style={styles.priceCol}>
            <Text style={[styles.priceLabel, { color: colors.muted }]}>السعر المعروض</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>{fmt(displayedMRU)}</Text>
          </View>
        </View>

        {/* Profit bar */}
        <View style={[styles.profitBar, { backgroundColor: colors.success + "12" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <IconSymbol name="chart.line.uptrend.xyaxis" size={14} color={colors.success} />
            <Text style={[styles.profitText, { color: colors.success }]}>
              الربح: {fmt(profit)}
            </Text>
          </View>
          <Text style={[styles.profitPercent, { color: colors.success }]}>
            +{markupPct}%
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>تقرير مقارنة الأسعار</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>سعر Duffel الأصلي</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{fmt(stats.totalOriginal)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>السعر المعروض</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{fmt(stats.totalDisplayed)}</Text>
        </View>
      </View>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
          <Text style={[styles.summaryLabel, { color: colors.success }]}>إجمالي الربح</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]}>{fmt(stats.totalProfit)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
          <Text style={[styles.summaryLabel, { color: colors.primary }]}>متوسط الهامش</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{stats.avgMarkup.toFixed(1)}%</Text>
        </View>
      </View>

      {/* Class filter */}
      <View style={styles.filterRow}>
        {classFilters.map((f) => (
          <Pressable
            key={f.key}
            style={[
              styles.filterBtn,
              {
                backgroundColor: filterClass === f.key ? colors.primary : colors.surface,
                borderColor: filterClass === f.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilterClass(f.key)}
          >
            <Text style={[styles.filterBtnText, { color: filterClass === f.key ? "#FFFFFF" : colors.foreground }]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Bookings count */}
      <Text style={[styles.countText, { color: colors.muted }]}>
        {stats.count} حجز رحلة
      </Text>

      {/* Bookings list */}
      {filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="doc.text.magnifyingglass" size={48} color={colors.muted} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>لا توجد حجوزات رحلات بعد</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 14,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  countText: {
    fontSize: 12,
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  route: {
    fontSize: 16,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    marginTop: 2,
  },
  classBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  priceCol: {
    flex: 1,
    alignItems: "center",
  },
  arrowCol: {
    paddingHorizontal: 2,
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  profitBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  profitText: {
    fontSize: 13,
    fontWeight: "600",
  },
  profitPercent: {
    fontSize: 14,
    fontWeight: "800",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
