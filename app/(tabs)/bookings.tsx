import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ListRenderItemInfo,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { Booking } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";

type FilterTab = "all" | "flights" | "hotels";

export default function BookingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const [filter, setFilter] = useState<FilterTab>("all");
  const { t, isRTL } = useTranslation();

  // حقول البحث
  const [searchRef, setSearchRef] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [searchResult, setSearchResult] = useState<typeof bookings | null>(null);

  const handleSearch = () => {
    const ref = searchRef.trim().toUpperCase();
    const name = searchName.trim().toLowerCase();
    if (!ref && !name) return;

    const results = bookings.filter((b) => {
      const refMatch = ref ? b.reference.toUpperCase().includes(ref) : true;
      const nameMatch = name
        ? (b.passengerName ?? b.guestName ?? "").toLowerCase().includes(name)
        : true;
      return refMatch && nameMatch;
    });
    setSearchResult(results);
  };

  const handleClearSearch = () => {
    setSearchRef("");
    setSearchName("");
    setSearchResult(null);
    setSearchMode(false);
  };

  const displayList = searchResult !== null ? searchResult : bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "flights") return b.type === "flight";
    return b.type === "hotel";
  });

  const statusColors: Record<string, { bg: string; text: string }> = {
    confirmed: { bg: colors.success + "15", text: colors.success },
    pending: { bg: colors.warning + "15", text: colors.warning },
    cancelled: { bg: colors.error + "15", text: colors.error },
  };

  const renderBooking = ({ item }: ListRenderItemInfo<Booking>) => {
    const statusStyle = statusColors[item.status] ?? statusColors.pending;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.bookingCard,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
        ]}
        onPress={() => router.push({ pathname: "/booking/detail" as any, params: { id: item.id } })}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: item.type === "flight" ? colors.primary + "15" : colors.secondary + "20" }]}>
            <Text style={{ fontSize: 22 }}>{item.type === "flight" ? "✈" : "🏨"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bookingTitle, { color: colors.foreground }]}>
              {item.type === "flight"
                ? `${item.flight?.originCode} → ${item.flight?.destinationCode}`
                : item.hotel?.name ?? "Hotel"}
            </Text>
            <Text style={[styles.bookingRef, { color: colors.muted }]}>{item.reference}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {item.status === "confirmed" ? t.myBookings.confirmed : item.status === "cancelled" ? t.myBookings.cancelled : t.myBookings.pending}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailsRow, { borderTopColor: colors.border }]}>
          {item.type === "flight" ? (
            <>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>{t.myBookings.airline}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.flight?.airline}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>{t.myBookings.date}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.date}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>{t.myBookings.passengers}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.passengers ?? 1}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>{t.home.checkIn}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.checkIn}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>{t.home.checkOut}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.checkOut}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>{t.home.guests}</Text>
                <Text style={[styles.detailValue, { color: colors.foreground }]}>{item.guests ?? 1}</Text>
              </View>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.totalPrice, { color: colors.primary }]}>${item.totalPrice}</Text>
          <Pressable
            style={({ pressed }) => [styles.viewBtn, { backgroundColor: colors.primary + "15", opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.push({ pathname: "/booking/detail" as any, params: { id: item.id } })}
          >
            <Text style={[styles.viewBtnText, { color: colors.primary }]}>{t.myBookings.viewDetails}</Text>
            <IconSymbol name="chevron.right" size={14} color={colors.primary} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t.myBookings.title}</Text>
        <Text style={styles.headerSub}>{bookings.length} {t.myBookings.totalReservations}</Text>
      </View>

      {/* Search Bar */}
      {searchMode ? (
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder={isRTL ? "رقم الحجز (RV...)" : "Booking ref (RV...)"}
            placeholderTextColor={colors.muted}
            value={searchRef}
            onChangeText={setSearchRef}
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
            placeholder={isRTL ? "الاسم العائلي" : "Last name"}
            placeholderTextColor={colors.muted}
            value={searchName}
            onChangeText={setSearchName}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <View style={styles.searchActions}>
            <Pressable
              style={({ pressed }) => [styles.searchBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleSearch}
            >
              <IconSymbol name="magnifyingglass" size={16} color="#fff" />
              <Text style={styles.searchBtnText}>{isRTL ? "بحث" : "Search"}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.clearBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
              onPress={handleClearSearch}
            >
              <Text style={[styles.clearBtnText, { color: colors.muted }]}>{isRTL ? "إلغاء" : "Cancel"}</Text>
            </Pressable>
          </View>
          {searchResult !== null && (
            <Text style={[styles.searchResultCount, { color: colors.muted }]}>
              {isRTL
                ? `تم العثور على ${searchResult.length} حجز`
                : `${searchResult.length} booking(s) found`}
            </Text>
          )}
        </View>
      ) : (
        <Pressable
          style={[styles.searchToggle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          onPress={() => setSearchMode(true)}
        >
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <Text style={[styles.searchToggleText, { color: colors.muted }]}>
            {isRTL ? "بحث برقم الحجز أو الاسم العائلي..." : "Search by booking ref or last name..."}
          </Text>
        </Pressable>
      )}

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {(["all", "flights", "hotels"] as FilterTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.filterTab,
              filter === tab && { borderBottomColor: colors.secondary, borderBottomWidth: 2 },
            ]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === tab ? colors.secondary : colors.muted },
              ]}
            >
              {tab === "all" ? t.myBookings.all : tab === "flights" ? `✈ ${t.home.flights}` : `🏨 ${t.home.hotels}`}
            </Text>
          </Pressable>
        ))}
      </View>

      {displayList.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{searchResult !== null ? "🔍" : "🗺️"}</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {searchResult !== null
              ? (isRTL ? "لا توجد نتائج" : "No results found")
              : t.myBookings.noBookings}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {searchResult !== null
              ? (isRTL ? "تحقق من رقم الحجز أو الاسم العائلي" : "Check the booking ref or last name")
              : t.myBookings.noBookingsHint}
          </Text>
          {searchResult === null && (
            <Pressable
              style={({ pressed }) => [styles.exploreBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push("/(tabs)" as any)}
            >
              <Text style={styles.exploreBtnText}>{t.myBookings.exploreNow}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  filterBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bookingCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 3,
  },
  bookingRef: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  detailsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: "700",
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  viewBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  exploreBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  searchToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchToggleText: {
    fontSize: 14,
  },
  searchBox: {
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  searchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  searchBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  clearBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchResultCount: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
});
