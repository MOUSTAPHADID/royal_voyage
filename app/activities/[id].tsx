import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function ActivityDetailScreen() {
  const colors = useColors();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const { data: activity, isLoading } = trpc.hbxActivities.detail.useQuery(
    { code: id || "" },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{name || "النشاط"}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>جاري التحميل...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!activity) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>النشاط</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.warning} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لم يتم العثور على النشاط</Text>
          <Pressable style={({ pressed }) => [styles.backBtnLarge, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>العودة</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{activity.name}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Image source={{ uri: activity.image }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.content}>
          {activity.category ? (
            <View style={[styles.badge, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{activity.category}</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>{activity.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <IconSymbol name="location.fill" size={16} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.muted }]}>{activity.city}{activity.country ? `, ${activity.country}` : ""}</Text>
            </View>
            {activity.duration ? (
              <View style={styles.metaItem}>
                <IconSymbol name="clock.fill" size={16} color={colors.primary} />
                <Text style={[styles.metaText, { color: colors.muted }]}>{activity.duration}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.priceLabel, { color: colors.muted }]}>السعر يبدأ من</Text>
            <Text style={[styles.priceValue, { color: colors.primary }]}>
              {activity.minPrice > 0 ? `${activity.minPrice} ${activity.currency}` : "اتصل للسعر"}
            </Text>
          </View>
          {activity.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>عن النشاط</Text>
              <Text style={[styles.description, { color: colors.muted }]}>{activity.description}</Text>
            </View>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.bookBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => Linking.openURL("https://royalvoyage.online")}
          >
            <Text style={styles.bookBtnText}>احجز هذا النشاط</Text>
            <IconSymbol name="arrow.right" size={18} color="#fff" />
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: "700", textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  loadingText: { fontSize: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  backBtnLarge: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  backBtnText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  scrollContent: { paddingBottom: 40 },
  heroImage: { width: "100%", height: 240 },
  content: { padding: 20, gap: 14 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  title: { fontSize: 22, fontWeight: "800", lineHeight: 30 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14 },
  priceCard: { borderRadius: 14, padding: 16, borderWidth: 1, alignItems: "center" },
  priceLabel: { fontSize: 13, marginBottom: 4 },
  priceValue: { fontSize: 26, fontWeight: "800" },
  section: { gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  description: { fontSize: 14, lineHeight: 22 },
  bookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 16, borderRadius: 14, gap: 8, marginTop: 8 },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
