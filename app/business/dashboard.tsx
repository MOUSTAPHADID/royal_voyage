import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type TabType = "overview" | "travelers" | "bookings" | "invoices";

export default function BusinessDashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const { data: companies, isLoading, refetch } = trpc.companies.myCompanies.useQuery(
    { ownerUserId: user?.id ?? "" },
    { enabled: !!user?.id }
  );

  const company = companies?.find((c) => c.id === selectedCompanyId) ?? companies?.[0];

  const { data: travelers } = trpc.companies.getTravelers.useQuery(
    { companyId: company?.id ?? 0 },
    { enabled: !!company?.id && activeTab === "travelers" }
  );

  const { data: bookings } = trpc.companies.getBookings.useQuery(
    { companyId: company?.id ?? 0 },
    { enabled: !!company?.id && activeTab === "bookings" }
  );

  const { data: invoices } = trpc.companies.getInvoices.useQuery(
    { companyId: company?.id ?? 0 },
    { enabled: !!company?.id && activeTab === "invoices" }
  );

  const statusColors: Record<string, string> = {
    pending: colors.warning,
    approved: colors.success,
    rejected: colors.error,
    suspended: colors.muted,
  };

  const statusLabels: Record<string, string> = {
    pending: "قيد المراجعة",
    approved: "معتمد",
    rejected: "مرفوض",
    suspended: "موقوف",
  };

  const styles = StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    backBtn: { padding: 4 },
    backText: { fontSize: 24, color: colors.primary },
    title: { fontSize: 20, fontWeight: "700", color: colors.foreground },
    addBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
    companyCard: {
      margin: 16,
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
    },
    companyName: { fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "right" },
    companyType: { fontSize: 13, color: colors.muted, textAlign: "right", marginTop: 2 },
    statusBadge: {
      alignSelf: "flex-end",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 8,
    },
    statusText: { fontSize: 12, fontWeight: "600", color: "#fff" },
    statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    statBox: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 12,
      alignItems: "center",
    },
    statNum: { fontSize: 20, fontWeight: "700", color: colors.primary },
    statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      gap: 8,
      marginBottom: 8,
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surface,
    },
    tabActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 13, color: colors.muted },
    tabTextActive: { color: "#fff", fontWeight: "600" },
    listItem: {
      marginHorizontal: 16,
      marginBottom: 10,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
    },
    listItemTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground, textAlign: "right" },
    listItemSub: { fontSize: 13, color: colors.muted, textAlign: "right", marginTop: 2 },
    emptyBox: { alignItems: "center", padding: 40 },
    emptyText: { fontSize: 15, color: colors.muted, textAlign: "center" },
    actionRow: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 16 },
    actionBtn: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionBtnText: { fontSize: 14, fontWeight: "600", color: colors.primary },
  });

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </ScreenContainer>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <ScreenContainer>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>الحساب التجاري</Text>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>🏢</Text>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, textAlign: "center", marginBottom: 8 }}>
            لا يوجد حساب تجاري
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 24 }}>
            سجّل شركتك للاستفادة من الأسعار التجارية وإدارة حجوزات فريقك
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 }}
            onPress={() => router.push("/business/register")}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>تسجيل شركة جديدة</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: "overview", label: "نظرة عامة" },
    { key: "travelers", label: "المسافرون" },
    { key: "bookings", label: "الحجوزات" },
    { key: "invoices", label: "الفواتير" },
  ];

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>الحساب التجاري</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/business/register")}>
          <Text style={styles.addBtnText}>+ شركة جديدة</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {/* Company Card */}
        {company && (
          <View style={styles.companyCard}>
            <Text style={styles.companyName}>{company.companyName}</Text>
            <Text style={styles.companyType}>
              {company.companyType === "travel_agency" ? "وكالة سفر" :
               company.companyType === "corporate" ? "شركة" :
               company.companyType === "tour_operator" ? "منظم رحلات" : "أخرى"}
            </Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusColors[company.status ?? "pending"] }]}
            >
              <Text style={styles.statusText}>{statusLabels[company.status ?? "pending"]}</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{travelers?.length ?? "—"}</Text>
                <Text style={styles.statLabel}>مسافر</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{bookings?.length ?? "—"}</Text>
                <Text style={styles.statLabel}>حجز</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{company.discountPercent ?? "0"}%</Text>
                <Text style={styles.statLabel}>خصم</Text>
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/business/travelers")}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>👥</Text>
                <Text style={styles.actionBtnText}>إدارة المسافرين</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/business/team")}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>🏢</Text>
                <Text style={styles.actionBtnText}>إدارة الفريق</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setActiveTab("invoices")}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>🧾</Text>
                <Text style={styles.actionBtnText}>الفواتير</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push("/(tabs)/bookings")}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>✈️</Text>
                <Text style={styles.actionBtnText}>كل الحجوزات</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "travelers" && (
          <View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginHorizontal: 16, marginBottom: 10 }}>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}
                onPress={() => router.push("/business/add-traveler")}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>+ إضافة مسافر</Text>
              </TouchableOpacity>
            </View>
            {travelers && travelers.length > 0 ? (
              travelers.map((t) => (
                <View key={t.id} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{t.firstName} {t.lastName}</Text>
                  <Text style={styles.listItemSub}>
                    {t.passportNumber ? `جواز: ${t.passportNumber}` : "لا يوجد جواز مسجل"}
                    {t.nationality ? ` · ${t.nationality}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>لا يوجد مسافرون مسجلون بعد</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "bookings" && (
          <View>
            {bookings && bookings.length > 0 ? (
              bookings.map((b) => (
                <View key={b.id} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{b.bookingRef ?? `حجز #${b.id}`}</Text>
                  <Text style={styles.listItemSub}>
                    {b.serviceType} · {b.totalAmount} {b.currency}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>لا توجد حجوزات تجارية بعد</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "invoices" && (
          <View>
            {invoices && invoices.length > 0 ? (
              invoices.map((inv) => (
                <View key={inv.id} style={styles.listItem}>
                  <Text style={styles.listItemTitle}>{inv.invoiceNumber}</Text>
                  <Text style={styles.listItemSub}>
                    {inv.amount} {inv.currency} · {inv.status === "paid" ? "مدفوع" : inv.status === "pending" ? "معلق" : inv.status === "overdue" ? "متأخر" : "ملغي"}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>لا توجد فواتير بعد</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
