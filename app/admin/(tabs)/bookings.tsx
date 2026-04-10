import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, FlatList, ActivityIndicator, Alert, Share, Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useAdmin } from "@/lib/admin-context";
import { trpc } from "@/lib/trpc";
import { IconSymbol } from "@/components/ui/icon-symbol";

const T = {
  ar: {
    title: "إدارة الحجوزات",
    search: "بحث بالاسم أو المرجع أو PNR...",
    all: "الكل",
    today: "اليوم",
    pending: "معلق",
    confirmed: "مؤكد",
    noResults: "لا توجد نتائج",
    pnr: "PNR",
    mru: "أوق",
    export: "تصدير CSV",
    exportSuccess: "تم تصدير قائمة الحجوزات",
    exportEmpty: "لا توجد حجوزات للتصدير",
    todayCount: (n: number) => `${n} حجز اليوم`,
    totalCount: (n: number) => `${n} حجز`,
    date: "التاريخ",
  },
  fr: {
    title: "Gestion des réservations",
    search: "Rechercher par nom, référence ou PNR...",
    all: "Tous",
    today: "Aujourd'hui",
    pending: "En attente",
    confirmed: "Confirmé",
    noResults: "Aucun résultat",
    pnr: "PNR",
    mru: "MRU",
    export: "Exporter CSV",
    exportSuccess: "Liste exportée",
    exportEmpty: "Aucune réservation à exporter",
    todayCount: (n: number) => `${n} réservation(s) aujourd'hui`,
    totalCount: (n: number) => `${n} réservation(s)`,
    date: "Date",
  },
};

type FilterTab = "all" | "today" | "pending" | "confirmed" | "paid" | "unpaid" | "rejected";

