import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/lib/i18n";

type CategoryFilter = "all" | "tours" | "adventure" | "culture" | "nature" | "food";
type PriceFilter = "all" | "low" | "medium" | "high";

export default function ActivitiesScreen() {
  const colors = useColors();
  const { t, isRTL } = useTranslation();
  const params = useLocalSearchParams<{ destinationCode?: string; destName?: string; fromDate?: string; toDate?: string }>();

  const destinationCode = params.destinationCode || "BCN";
  const destName = params.destName || destinationCode;
  const fromDate = params.fromDate || new Date().toISOString().split("T")[0];
  const toDate = params.toDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");

  const { data: activities = [], isLoading } = trpc.hbxActivities.search.useQuery(
    { destinationCode, fromDate, toDate },
    { enabled: !!destinationCode }
  );

  // Filter logic
  const filteredActivities = useMemo(() => {
    let result = activities;

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((act) => {
        const cat = act.category?.toLowerCase() || "";
        if (categoryFilter === "tours") return cat.includes("tour") || cat.includes("جولة");
        if (categoryFilter === "adventure") return cat.includes("adventure") || cat.includes("مغامرة");
        if (categoryFilter === "culture") return cat.includes("culture") || cat.includes("ثقافة") || cat.includes("museum");
        if (categoryFilter === "nature") return cat.includes("nature") || cat.includes("طبيعة") || cat.includes("park");
        if (categoryFilter === "food") return cat.includes("food") || cat.includes("طعام") || cat.includes("culinary");
        return true;
      });
    }

    // Price filter
    if (priceFilter !== "all") {
      result = result.filter((act) => {
        const price = act.minPrice;
        if (priceFilter === "low") return price > 0 && price <= 50;
        if (priceFilter === "medium") return price > 50 && price <= 150;
        if (priceFilter === "high") return price > 150;
        return true;
      });
    }

    return result;
  }, [activities, categoryFilter, priceFilter]);

  const renderActivity = ({ item }: { item: typeof activities[0] }) => (
    <Pressable
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => router.push({ pathname: "/activities/[id]", params: { id: item.code, name: item.name } } as any)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        {item.category ? (
          <View style={[styles.badge, { backgroundColor: "#10B981" + "20" }]}>
            <Text style={[styles.badgeText, { color: "#10B981" }]}>{item.category}</Text>
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
          <Text style={[styles.priceLabel, { color: colors.muted }]}>{isRTL ? "من " : "From "}</Text>
          <Text style={[styles.price, { color: "#10B981" }]}>
            {item.minPrice > 0 ? `${item.minPrice} ${item.currency}` : (isRTL ? "اتصل للسعر" : "Contact for price")}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  const categoryOptions: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: "all", label: isRTL ? "الكل" : "All", icon: "🌍" },
    { key: "tours", label: isRTL ? "جولات" : "Tours", icon: "🚌" },
    { key: "adventure", label: isRTL ? "مغامرة" : "Adventure", icon: "🏔️" },
    { key: "culture", label: isRTL ? "ثقافة" : "Culture", icon: "🏛️" },
    { key: "nature", label: isRTL ? "طبيعة" : "Nature", icon: "🌳" },
    { key: "food", label: isRTL ? "طعام" : "Food", icon: "🍽️" },
  ];

  const priceOptions: { key: PriceFilter; label: string }[] = [
    { key: "all", label: isRTL ? "كل الأسعار" : "All Prices" },
    { key: "low", label: isRTL ? "< 50" : "< 50" },
    { key: "medium", label: isRTL ? "50-150" : "50-150" },
    { key: "high", label: isRTL ? "> 150" : "> 150" },
  ];

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isRTL ? "الأنشطة السياحية" : "Activities"}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>{destName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={[styles.filtersSection, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {categoryOptions.map((opt) => (
            <Pressable
              key={opt.key}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: categoryFilter === opt.key ? "#10B981" : colors.surface,
                  borderColor: categoryFilter === opt.key ? "#10B981" : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => setCategoryFilter(opt.key)}
            >
              <Text style={styles.filterIcon}>{opt.icon}</Text>
              <Text style={[styles.filterLabel, { color: categoryFilter === opt.key ? "#fff" : colors.foreground }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Price filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {priceOptions.map((opt) => (
            <Pressable
              key={opt.key}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor: priceFilter === opt.key ? "#10B981" : colors.surface,
                  borderColor: priceFilter === opt.key ? "#10B981" : colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={() => setPriceFilter(opt.key)}
            >
              <Text style={[styles.filterLabel, { color: priceFilter === opt.key ? "#fff" : colors.foreground }]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>{isRTL ? "جاري البحث..." : "Searching..."}</Text>
        </View>
      ) : filteredActivities.length === 0 ? (
        <View style={styles.center}>
          <IconSymbol name="binoculars.fill" size={48} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {isRTL ? "لا توجد أنشطة" : "No activities found"}
          </Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {isRTL ? "جرّب تغيير الفلاتر أو الوجهة" : "Try changing filters or destination"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredActivities}
          keyExtractor={(item) => item.code}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultsCount, { color: colors.muted }]}>
              {filteredActivities.length} {isRTL ? "نشاط في" : "activities in"} {destName}
            </Text>
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
  headerSubtitle: { fontSize: 12, marginTop: 2 },
  filtersSection: { paddingVertical: 12, borderBottomWidth: 0.5 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 4 },
  filterIcon: { fontSize: 14 },
  filterLabel: { fontSize: 13, fontWeight: "600" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  loadingText: { fontSize: 14, marginTop: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
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
