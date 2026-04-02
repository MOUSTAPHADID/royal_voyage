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

function isDomestic(originCode?: string, destCode?: string) {
  return MR_AIRPORTS.includes((originCode || "").toUpperCase()) && MR_AIRPORTS.includes((destCode || "").toUpperCase());
}

// ألوان وأيقونات مميزة لكل طريقة دفع
const PAYMENT_METHOD_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  bankily: { label: "بنكيلي", color: "#F59E0B", icon: "B" },
  masrvi: { label: "مصرفي", color: "#8B5CF6", icon: "M" },
  sedad: { label: "سداد", color: "#EF4444", icon: "S" },
  cash: { label: "نقداً", color: "#22C55E", icon: "$" },
  bank_transfer: { label: "تحويل بنكي", color: "#3B82F6", icon: "T" },
  stripe: { label: "بطاقة بنكية", color: "#635BFF", icon: "C" },
  paypal: { label: "PayPal", color: "#003087", icon: "P" },
  multicaixa: { label: "Multicaixa Express", color: "#E31937", icon: "MC" },
};

export default function ProfitReportScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const pricing = getPricingSettings();

  // حساب الأشهر المتاحة
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    bookings.filter(b => b.status === "confirmed").forEach(b => {
      const key = (b.date || "").substring(0, 7);
      if (key) months.add(key);
    });
    const monthNames = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    return Array.from(months).sort((a, b) => b.localeCompare(a)).map(key => {
      const [year, month] = key.split("-");
      return { key, label: `${monthNames[parseInt(month) - 1]} ${year}` };
    });
  }, [bookings]);

  // حساب إحصائيات التقرير
  const reportData = useMemo(() => {
    const confirmed = bookings.filter(b => {
      if (b.status !== "confirmed") return false;
      if (selectedMonth === "all") return true;
      return (b.date || "").startsWith(selectedMonth);
    });

    const domesticFlights = confirmed.filter(b => b.type === "flight" && isDomestic(b.flight?.originCode, b.flight?.destinationCode));
    const intlFlights = confirmed.filter(b => b.type === "flight" && !isDomestic(b.flight?.originCode, b.flight?.destinationCode));
    const hotels = confirmed.filter(b => b.type === "hotel");

    const domesticProfit = domesticFlights.length * pricing.agencyFeeDomesticMRU;
    const intlProfit = intlFlights.length * pricing.agencyFeeMRU;
    const hotelProfit = hotels.length * pricing.agencyFeeMRU;
    const totalProfit = domesticProfit + intlProfit + hotelProfit;

    // تفصيل حسب طريقة الدفع
    const paymentMethodStats: Record<string, { count: number; total: number; profit: number }> = {};
    confirmed.forEach(b => {
      const method = b.paymentMethod || "cash";
      if (!paymentMethodStats[method]) paymentMethodStats[method] = { count: 0, total: 0, profit: 0 };
      paymentMethodStats[method].count++;
      paymentMethodStats[method].total += b.totalPrice || 0;
      // حساب الربح لكل طريقة دفع
      if (b.type === "flight" && isDomestic(b.flight?.originCode, b.flight?.destinationCode)) {
        paymentMethodStats[method].profit += pricing.agencyFeeDomesticMRU;
      } else {
        paymentMethodStats[method].profit += pricing.agencyFeeMRU;
      }
    });

    // ترتيب طرق الدفع حسب المبلغ الإجمالي
    const sortedPaymentMethods = Object.entries(paymentMethodStats)
      .sort(([, a], [, b]) => b.total - a.total);

    // إحصائيات الحالة
    const totalBookings = bookings.length;
    const pendingCount = bookings.filter(b => b.status === "pending").length;
    const confirmedCount = confirmed.length;
    const cancelledCount = bookings.filter(b => b.status === "cancelled").length;
    const paymentConfirmedCount = confirmed.filter(b => b.paymentConfirmed).length;
    const totalRevenue = confirmed.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return {
      confirmed,
      domesticFlights, intlFlights, hotels,
      domesticProfit, intlProfit, hotelProfit, totalProfit,
      paymentMethodStats, sortedPaymentMethods,
      totalBookings, pendingCount, confirmedCount, cancelledCount,
      paymentConfirmedCount, totalRevenue,
    };
  }, [bookings, selectedMonth, pricing]);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString("ar-SA", { day: "2-digit", month: "long", year: "numeric" });
      const monthLabel = selectedMonth === "all" ? "جميع الأشهر" : availableMonths.find(m => m.key === selectedMonth)?.label || "";

      // بناء صفوف طرق الدفع للـ PDF
      const paymentMethodRows = reportData.sortedPaymentMethods.map(([method, stats]) => {
        const config = PAYMENT_METHOD_CONFIG[method] || { label: method, color: "#666", icon: "?" };
        return `
        <tr>
          <td>
            <span class="badge" style="background: ${config.color}15; color: ${config.color};">
              ${config.icon} ${config.label}
            </span>
          </td>
          <td>${stats.count}</td>
          <td>${formatMRU(stats.total)}</td>
          <td class="profit-value">${formatMRU(stats.profit)}</td>
        </tr>`;
      }).join("");

      const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f8f9fa; color: #1a1a2e; direction: rtl; }
    .header { background: linear-gradient(135deg, #1B2B5E, #0a7ea4); color: white; padding: 32px; text-align: center; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 2px; margin-bottom: 4px; }
    .subtitle { font-size: 14px; opacity: 0.8; }
    .report-title { font-size: 20px; font-weight: 700; margin-top: 12px; }
    .period { font-size: 13px; opacity: 0.7; margin-top: 4px; }
    .content { padding: 24px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .summary-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .summary-card.primary { background: #1B2B5E; color: white; }
    .card-label { font-size: 12px; opacity: 0.7; margin-bottom: 6px; }
    .card-value { font-size: 22px; font-weight: 800; }
    .section-title { font-size: 16px; font-weight: 700; color: #1B2B5E; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .breakdown-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .breakdown-table th { background: #1B2B5E; color: white; padding: 12px 16px; font-size: 13px; }
    .breakdown-table td { padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
    .breakdown-table tr:nth-child(even) td { background: #f8f9fa; }
    .profit-value { font-weight: 700; color: #1B2B5E; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-domestic { background: #e0f2fe; color: #0a7ea4; }
    .badge-intl { background: #e8eaf6; color: #1B2B5E; }
    .badge-hotel { background: #fef3c7; color: #C4973A; }
    .footer { text-align: center; padding: 20px; color: #9ba1a6; font-size: 11px; border-top: 1px solid #e5e7eb; margin-top: 24px; }
    .total-row td { font-weight: 800; font-size: 15px; background: #f0f4ff !important; color: #1B2B5E; }
    .status-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 12px; margin-top: 16px; }
    .status-card { text-align: center; padding: 12px; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">ROYAL VOYAGE</div>
    <div class="subtitle">وكالة السفر الملكية</div>
    <div class="report-title">تقرير الأرباح المالي</div>
    <div class="period">الفترة: ${monthLabel} | تاريخ الإصدار: ${dateStr}</div>
  </div>

  <div class="content">
    <!-- ملخص الأرباح -->
    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="card-label">إجمالي الأرباح</div>
        <div class="card-value">${formatMRU(reportData.totalProfit)}</div>
      </div>
      <div class="summary-card">
        <div class="card-label">إجمالي الإيرادات</div>
        <div class="card-value" style="color: #22C55E;">${formatMRU(reportData.totalRevenue)}</div>
      </div>
      <div class="summary-card">
        <div class="card-label">الحجوزات المؤكدة</div>
        <div class="card-value">${reportData.confirmed.length}</div>
      </div>
      <div class="summary-card">
        <div class="card-label">الدفع المؤكد</div>
        <div class="card-value" style="color: #059669;">${reportData.paymentConfirmedCount}</div>
      </div>
    </div>

    <!-- تفصيل حسب النوع -->
    <div class="section-title">تفصيل الأرباح حسب نوع الحجز</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th>نوع الحجز</th>
          <th>عدد الحجوزات</th>
          <th>الرسوم / حجز</th>
          <th>إجمالي الأرباح</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge badge-domestic">رحلات داخلية</span></td>
          <td>${reportData.domesticFlights.length}</td>
          <td>${formatMRU(pricing.agencyFeeDomesticMRU)}</td>
          <td class="profit-value">${formatMRU(reportData.domesticProfit)}</td>
        </tr>
        <tr>
          <td><span class="badge badge-intl">رحلات دولية</span></td>
          <td>${reportData.intlFlights.length}</td>
          <td>${formatMRU(pricing.agencyFeeMRU)}</td>
          <td class="profit-value">${formatMRU(reportData.intlProfit)}</td>
        </tr>
        <tr>
          <td><span class="badge badge-hotel">فنادق</span></td>
          <td>${reportData.hotels.length}</td>
          <td>${formatMRU(pricing.agencyFeeMRU)}</td>
          <td class="profit-value">${formatMRU(reportData.hotelProfit)}</td>
        </tr>
        <tr class="total-row">
          <td>الإجمالي</td>
          <td>${reportData.confirmed.length}</td>
          <td>—</td>
          <td>${formatMRU(reportData.totalProfit)}</td>
        </tr>
      </tbody>
    </table>

    <!-- تفصيل حسب طريقة الدفع -->
    <div class="section-title">تفصيل الإيرادات حسب طريقة الدفع</div>
    <table class="breakdown-table">
      <thead>
        <tr>
          <th>طريقة الدفع</th>
          <th>عدد العمليات</th>
          <th>إجمالي الإيرادات</th>
          <th>إجمالي الأرباح</th>
        </tr>
      </thead>
      <tbody>
        ${paymentMethodRows}
        <tr class="total-row">
          <td>الإجمالي</td>
          <td>${reportData.confirmed.length}</td>
          <td>${formatMRU(reportData.totalRevenue)}</td>
          <td>${formatMRU(reportData.totalProfit)}</td>
        </tr>
      </tbody>
    </table>

    <!-- إحصائيات عامة -->
    <div class="section-title">إحصائيات الحجوزات</div>
    <div class="status-grid">
      <div class="status-card" style="background: #FEF3C7;">
        <div style="font-size: 20px; font-weight: 800; color: #D97706;">${reportData.pendingCount}</div>
        <div style="font-size: 11px; color: #D97706;">معلق</div>
      </div>
      <div class="status-card" style="background: #DBEAFE;">
        <div style="font-size: 20px; font-weight: 800; color: #1B2B5E;">${reportData.confirmedCount}</div>
        <div style="font-size: 11px; color: #1B2B5E;">مؤكد</div>
      </div>
      <div class="status-card" style="background: #FEE2E2;">
        <div style="font-size: 20px; font-weight: 800; color: #DC2626;">${reportData.cancelledCount}</div>
        <div style="font-size: 11px; color: #DC2626;">ملغى</div>
      </div>
      <div class="status-card" style="background: #D1FAE5;">
        <div style="font-size: 20px; font-weight: 800; color: #059669;">${reportData.paymentConfirmedCount}</div>
        <div style="font-size: 11px; color: #059669;">دفع مؤكد</div>
      </div>
    </div>
  </div>

  <div class="footer">
    Royal Voyage — تم الإنشاء تلقائياً بتاريخ ${dateStr}
  </div>
</body>
</html>`;

      const { uri } = await Print.printToFileAsync({ html, margins: { left: 10, top: 10, right: 10, bottom: 10 } });
      await shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "مشاركة تقرير الأرباح", UTI: ".pdf" });
    } catch (err) {
      Alert.alert("خطأ", "تعذّر إنشاء التقرير. حاول مرة أخرى.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#1B2B5E" }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>تقرير الأرباح</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* اختيار الفترة */}
        <View style={{ padding: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.muted }]}>اختر الفترة</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            <Pressable
              style={[styles.monthChip, selectedMonth === "all" && { backgroundColor: "#1B2B5E" }]}
              onPress={() => setSelectedMonth("all")}
            >
              <Text style={[styles.monthChipText, { color: selectedMonth === "all" ? "#FFF" : colors.foreground }]}>
                الكل
              </Text>
            </Pressable>
            {availableMonths.map(m => (
              <Pressable
                key={m.key}
                style={[styles.monthChip, selectedMonth === m.key && { backgroundColor: "#1B2B5E" }]}
                onPress={() => setSelectedMonth(m.key)}
              >
                <Text style={[styles.monthChipText, { color: selectedMonth === m.key ? "#FFF" : colors.foreground }]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ملخص الأرباح */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <View style={[styles.statCard, { flex: 1, backgroundColor: "#1B2B5E" }]}>
              <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.7)" }]}>إجمالي الأرباح</Text>
              <Text style={[styles.statValue, { color: "#FFFFFF" }]}>{formatMRU(reportData.totalProfit)}</Text>
            </View>
            <View style={[styles.statCard, { flex: 1, backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>إجمالي الإيرادات</Text>
              <Text style={[styles.statValue, { color: "#22C55E" }]}>{formatMRU(reportData.totalRevenue)}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
            <View style={[styles.statCard, { flex: 1, backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>حجوزات مؤكدة</Text>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{reportData.confirmed.length}</Text>
            </View>
            <View style={[styles.statCard, { flex: 1, backgroundColor: colors.surface }]}>
              <Text style={[styles.statLabel, { color: colors.muted }]}>دفع مؤكد</Text>
              <Text style={[styles.statValue, { color: "#059669" }]}>{reportData.paymentConfirmedCount}</Text>
            </View>
          </View>

          {/* تفصيل حسب النوع */}
          <Text style={[styles.sectionLabel, { color: colors.muted, marginBottom: 8 }]}>تفصيل حسب النوع</Text>
          {[
            { label: "رحلات داخلية", count: reportData.domesticFlights.length, profit: reportData.domesticProfit, fee: pricing.agencyFeeDomesticMRU, color: "#0a7ea4" },
            { label: "رحلات دولية", count: reportData.intlFlights.length, profit: reportData.intlProfit, fee: pricing.agencyFeeMRU, color: "#1B2B5E" },
            { label: "فنادق", count: reportData.hotels.length, profit: reportData.hotelProfit, fee: pricing.agencyFeeMRU, color: "#C4973A" },
          ].map((item, i) => (
            <View key={i} style={[styles.breakdownRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: item.color }} />
                <View>
                  <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{item.label}</Text>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>{item.count} حجز × {formatMRU(item.fee)}</Text>
                </View>
              </View>
              <Text style={{ color: item.color, fontWeight: "800", fontSize: 16 }}>{formatMRU(item.profit)}</Text>
            </View>
          ))}
        </View>

        {/* تفصيل حسب طريقة الدفع */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.muted, marginBottom: 8 }]}>تفصيل حسب طريقة الدفع</Text>
          {reportData.sortedPaymentMethods.length === 0 ? (
            <View style={[styles.breakdownRow, { backgroundColor: colors.surface, borderColor: colors.border, justifyContent: "center" }]}>
              <Text style={{ color: colors.muted, fontSize: 13 }}>لا توجد بيانات</Text>
            </View>
          ) : (
            reportData.sortedPaymentMethods.map(([method, stats], i) => {
              const config = PAYMENT_METHOD_CONFIG[method] || { label: method, color: "#666", icon: "?" };
              const percentage = reportData.totalRevenue > 0 ? Math.round((stats.total / reportData.totalRevenue) * 100) : 0;
              return (
                <View key={i} style={[styles.breakdownRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: config.color + "18", justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontSize: 18 }}>{config.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontWeight: "600", fontSize: 14 }}>{config.label}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                        <Text style={{ color: colors.muted, fontSize: 11 }}>{stats.count} عملية</Text>
                        <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.muted }} />
                        <Text style={{ color: config.color, fontSize: 11, fontWeight: "600" }}>{percentage}%</Text>
                      </View>
                      {/* شريط النسبة */}
                      <View style={{ height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 4 }}>
                        <View style={{ height: 4, backgroundColor: config.color, borderRadius: 2, width: `${Math.max(percentage, 2)}%` as any }} />
                      </View>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: config.color, fontWeight: "800", fontSize: 15 }}>{formatMRU(stats.total)}</Text>
                    <Text style={{ color: colors.muted, fontSize: 10, marginTop: 1 }}>ربح: {formatMRU(stats.profit)}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* إحصائيات عامة */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={[styles.sectionLabel, { color: colors.muted, marginBottom: 8 }]}>إحصائيات عامة</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
            <View style={[styles.miniStat, { backgroundColor: "#FEF3C7", flex: 1 }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#D97706" }}>{reportData.pendingCount}</Text>
              <Text style={{ fontSize: 11, color: "#D97706" }}>معلق</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: "#DBEAFE", flex: 1 }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#1B2B5E" }}>{reportData.confirmedCount}</Text>
              <Text style={{ fontSize: 11, color: "#1B2B5E" }}>مؤكد</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: "#FEE2E2", flex: 1 }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#DC2626" }}>{reportData.cancelledCount}</Text>
              <Text style={{ fontSize: 11, color: "#DC2626" }}>ملغى</Text>
            </View>
            <View style={[styles.miniStat, { backgroundColor: "#D1FAE5", flex: 1 }]}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: "#059669" }}>{reportData.paymentConfirmedCount}</Text>
              <Text style={{ fontSize: 11, color: "#059669" }}>دفع مؤكد</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* زر التصدير */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.exportBtn, { opacity: pressed || generating ? 0.85 : 1 }]}
          onPress={generatePDF}
          disabled={generating}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
          )}
          <Text style={styles.exportBtnText}>
            {generating ? "جاري الإنشاء..." : "تصدير ومشاركة PDF"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  monthChipText: { fontSize: 13, fontWeight: "600" },
  statCard: {
    borderRadius: 14,
    padding: 16,
  },
  statLabel: { fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "800" },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  bottomBar: {
    padding: 16,
    borderTopWidth: 0.5,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#22C55E",
  },
  exportBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  miniStat: {
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
  },
});
