import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

function getDefaultDates() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { from: fmt(today), to: fmt(nextWeek) };
}

export default function ActivitiesScreen() {
  const colors = useColors();
  const { from, to } = getDefaultDates();
  const [destination, setDestination] = useState("BCN");
  const [searchInput, setSearchInput] = useState("BCN");

  const { data: activities = [], isLoading } = trpc.hbxActivities.search.useQuery(
    { destinationCode: destination, fromDate: from, toDate: to },
    { enabled: !!destination }
  );

  const handleSearch = () => {
    if (searchInput.trim()) {
      setDestination(searchInput.trim().toUpperCase());
    }
  };

  const renderActivity = ({ item }: { item: typeof activities[0] }) => (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => router.push({ pathname: "/activities/[id]", params: { id: item.code, name: item.name } } as any)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        {item.category ? (
          <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{item.category}</Text>
          </View>
        ) : null}
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.cardRow}>
          <IconSymbol name="location.fill" size={13} color={colors.muted} />
          <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.city}</Text>
        </View>
        {item.duration ? (
          <View style={styles.cardRow}>
            <IconSymbol name="clock.fill" size={13} color={colors.muted} />
            <Text style={[styles.cardMeta, { color: colors.muted }]}>{item.duration}</Text>
          </View>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={[styles.priceLabel, { color: colors.muted }]}>من </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.minPrice > 0 ? `${item.minPrice} ${item.currency}` : "اتصل للسعر"}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>الأنشطة السياحية</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.muted} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="رمز الوجهة (BCN، PMI، PAR...)"
          placeholderTextColor={colors.muted}
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCapitalize="characters"
        />
        <Pressable
          style={({ pressed }) => [styles.searchBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
          onPress={handleSearch}
        >
          <Text style={styles.searchBtnText}>بحث</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>جاري البحث...</Text>
        </View>
      ) : activities.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="binoculars.fill" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد أنشطة</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>جرّب رمز وجهة مختلف مثل BCN أو PMI</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.code}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: colors.muted }]}>{activities.length} نشاط في {destination}</Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  searchBar: { flexDirection: "row", alignItems: "center", margin: 16, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, textAlign: "right" },
  searchBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  searchBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  loadingText: { fontSize: 14, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  resultsCount: { fontSize: 13, marginBottom: 12, textAlign: "right" },
  card: { borderRadius: 16, marginBottom: 16, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardImage: { width: "100%", height: 180 },
  cardContent: { padding: 14, gap: 6 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  cardTitle: { fontSize: 15, fontWeight: "700", lineHeight: 22 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMeta: { fontSize: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  priceLabel: { fontSize: 12 },
  price: { fontSize: 16, fontWeight: "700" },
});