function isSameDay(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function generateCSV(bookings: any[]): string {
  const headers = ["ID", "Ref", "PNR", "Passenger", "Email", "Route", "Price", "Currency", "Date"];
  const rows = bookings.map(b => [
    b.id,
    b.bookingRef ?? b.duffelOrderId ?? "",
    b.pnr ?? "",
    b.passengerName ?? "",
    b.passengerEmail ?? "",
    b.routeSummary ?? "",
    b.totalPrice ?? "",
    b.currency ?? "MRU",
    b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-GB") : "",
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { language } = useAdmin();
  const t = T[language];
  const isRTL = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const { data: bookingsData, isLoading, refetch } = trpc.bookingContacts.list.useQuery(undefined, {
    refetchInterval: 60000,
  });

  const todayCount = useMemo(() =>
    (bookingsData ?? []).filter((b: any) => isSameDay(b.createdAt)).length,
    [bookingsData]
  );

  const paidCount = useMemo(() => (bookingsData ?? []).filter((b: any) => b.paymentStatus === "confirmed").length, [bookingsData]);
  const unpaidCount = useMemo(() => (bookingsData ?? []).filter((b: any) => !b.paymentStatus || b.paymentStatus === "pending").length, [bookingsData]);
  const rejectedCount = useMemo(() => (bookingsData ?? []).filter((b: any) => b.paymentStatus === "rejected").length, [bookingsData]);

  const filteredBookings = useMemo(() => {
    let list = bookingsData ?? [];
    if (activeFilter === "today") list = list.filter((b: any) => isSameDay(b.createdAt));
    else if (activeFilter === "pending") list = list.filter((b: any) => !b.pnr);
    else if (activeFilter === "confirmed") list = list.filter((b: any) => !!b.pnr);
    else if (activeFilter === "paid") list = list.filter((b: any) => b.paymentStatus === "confirmed");
    else if (activeFilter === "unpaid") list = list.filter((b: any) => !b.paymentStatus || b.paymentStatus === "pending");
    else if (activeFilter === "rejected") list = list.filter((b: any) => b.paymentStatus === "rejected");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((b: any) =>
        ((b as any).passengerName ?? "").toLowerCase().includes(q) ||
        ((b as any).bookingRef ?? "").toLowerCase().includes(q) ||
        (b.pnr ?? "").toLowerCase().includes(q) ||
        (b.duffelOrderId ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookingsData, activeFilter, searchQuery]);

  const handleExportCSV = async () => {
    if (filteredBookings.length === 0) {
      Alert.alert("", t.exportEmpty);
      return;
    }
    const csv = generateCSV(filteredBookings);
    const filename = `bookings_${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      if (Platform.OS === "web") {
        // Web: create download link
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Mobile: share the CSV text
        await Share.share({
          title: filename,
          message: csv,
        });
      }
    } catch (e) {
      Alert.alert("Error", String(e));
    }
  };

  const filterTabs: { key: FilterTab; label: string; badge?: number; color?: string }[] = [
    { key: "all", label: t.all, badge: bookingsData?.length },
    { key: "today", label: t.today, badge: todayCount },
    { key: "paid", label: language === "ar" ? "مدفوع" : "Payé", badge: paidCount, color: "#22C55E" },
    { key: "unpaid", label: language === "ar" ? "غير مدفوع" : "Non payé", badge: unpaidCount, color: "#F59E0B" },
    { key: "rejected", label: language === "ar" ? "مرفوض" : "Refusé", badge: rejectedCount, color: "#EF4444" },
    { key: "pending", label: t.pending },
    { key: "confirmed", label: t.confirmed },
  ];

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          {todayCount > 0 && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{t.todayCount(todayCount)}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleExportCSV} style={styles.actionBtn}>
            <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => refetch()} style={styles.actionBtn}>
            <IconSymbol name="arrow.2.squarepath" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
          placeholder={t.search}
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {filterTabs.map(tab => {
          const isActive = activeFilter === tab.key;
          const tabColor = tab.color ?? colors.primary;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterTab, {
                backgroundColor: isActive ? tabColor : colors.surface,
                borderColor: isActive ? tabColor : (tab.color ? tab.color + "50" : colors.border),
              }]}
              onPress={() => setActiveFilter(tab.key)}
            >
              <Text style={[styles.filterTabText, { color: isActive ? "#fff" : (tab.color ?? colors.muted) }]}>{tab.label}</Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: isActive ? "#ffffff40" : (tab.color ?? colors.primary) + "20" }]}>
                  <Text style={[styles.filterBadgeText, { color: isActive ? "#fff" : (tab.color ?? colors.primary) }]}>{tab.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count + Export hint */}
      {!isLoading && filteredBookings.length > 0 && (
        <View style={[styles.countRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.countText, { color: colors.muted }]}>{t.totalCount(filteredBookings.length)}</Text>
          <TouchableOpacity onPress={handleExportCSV} style={styles.exportBtn}>
            <IconSymbol name="square.and.arrow.up" size={14} color={colors.primary} />
            <Text style={[styles.exportBtnText, { color: colors.primary }]}>{t.export}</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="calendar.badge.checkmark" size={48} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.muted }]}>{t.noResults}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const dateStr = (item as any).createdAt
              ? new Date((item as any).createdAt).toLocaleDateString(language === "ar" ? "ar-SA" : "fr-FR", { day: "2-digit", month: "short" })
              : null;
            const payStatus = (item as any).paymentStatus;
            const isPaymentConfirmed = payStatus === "confirmed";
            const isPaymentRejected = payStatus === "rejected";
            const payColor = isPaymentConfirmed ? "#22C55E" : isPaymentRejected ? "#EF4444" : "#F59E0B";
            const payLabel = isPaymentConfirmed
              ? (language === "ar" ? "مدفوع" : "Payé")
              : isPaymentRejected
              ? (language === "ar" ? "مرفوض" : "Refusé")
              : (language === "ar" ? "غير مدفوع" : "Non payé");
            return (
              <TouchableOpacity
                style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: isPaymentRejected ? "#EF444430" : isPaymentConfirmed ? "#22C55E30" : colors.border }]}
                onPress={() => router.push({ pathname: "/admin/booking-detail/[id]" as any, params: { id: item.duffelOrderId } })}
                activeOpacity={0.75}
              >
                <View style={[styles.cardIcon, { backgroundColor: payColor + "18" }]}>
                  <IconSymbol name="airplane" size={18} color={payColor} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.passengerName, { color: colors.foreground }]} numberOfLines={1}>
                    {(item as any).passengerName ?? "—"}
                  </Text>
                  <Text style={[styles.bookingRef, { color: colors.muted }]}>
                    {(item as any).bookingRef ?? item.duffelOrderId?.slice(0, 14)}
                  </Text>
                  {item.pnr ? <Text style={[styles.pnrText, { color: colors.primary }]}>{t.pnr}: {item.pnr}</Text> : null}
                  {(item as any).routeSummary ? (
                    <Text style={[styles.routeText, { color: colors.muted }]} numberOfLines={1}>{(item as any).routeSummary}</Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusBadge, { backgroundColor: payColor + "20" }]}>
                    <Text style={[styles.statusText, { color: payColor }]}>{payLabel}</Text>
                  </View>
                  {(item as any).totalPrice ? (
                    <Text style={[styles.priceText, { color: colors.foreground }]}>
                      {parseFloat((item as any).totalPrice).toLocaleString()} {t.mru}
                    </Text>
                  ) : null}
                  {dateStr ? <Text style={[styles.dateText, { color: colors.muted }]}>{dateStr}</Text> : null}
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 16 },
  headerLeft: { flex: 1, gap: 4 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  todayBadge: { backgroundColor: "#ffffff25", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: "flex-start" },
  todayBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  actionBtn: { padding: 6, backgroundColor: "#ffffff20", borderRadius: 8 },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterScroll: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  filterTab: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 5 },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  filterBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  filterBadgeText: { fontSize: 11, fontWeight: "700" },
  countRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5 },
  countText: { fontSize: 12 },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  exportBtnText: { fontSize: 12, fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  emptyText: { fontSize: 15 },
  listContent: { padding: 12, gap: 10 },
  bookingCard: { borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 2 },
  passengerName: { fontSize: 15, fontWeight: "700" },
  bookingRef: { fontSize: 12 },
  pnrText: { fontSize: 12, fontWeight: "700" },
  routeText: { fontSize: 11 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  priceText: { fontSize: 13, fontWeight: "700" },
  dateText: { fontSize: 11 },
});
