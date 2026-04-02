import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Image, StyleSheet, Alert, Platform, TextInput } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/lib/i18n";
import MapView, { Marker } from "react-native-maps";

export default function ActivityDetailScreen() {
  const colors = useColors();
  const { t, isRTL } = useTranslation();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

  const { data: activity, isLoading } = trpc.hbxActivities.detail.useQuery(
    { code: id || "" },
    { enabled: !!id }
  );

  // Reviews state
  const { data: reviews = [], refetch: refetchReviews } = trpc.activityReviews.list.useQuery(
    { activityCode: id || "" },
    { enabled: !!id }
  );
  const addReviewMutation = trpc.activityReviews.add.useMutation({
    onSuccess: () => {
      refetchReviews();
      setReviewName("");
      setReviewComment("");
      setReviewRating(5);
      setShowReviewForm(false);
      Alert.alert(isRTL ? "شكراً!" : "Thank you!", isRTL ? "تم إضافة تقييمك بنجاح." : "Your review has been submitted.");
    },
    onError: () => Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "فشل إضافة التقييم." : "Failed to submit review."),
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRating, setReviewRating] = useState(5);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleSubmitReview = () => {
    if (!reviewName.trim()) {
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "الرجاء إدخال اسمك." : "Please enter your name.");
      return;
    }
    addReviewMutation.mutate({
      activityCode: id || "",
      reviewerName: reviewName.trim(),
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
      language: isRTL ? "ar" : "en",
    });
  };

  const handleBookActivity = () => {
    if (!activity) return;
    
    // Navigate to booking screen with activity details
    router.push({
      pathname: "/activities/booking" as any,
      params: {
        activityCode: activity.code,
        activityName: activity.name,
        price: activity.minPrice.toString(),
        currency: activity.currency,
        date: new Date().toISOString().split("T")[0],
      },
    });
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

          {/* Location Map Section */}
          {(activity.latitude && activity.longitude && Platform.OS !== "web") ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{isRTL ? "موقع النشاط" : "Activity Location"}</Text>
              <View style={[styles.mapContainer, { borderColor: colors.border }]}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={true}
                >
                  <Marker
                    coordinate={{ latitude: activity.latitude, longitude: activity.longitude }}
                    title={activity.name}
                    description={activity.city}
                    pinColor="#10B981"
                  />
                </MapView>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <IconSymbol name="location.fill" size={14} color="#10B981" />
                <Text style={{ fontSize: 13, color: colors.muted }}>{activity.city}{activity.country ? `, ${activity.country}` : ""}</Text>
              </View>
            </View>
          ) : null}

          {/* Customer Reviews Section */}
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{isRTL ? "تقييمات العملاء" : "Customer Reviews"}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                {avgRating && <Text style={{ fontSize: 20, fontWeight: "800", color: "#F59E0B" }}>{avgRating}</Text>}
                {avgRating && <Text style={{ fontSize: 14, color: colors.muted }}>/5</Text>}
              </View>
            </View>
            {/* Stars summary */}
            {avgRating && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 12 }}>
                {[1,2,3,4,5].map((s) => (
                  <Text key={s} style={{ fontSize: 16, color: s <= Math.round(parseFloat(avgRating)) ? "#F59E0B" : colors.border }}>★</Text>
                ))}
                <Text style={{ fontSize: 13, color: colors.muted, marginLeft: 6 }}>({reviews.length} {isRTL ? "تقييم" : "reviews"})</Text>
              </View>
            )}
            {/* Review cards */}
            {reviews.length === 0 ? (
              <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 12 }}>{isRTL ? "لا توجد تقييمات بعد. كن أول من يقيّم!" : "No reviews yet. Be the first to review!"}</Text>
            ) : reviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#10B981" + "20", alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: "#10B981" }}>{review.reviewerName[0]?.toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{review.reviewerName}</Text>
                      <Text style={{ fontSize: 11, color: colors.muted }}>{new Date(review.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 2 }}>
                    {[1,2,3,4,5].map((s) => (
                      <Text key={s} style={{ fontSize: 12, color: s <= review.rating ? "#F59E0B" : colors.border }}>★</Text>
                    ))}
                  </View>
                </View>
                {review.comment ? <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 20 }}>{review.comment}</Text> : null}
              </View>
            ))}

            {/* Add Review Button */}
            {!showReviewForm ? (
              <Pressable
                style={({ pressed }) => [{ backgroundColor: "#F59E0B" + "15", borderColor: "#F59E0B", borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: "center", opacity: pressed ? 0.7 : 1, marginTop: 8 }]}
                onPress={() => setShowReviewForm(true)}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#F59E0B" }}>{isRTL ? "+ أضف تقييمك" : "+ Add Your Review"}</Text>
              </Pressable>
            ) : (
              <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border, marginTop: 8, gap: 12 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground }}>{isRTL ? "أضف تقييمك" : "Add Your Review"}</Text>
                {/* Rating stars */}
                <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.muted }}>{isRTL ? "التقييم:" : "Rating:"}</Text>
                  {[1,2,3,4,5].map((s) => (
                    <Pressable key={s} onPress={() => setReviewRating(s)}>
                      <Text style={{ fontSize: 28, color: s <= reviewRating ? "#F59E0B" : colors.border }}>★</Text>
                    </Pressable>
                  ))}
                </View>
                {/* Name */}
                <TextInput
                  value={reviewName}
                  onChangeText={setReviewName}
                  placeholder={isRTL ? "اسمك" : "Your name"}
                  placeholderTextColor={colors.muted}
                  style={{ backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground }}
                />
                {/* Comment */}
                <TextInput
                  value={reviewComment}
                  onChangeText={setReviewComment}
                  placeholder={isRTL ? "اكتب تعليقك (اختياري)" : "Write your comment (optional)"}
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                  style={{ backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: colors.foreground, minHeight: 80, textAlignVertical: "top" }}
                />
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    style={({ pressed }) => [{ flex: 1, backgroundColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: "center", opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => setShowReviewForm(false)}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{isRTL ? "إلغاء" : "Cancel"}</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [{ flex: 2, backgroundColor: "#F59E0B", borderRadius: 10, paddingVertical: 12, alignItems: "center", opacity: (pressed || addReviewMutation.isPending) ? 0.7 : 1 }]}
                    onPress={handleSubmitReview}
                    disabled={addReviewMutation.isPending}
                  >
                    {addReviewMutation.isPending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>{isRTL ? "إرسال التقييم" : "Submit Review"}</Text>
                    }
                  </Pressable>
                </View>
              </View>
            )}
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
  reviewCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  mapContainer: { borderRadius: 14, overflow: "hidden", borderWidth: 1, height: 200, marginTop: 8 },
  map: { width: "100%", height: "100%" },
});
