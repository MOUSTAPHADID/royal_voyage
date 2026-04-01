import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useApp } from "@/lib/app-context";
import { formatMRU } from "@/lib/currency";
import { getPricingSettings } from "@/lib/pricing-settings";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";

const MR_AIRPORTS = ["NKC","NDB","ATR","KFA","MOM","OUZ","SEY","THI","TMD","ZLG","AEO","EMN","LEG","MBR","OGJ"];
const OFFICE_ID = "NKC26239A";

function isDomestic(originCode?: string, destCode?: string) {
  return MR_AIRPORTS.includes((originCode || "").toUpperCase()) && MR_AIRPORTS.includes((destCode || "").toUpperCase());
}

const MONTH_NAMES = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAY_NAMES = ["الأحد","الإثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  bankily: { label: "بنكيلي", color: "#F59E0B", icon: "📱" },
  masrvi: { label: "مصرفي", color: "#8B5CF6", icon: "💳" },
  sedad: { label: "سداد", color: "#EF4444", icon: "🔐" },
  cash: { label: "نقداً", color: "#22C55E", icon: "💵" },
  bank_transfer: { label: "تحويل بنكي", color: "#3B82F6", icon: "🏦" },
  paypal: { label: "PayPal", color: "#003087", icon: "🌐" },
  multicaixa: { label: "Multicaixa Express", color: "#E31937", icon: "🇦🇴" },
};

type ViewMode = "daily" | "monthly";

