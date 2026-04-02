import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet, Alert } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/lib/i18n";

export default function ActivityDetailScreen() {
  const colors = useColors();
  const { t, isRTL } = useTranslation();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const { data: activity, isLoading } = trpc.hbxActivities.detail.useQuery(
    { code: id || "" },
    { enabled: !!id }
  );

  const handleBookActivity = () => {
    if (!activity) return;
    
    Alert.alert(
      isRTL ? "حجز النشاط" : "Book Activity",
      isRTL 
        ? `هل تريد حجز "${activity.name}"؟\n\nسيتم توجيهك إلى صفحة الحجز.`
        : `Do you want to book "${activity.name}"?\n\nYou will be redirected to the booking page.`,
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "متابعة" : "Continue",
          onPress: () => {
            // TODO: Navigate to activity booking screen when implemented
            Alert.alert(
              isRTL ? "قريباً" : "Coming Soon",
              isRTL 
                ? "سيتم إضافة نظام الحجز قريباً. يرجى الاتصال بنا على +22233700000"
                : "Booking system coming soon. Please contact us at +22233700000"
            );
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{name || (isRTL ? "النشاط" : "Activity")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>{isRTL ? "جاري التحميل..." : "Loading..."}</Text>
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
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isRTL ? "النشاط" : "Activity"}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.warning} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{isRTL ? "لم يتم العثور على النشاط" : "Activity not found"}</Text>
          <Pressable style={({ pressed }) => [styles.backBtnLarge, { backgroundColor: "#10B981", opacity: pressed ? 0.8 : 1 }]} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>{isRTL ? "العودة" : "Go Back"}</Text>
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
            <View style={[styles.badge, { backgroundColor: "#10B981" + "20" }]}>
              <Text style={[styles.badgeText, { color: "#10B981" }]}>{activity.category}</Text>
            </View>
          ) : null}
          <Text style={[styles.title, { color: colors.foreground }]}>{activity.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <IconSymbol name="location.fill" size={16} color="#10B981" />
              <Text style={[styles.metaText, { color: colors.muted }]}>{activity.city}{activity.country ? `, ${activity.country}` : ""}</Text>
            </View>
            {activity.duration ? (
              <View style={styles.metaItem}>
                <IconSymbol name="clock.fill" size={16} color="#10B981" />
                <Text style={[styles.metaText, { color: colors.muted }]}>{activity.duration}</Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.priceCard, { backgroundColor: "#10B981" + "10", borderColor: "#10B981" + "30" }]}>
            <Text style={[styles.priceLabel, { color: colors.muted }]}>{isRTL ? "السعر يبدأ من" : "Price starts from"}</Text>
            <Text style={[styles.priceValue, { color: "#10B981" }]}>
              {activity.minPrice > 0 ? `${activity.minPrice} ${activity.currency}` : (isRTL ? "اتصل للسعر" : "Contact for price")}
            </Text>
          </View>
          {activity.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{isRTL ? "عن النشاط" : "About this activity"}</Text>
              <Text style={[styles.description, { color: colors.muted }]}>{activity.description}</Text>
            </View>
          ) : null}
          
          {/* Highlights section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{isRTL ? "ما يميز هذا النشاط" : "Highlights"}</Text>
            <View style={styles.highlightsList}>
              <View style={styles.highlightItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" />
                <Text style={[styles.highlightText, { color: colors.muted }]}>
                  {isRTL ? "دليل سياحي محترف" : "Professional tour guide"}
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" />
                <Text style={[styles.highlightText, { color: colors.muted }]}>
                  {isRTL ? "إلغاء مجاني حتى 24 ساعة قبل البدء" : "Free cancellation up to 24h before"}
                </Text>
              </View>
              <View style={styles.highlightItem}>
                <IconSymbol name="checkmark.circle.fill" size={18} color="#10B981" />
                <Text style={[styles.highlightText, { color: colors.muted }]}>
                  {isRTL ? "تأكيد فوري" : "Instant confirmation"}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.bookBtn, { backgroundColor: "#10B981", opacity: pressed ? 0.85 : 1 }]}
            onPress={handleBookActivity}
          >
            <Text style={styles.bookBtnText}>{isRTL ? "احجز هذا النشاط" : "Book this activity"}</Text>
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
  heroImage: { width: "100%", height: 260 },
  content: { padding: 20, gap: 16 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  title: { fontSize: 24, fontWeight: "800", lineHeight: 32 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14 },
  priceCard: { borderRadius: 14, padding: 18, borderWidth: 1, alignItems: "center" },
  priceLabel: { fontSize: 13, marginBottom: 6 },
  priceValue: { fontSize: 28, fontWeight: "800" },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  description: { fontSize: 15, lineHeight: 24 },
  highlightsList: { gap: 12 },
  highlightItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  highlightText: { flex: 1, fontSize: 14, lineHeight: 20 },
  bookBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 14, gap: 8, marginTop: 12 },
  bookBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
