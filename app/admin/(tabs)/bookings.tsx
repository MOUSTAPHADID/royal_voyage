import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, FlatList, ActivityIndicator,
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
    pending: "معلق",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    noResults: "لا توجد نتائج",
    pnr: "PNR",
    mru: "أوق",
  },
  fr: {
    title: "Gestion des réservations",
    search: "Rechercher par nom, référence ou PNR...",
    all: "Tous",
    pending: "En attente",
    confirmed: "Confirmé",
    cancelled: "Annulé",
    noResults: "Aucun résultat",
    pnr: "PNR",
    mru: "MRU",
  },
};

type FilterTab = "all" | "pending" | "confirmed";

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

  const filteredBookings = useMemo(() => {
    let list = bookingsData ?? [];
    if (activeFilter === "pending") list = list.filter((b: any) => !b.pnr);
    else if (activeFilter === "confirmed") list = list.filter((b: any) => !!b.pnr);

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

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: t.all },
    { key: "pending", label: t.pending },
    { key: "confirmed", label: t.confirmed },
  ];

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          <IconSymbol name="arrow.2.squarepath" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {filterTabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, { backgroundColor: activeFilter === tab.key ? colors.primary : colors.surface, borderColor: activeFilter === tab.key ? colors.primary : colors.border }]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Text style={[styles.filterTabText, { color: activeFilter === tab.key ? "#fff" : colors.muted }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.bookingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/admin/booking-detail/[id]" as any, params: { id: item.duffelOrderId } })}
              activeOpacity={0.75}
            >
              <View style={[styles.cardIcon, { backgroundColor: item.pnr ? "#22C55E18" : "#F59E0B18" }]}>
                <IconSymbol name="airplane" size={18} color={item.pnr ? "#22C55E" : "#F59E0B"} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.passengerName, { color: colors.foreground }]} numberOfLines={1}>
                  {(item as any).passengerName ?? "—"}
                </Text>
                <Text style={[styles.bookingRef, { color: colors.muted }]}>
                  {(item as any).bookingRef ?? item.duffelOrderId?.slice(0, 14)}
                </Text>
                {item.pnr ? <Text style={[styles.pnrText, { color: colors.primary }]}>{t.pnr}: {item.pnr}</Text> : null}
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusBadge, { backgroundColor: (item.pnr ? "#22C55E" : "#F59E0B") + "20" }]}>
                  <Text style={[styles.statusText, { color: item.pnr ? "#22C55E" : "#F59E0B" }]}>
                    {item.pnr ? t.confirmed : t.pending}
                  </Text>
                </View>
                {(item as any).totalPrice ? (
                  <Text style={[styles.priceText, { color: colors.foreground }]}>
                    {parseFloat((item as any).totalPrice).toLocaleString()} {t.mru}
                  </Text>
                ) : null}
                <IconSymbol name="chevron.right" size={16} color={colors.muted} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  refreshBtn: { padding: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterScroll: { maxHeight: 48 },
  filterContent: { paddingHorizontal: 12, gap: 8, alignItems: "center" },
  filterTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterTabText: { fontSize: 13, fontWeight: "600" },
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
  cardRight: { alignItems: "flex-end", gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: "700" },
  priceText: { fontSize: 13, fontWeight: "700" },
});