export default function SalesReportsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [generating, setGenerating] = useState(false);

  const pricing = getPricingSettings();

  // All confirmed bookings
  const confirmedBookings = useMemo(() =>
    bookings.filter(b => b.status === "confirmed" || b.status === "airline_confirmed"),
    [bookings]
  );

  // Daily report data
  const dailyData = useMemo(() => {
    const dayMap: Record<string, {
      date: string;
      label: string;
      dayName: string;
      flights: number;
      hotels: number;
      total: number;
      revenue: number;
      profit: number;
    }> = {};

    confirmedBookings.forEach(b => {
      const dateKey = (b.date || "").substring(0, 10);
      if (!dateKey) return;

      if (!dayMap[dateKey]) {
        const d = new Date(dateKey);
        const dayIdx = d.getDay();
        const monthIdx = d.getMonth();
        dayMap[dateKey] = {
          date: dateKey,
          label: `${d.getDate()} ${MONTH_NAMES[monthIdx]} ${d.getFullYear()}`,
          dayName: DAY_NAMES[dayIdx],
          flights: 0,
          hotels: 0,
          total: 0,
          revenue: 0,
          profit: 0,
        };
      }

      const entry = dayMap[dateKey];
      entry.total += 1;
      entry.revenue += b.totalPrice ?? 0;

      if (b.type === "flight") {
        entry.flights += 1;
        const dom = isDomestic(b.flight?.originCode, b.flight?.destinationCode);
        entry.profit += dom ? pricing.agencyFeeDomesticMRU : pricing.agencyFeeMRU;
      } else {
        entry.hotels += 1;
        entry.profit += pricing.agencyFeeMRU;
      }
    });

    return Object.values(dayMap).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  }, [confirmedBookings, pricing]);

  // Monthly report data
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, {
      key: string;
      label: string;
      flights: number;
      hotels: number;
      domesticFlights: number;
      internationalFlights: number;
      total: number;
      revenue: number;
      profit: number;
      paymentMethods: Record<string, { count: number; amount: number }>;
    }> = {};

    confirmedBookings.forEach(b => {
      const monthKey = (b.date || "").substring(0, 7);
      if (!monthKey) return;

      if (!monthMap[monthKey]) {
        const [year, month] = monthKey.split("-");
        monthMap[monthKey] = {
          key: monthKey,
          label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`,
          flights: 0,
          hotels: 0,
          domesticFlights: 0,
          internationalFlights: 0,
          total: 0,
          revenue: 0,
          profit: 0,
          paymentMethods: {},
        };
      }

      const entry = monthMap[monthKey];
      entry.total += 1;
      entry.revenue += b.totalPrice ?? 0;

      const pm = b.paymentMethod || "cash";
      if (!entry.paymentMethods[pm]) entry.paymentMethods[pm] = { count: 0, amount: 0 };
      entry.paymentMethods[pm].count += 1;
      entry.paymentMethods[pm].amount += b.totalPrice ?? 0;

      if (b.type === "flight") {
        entry.flights += 1;
        const dom = isDomestic(b.flight?.originCode, b.flight?.destinationCode);
        if (dom) {
          entry.domesticFlights += 1;
          entry.profit += pricing.agencyFeeDomesticMRU;
        } else {
          entry.internationalFlights += 1;
          entry.profit += pricing.agencyFeeMRU;
        }
      } else {
        entry.hotels += 1;
        entry.profit += pricing.agencyFeeMRU;
      }
    });

    return Object.values(monthMap).sort((a, b) => b.key.localeCompare(a.key)).slice(0, 12);
  }, [confirmedBookings, pricing]);

  // Summary stats
  const summary = useMemo(() => {
    const totalRevenue = confirmedBookings.reduce((s, b) => s + (b.totalPrice ?? 0), 0);
    let totalProfit = 0;
    confirmedBookings.forEach(b => {
      if (b.type === "flight") {
        const dom = isDomestic(b.flight?.originCode, b.flight?.destinationCode);
        totalProfit += dom ? pricing.agencyFeeDomesticMRU : pricing.agencyFeeMRU;
      } else {
        totalProfit += pricing.agencyFeeMRU;
      }
    });
    return {
      totalBookings: confirmedBookings.length,
      totalRevenue,
      totalProfit,
      avgDailyBookings: dailyData.length > 0 ? confirmedBookings.length / dailyData.length : 0,
    };
  }, [confirmedBookings, dailyData, pricing]);

  const maxDailyRevenue = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.revenue)) : 1;
  const maxMonthlyRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map(m => m.revenue)) : 1;

  // Generate PDF report
  const generatePDF = async () => {
    setGenerating(true);
    try {
      const data = viewMode === "daily" ? dailyData : monthlyData;
      const title = viewMode === "daily" ? "تقرير المبيعات اليومي" : "تقرير المبيعات الشهري";

      const rows = data.map((item: any) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.label || item.date}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.total}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.flights}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.hotels}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${formatMRU(item.revenue)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#22C55E;">${formatMRU(item.profit)}</td>
        </tr>
      `).join("");

      const html = `
        <html dir="rtl" lang="ar">
        <head><meta charset="UTF-8"><style>
          body { font-family: Arial, sans-serif; padding: 30px; direction: rtl; }
          .header { background: #0F172A; color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
          .header h1 { margin: 0 0 8px; font-size: 22px; }
          .header .office { color: #C9A84C; font-size: 16px; font-weight: 700; letter-spacing: 2px; }
          .header .env { color: #22C55E; font-size: 12px; }
          .summary { display: flex; gap: 12px; margin-bottom: 24px; }
          .summary-card { flex: 1; background: #f8f9fa; border-radius: 10px; padding: 16px; text-align: center; }
          .summary-card .value { font-size: 22px; font-weight: 800; color: #1B2B5E; }
          .summary-card .label { font-size: 11px; color: #666; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #1B2B5E; color: white; padding: 10px 8px; text-align: right; }
          .footer { margin-top: 24px; text-align: center; color: #999; font-size: 11px; }
        </style></head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <div class="office">Office ID: ${OFFICE_ID}</div>
            <div class="env">Amadeus Production • Royal Service</div>
            <div style="color:rgba(255,255,255,0.6);font-size:11px;margin-top:8px;">
              تاريخ التقرير: ${new Date().toLocaleDateString("ar-MR")}
            </div>
          </div>
          <div class="summary">
            <div class="summary-card">
              <div class="value">${summary.totalBookings}</div>
              <div class="label">إجمالي الحجوزات</div>
            </div>
            <div class="summary-card">
              <div class="value">${formatMRU(summary.totalRevenue)}</div>
              <div class="label">إجمالي الإيرادات</div>
            </div>
            <div class="summary-card">
              <div class="value" style="color:#22C55E;">${formatMRU(summary.totalProfit)}</div>
              <div class="label">إجمالي الأرباح</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${viewMode === "daily" ? "التاريخ" : "الشهر"}</th>
                <th style="text-align:center;">الحجوزات</th>
                <th style="text-align:center;">رحلات</th>
                <th style="text-align:center;">فنادق</th>
                <th style="text-align:right;">الإيرادات</th>
                <th style="text-align:right;">الأرباح</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">
            Royal Service — ${OFFICE_ID} — تم الإنشاء تلقائياً
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === "web") {
        Alert.alert("تم إنشاء التقرير", "تم إنشاء ملف PDF بنجاح.");
      } else {
        await shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
      }
    } catch (err: any) {
      Alert.alert("خطأ", "فشل إنشاء التقرير: " + (err?.message || ""));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#0F172A" }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>تقارير المبيعات</Text>
          <Text style={styles.headerSub}>Office ID: {OFFICE_ID}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [{ opacity: pressed || generating ? 0.6 : 1, padding: 4 }]}
          onPress={generatePDF}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol name="arrow.down.circle.fill" size={24} color="#C9A84C" />
          )}
        </Pressable>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: "#1B2B5E" }]}>
          <Text style={[styles.summaryValue, { color: "#FFFFFF" }]}>{summary.totalBookings}</Text>
          <Text style={[styles.summaryLabel, { color: "rgba(255,255,255,0.6)" }]}>حجوزات مؤكدة</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: "#C9A84C" }]}>{formatMRU(summary.totalRevenue)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>الإيرادات</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
          <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{formatMRU(summary.totalProfit)}</Text>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>الأرباح</Text>
        </View>
      </View>

      {/* View Mode Toggle */}
      <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Pressable
          style={[styles.toggleBtn, viewMode === "daily" && { backgroundColor: "#1B2B5E" }]}
          onPress={() => setViewMode("daily")}
        >
          <IconSymbol name="calendar" size={16} color={viewMode === "daily" ? "#FFFFFF" : colors.muted} />
          <Text style={[styles.toggleText, { color: viewMode === "daily" ? "#FFFFFF" : colors.muted }]}>يومي</Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, viewMode === "monthly" && { backgroundColor: "#1B2B5E" }]}
          onPress={() => setViewMode("monthly")}
        >
          <IconSymbol name="chart.bar.fill" size={16} color={viewMode === "monthly" ? "#FFFFFF" : colors.muted} />
          <Text style={[styles.toggleText, { color: viewMode === "monthly" ? "#FFFFFF" : colors.muted }]}>شهري</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* DAILY VIEW */}
        {viewMode === "daily" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              آخر 30 يوم ({dailyData.length} يوم)
            </Text>
            {dailyData.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.muted, textAlign: "center" }}>لا توجد حجوزات مؤكدة بعد</Text>
              </View>
            ) : (
              dailyData.map((day, i) => {
                const barWidth = maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0;
                return (
                  <View key={day.date} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <View>
                        <Text style={[styles.cardDate, { color: colors.foreground }]}>{day.label}</Text>
                        <Text style={[styles.cardDayName, { color: colors.muted }]}>{day.dayName}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.cardRevenue, { color: "#1B2B5E" }]}>{formatMRU(day.revenue)}</Text>
                        <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "600" }}>+{formatMRU(day.profit)}</Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: "#1B2B5E" }]} />
                    </View>
                    {/* Stats row */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{day.total}</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>حجوزات</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a7ea4" }}>{day.flights}</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>رحلات</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#C9A84C" }}>{day.hotels}</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>فنادق</Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* MONTHLY VIEW */}
        {viewMode === "monthly" && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              آخر 12 شهر ({monthlyData.length} شهر)
            </Text>
            {monthlyData.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.muted, textAlign: "center" }}>لا توجد حجوزات مؤكدة بعد</Text>
              </View>
            ) : (
              monthlyData.map((month, i) => {
                const barWidth = maxMonthlyRevenue > 0 ? (month.revenue / maxMonthlyRevenue) * 100 : 0;
                const sortedPM = Object.entries(month.paymentMethods)
                  .sort((a, b) => b[1].amount - a[1].amount);
                return (
                  <View key={month.key} style={[styles.reportCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <View>
                        <Text style={[styles.cardDate, { color: colors.foreground }]}>{month.label}</Text>
                        <Text style={[styles.cardDayName, { color: colors.muted }]}>{month.total} حجز</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={[styles.cardRevenue, { color: "#1B2B5E" }]}>{formatMRU(month.revenue)}</Text>
                        <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "600" }}>+{formatMRU(month.profit)}</Text>
                      </View>
                    </View>
                    {/* Progress bar */}
                    <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.barFill, { width: `${barWidth}%`, backgroundColor: "#6366F1" }]} />
                    </View>
                    {/* Booking type breakdown */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#0a7ea4" }}>{month.domesticFlights}</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>داخلية</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1B2B5E" }}>{month.internationalFlights}</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>دولية</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "#C9A84C" }}>{month.hotels}</Text>
                        <Text style={{ fontSize: 10, color: colors.muted }}>فنادق</Text>
                      </View>
                    </View>
                    {/* Payment methods */}
                    {sortedPM.length > 0 && (
                      <View style={[styles.pmSection, { borderTopColor: colors.border }]}>
                        {sortedPM.map(([method, data]) => {
                          const config = PAYMENT_METHOD_CONFIG[method] || { label: method, color: "#666", icon: "💰" };
                          return (
                            <View key={method} style={styles.pmRow}>
                              <Text style={{ fontSize: 12 }}>{config.icon}</Text>
                              <Text style={{ fontSize: 12, color: colors.foreground, flex: 1 }}>{config.label}</Text>
                              <Text style={{ fontSize: 12, color: colors.muted }}>{data.count}x</Text>
                              <Text style={{ fontSize: 12, fontWeight: "600", color: config.color, marginLeft: 8 }}>
                                {formatMRU(data.amount)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Export Button */}
        <View style={styles.exportSection}>
          <Pressable
            style={({ pressed }) => [styles.exportBtn, { opacity: pressed || generating ? 0.7 : 1 }]}
            onPress={generatePDF}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="doc.text.fill" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.exportBtnText}>
              تصدير {viewMode === "daily" ? "التقرير اليومي" : "التقرير الشهري"} PDF
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.exportBtn, { backgroundColor: "#0a7ea4", opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push("/admin/profit-report" as any)}
          >
            <IconSymbol name="chart.line.uptrend.xyaxis" size={20} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>تقرير الأرباح التفصيلي</Text>
          </Pressable>
        </View>

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
  headerSub: { fontSize: 12, color: "#C9A84C", marginTop: 2, letterSpacing: 1 },
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  summaryValue: { fontSize: 16, fontWeight: "800" },
  summaryLabel: { fontSize: 10, marginTop: 2 },
  toggleRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 8,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleText: { fontSize: 14, fontWeight: "600" },
  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  reportCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardDate: { fontSize: 15, fontWeight: "700" },
  cardDayName: { fontSize: 12, marginTop: 2 },
  cardRevenue: { fontSize: 16, fontWeight: "700" },
  barTrack: { height: 6, borderRadius: 3, marginBottom: 10 },
  barFill: { height: 6, borderRadius: 3 },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: { alignItems: "center" },
  pmSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 6,
  },
  pmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
  },
  exportSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#22C55E",
  },
  exportBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
