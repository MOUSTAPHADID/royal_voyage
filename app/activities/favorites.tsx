import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "@/lib/i18n";
import { useFavoriteActivities, FavoriteActivity } from "@/hooks/use-favorite-activities";

export default function FavoriteActivitiesScreen() {
  const colors = useColors();
  const { t, isRTL } = useTranslation();
  const { favorites, removeFavorite, isLoaded } = useFavoriteActivities();

  const renderItem = ({ item }: { item: FavoriteActivity }) => (
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
      <Pressable
        style={[styles.removeBtn]}
        onPress={() => removeFavorite(item.code)}
      >
        <Text style={{ fontSize: 18 }}>❤️</Text>
      </Pressable>
    </Pressable>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isRTL ? "الأنشطة المفضلة" : "Favourite Activities"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {!isLoaded ? null : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 56 }}>🤍</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {isRTL ? "لا توجد أنشطة مفضلة" : "No favourite activities yet"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.muted }]}>
            {isRTL
              ? "اضغط على قلب أي نشاط لإضافته إلى المفضلة"
              : "Tap the heart icon on any activity to save it here"}
          </Text>
          <Pressable
            style={[styles.exploreBtn, { backgroundColor: "#10B981" }]}
            onPress={() => router.back()}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              {isRTL ? "استكشف الأنشطة" : "Explore Activities"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.countText, { color: colors.muted }]}>
              {favorites.length} {isRTL ? "نشاط محفوظ" : favorites.length === 1 ? "activity saved" : "activities saved"}
            </Text>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  list: { padding: 16, gap: 14 },
  countText: { fontSize: 13, marginBottom: 4 },
  card: { flexDirection: "row", borderRadius: 14, overflow: "hidden", elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  cardImage: { width: 100, height: 110 },
  cardContent: { flex: 1, padding: 10, gap: 4 },
  badge: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontWeight: "600" },
  cardTitle: { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMeta: { fontSize: 12 },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  priceLabel: { fontSize: 12 },
  price: { fontSize: 14, fontWeight: "700" },
  removeBtn: { padding: 12, justifyContent: "center", alignItems: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptySubtitle: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  exploreBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
});
