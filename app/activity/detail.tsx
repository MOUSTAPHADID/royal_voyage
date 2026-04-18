import { View, Text, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";

export default function ActivityDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isRTL } = useTranslation();
  const { id, name, city, price } = useLocalSearchParams();
  const { width } = useWindowDimensions();

  const activityDetails = {
    id,
    name: name as string,
    city: city as string,
    price: price as string,
    rating: 4.8,
    reviews: 245,
    duration: "4-5 hours",
    groupSize: "2-10 people",
    language: "English, Arabic, French",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80",
    description: isRTL
      ? "استمتع بجولة شاملة في المدينة القديمة مع دليل متخصص. تشمل الجولة أهم المعالم السياحية والأسواق التقليدية."
      : "Enjoy a comprehensive tour of the old city with a specialized guide. The tour includes major landmarks and traditional markets.",
    highlights: isRTL
      ? ["زيارة المعالم التاريخية", "جولة في الأسواق التقليدية", "تذوق الطعام المحلي", "صور تذكارية احترافية"]
      : ["Visit historical landmarks", "Tour traditional markets", "Taste local food", "Professional photos"],
    included: isRTL
      ? ["دليل سياحي متخصص", "المشروبات والوجبات الخفيفة", "التأمين السياحي", "صور رقمية"]
      : ["Professional tour guide", "Drinks and snacks", "Travel insurance", "Digital photos"],
    notIncluded: isRTL
      ? ["المدخلات المتحفية", "الغداء الرئيسي", "المشروبات الكحولية"]
      : ["Museum entries", "Main meals", "Alcoholic beverages"],
    reviews_list: [
      { name: "أحمد محمد", rating: 5, text: isRTL ? "جولة رائعة وممتعة جداً!" : "Amazing and very enjoyable tour!" },
      { name: "فاطمة علي", rating: 5, text: isRTL ? "الدليل كان احترافياً جداً" : "The guide was very professional" },
      { name: "محمود حسن", rating: 4, text: isRTL ? "تجربة جيدة لكن الوقت قصير" : "Good experience but time was short" },
    ],
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header with back button */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, flex: 1 }}>
            {isRTL ? "تفاصيل النشاط" : "Activity Details"}
          </Text>
        </View>

        {/* Activity Image */}
        <Image
          source={{ uri: activityDetails.image }}
          style={{ width: "100%", height: 250 }}
        />

        {/* Activity Info */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 16, gap: 12, backgroundColor: colors.background }}>
          <Text style={{ fontSize: 22, fontWeight: "700", color: colors.foreground }}>
            {activityDetails.name}
          </Text>

          {/* Rating and Reviews */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFD700" }}>★ {activityDetails.rating}</Text>
              <Text style={{ fontSize: 14, color: colors.muted }}>({activityDetails.reviews} {isRTL ? "تقييم" : "reviews"})</Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.muted }}>•</Text>
            <Text style={{ fontSize: 14, color: colors.muted }}>{activityDetails.city}</Text>
          </View>

          {/* Price */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10 }}>
            <Text style={{ fontSize: 14, color: colors.muted }}>{isRTL ? "السعر لكل شخص" : "Price per person"}</Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.primary }}>{activityDetails.price}</Text>
          </View>

          {/* Duration and Group Size */}
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{isRTL ? "المدة" : "Duration"}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{activityDetails.duration}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, alignItems: "center" }}>
              <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 4 }}>{isRTL ? "حجم المجموعة" : "Group Size"}</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{activityDetails.groupSize}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "الوصف" : "Description"}
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, lineHeight: 22 }}>
              {activityDetails.description}
            </Text>
          </View>

          {/* Highlights */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "المميزات" : "Highlights"}
            </Text>
            {activityDetails.highlights.map((highlight, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }} />
                <Text style={{ fontSize: 14, color: colors.foreground }}>{highlight}</Text>
              </View>
            ))}
          </View>

          {/* Included */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "ما هو مشمول" : "What's Included"}
            </Text>
            {activityDetails.included.map((item, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={colors.primary} />
                <Text style={{ fontSize: 14, color: colors.foreground }}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Not Included */}
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "ما هو غير مشمول" : "What's Not Included"}
            </Text>
            {activityDetails.notIncluded.map((item, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <IconSymbol name="xmark.circle.fill" size={18} color={colors.error} />
                <Text style={{ fontSize: 14, color: colors.foreground }}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <View style={{ gap: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              {isRTL ? "التقييمات" : "Reviews"}
            </Text>
            {activityDetails.reviews_list.map((review, idx) => (
              <View key={idx} style={{ backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 12, borderRadius: 10, gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{review.name}</Text>
                  <Text style={{ fontSize: 12, color: "#FFD700" }}>★ {review.rating}</Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.muted }}>{review.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Booking Button */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1 }}>
        <Pressable
          style={({ pressed }) => [{
            backgroundColor: colors.primary,
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => {
            router.push({
              pathname: "/activity/booking" as any,
              params: { id: activityDetails.id, name: activityDetails.name, price: activityDetails.price },
            });
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
            {isRTL ? "احجز الآن" : "Book Now"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
