import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  TextInput,
  ListRenderItemInfo,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { DESTINATIONS, Destination } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTranslation } from "@/lib/i18n";

const CATEGORIES_AR = ["الكل", "شواطئ", "مدن", "جبال", "ثقافة", "فاخر"];
const CATEGORIES_EN = ["All", "Beach", "City", "Mountain", "Cultural", "Luxury"];

export default function ExploreScreen() {
  const router = useRouter();
  const colors = useColors();
  const { isRTL } = useTranslation();
  const [search, setSearch] = useState("");
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"destinations" | "activities">("destinations");

  const CATEGORIES = isRTL ? CATEGORIES_AR : CATEGORIES_EN;

  // Activities data
  const activities = [
    { id: "a1", name: isRTL ? "جولة معمارية" : "Architecture Tour", city: "Barcelona", price: "$45", rating: 4.8, image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80" },
    { id: "a2", name: isRTL ? "رحلة صحراء" : "Desert Safari", city: "Dubai", price: "$60", rating: 4.9, image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
    { id: "a3", name: isRTL ? "جولة برج إيفل" : "Eiffel Tower Tour", city: "Paris", price: "$35", rating: 4.7, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=80" },
    { id: "a4", name: isRTL ? "غطس ومغامرة" : "Snorkeling & Diving", city: "Palma", price: "$55", rating: 4.8, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" },
    { id: "a5", name: isRTL ? "جولة المدينة القديمة" : "Old City Tour", city: "Marrakech", price: "$40", rating: 4.6, image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
    { id: "a6", name: isRTL ? "رحلة جبلية" : "Mountain Hiking", city: "Swiss Alps", price: "$50", rating: 4.9, image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
  ];

  const filtered = activeTab === "destinations" ? DESTINATIONS.filter((d) =>
    search.trim() === "" ||
    d.city.toLowerCase().includes(search.toLowerCase()) ||
    d.country.toLowerCase().includes(search.toLowerCase())
  ) : activities.filter((a) =>
    search.trim() === "" ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.city.toLowerCase().includes(search.toLowerCase())
  );

  const renderActivity = ({ item }: any) => (
    <Pressable
      style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => {
        router.push({
          pathname: "/activity/detail" as any,
          params: { id: item.id, name: item.name, city: item.city, price: item.price },
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.destImage} />
      <View style={styles.destOverlay} />
      <View style={styles.destInfo}>
        <Text style={styles.destCity}>{item.name}</Text>
        <Text style={styles.destCountry}>{item.city}</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: "#FFD700", fontWeight: "700", fontSize: 12 }}>★ {item.rating}</Text>
          </View>
          <Text style={{ color: "#C9A84C", fontWeight: "700", fontSize: 12 }}>{item.price}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderDestination = ({ item }: ListRenderItemInfo<Destination>) => (
    <Pressable
      style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.9 : 1 }]}
      onPress={() => {
        const checkIn = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
        const checkOut = new Date(Date.now() + 19 * 86400000).toISOString().slice(0, 10);
        router.push({
          pathname: "/hotels/results" as any,
          params: { destination: item.city, checkIn, checkOut, guests: "2" },
        });
      }}
    >
      <Image source={{ uri: item.image }} style={styles.destImage} />
      <View style={styles.destOverlay} />
      {item.tag && (
        <View style={[styles.destTag, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.destTagText, { color: colors.primary }]}>{item.tag}</Text>
        </View>
      )}
      <View style={styles.destInfo}>
        <Text style={styles.destCity}>{item.city}</Text>
        <Text style={styles.destCountry}>{item.country}</Text>
        <View style={[styles.pricePill, { backgroundColor: "rgba(0,0,0,0.55)" }]}>
          <Text style={{ color: "#C9A84C", fontSize: 10, fontWeight: "700" }}>
            {isRTL
              ? `من ${(item.flightPrice / 1000).toFixed(0)}K MRU`
              : `From ${(item.flightPrice / 1000).toFixed(0)}K MRU`}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{isRTL ? "استكشف" : "Explore"}</Text>
        <Text style={styles.headerSub}>
          {isRTL ? "اكتشف وجهتك القادمة" : "Discover your next adventure"}
        </Text>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="magnifyingglass" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={[styles.searchInput, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={isRTL ? "ابحث عن وجهة..." : "Search destinations..."}
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Tab Selector */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8, backgroundColor: colors.background }}>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: activeTab === "destinations" ? colors.primary : colors.surface,
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => setActiveTab("destinations")}
        >
          <Text style={{ textAlign: "center", fontWeight: "700", color: activeTab === "destinations" ? "#fff" : colors.foreground }}>
            {isRTL ? "🏨 وجهات" : "🏨 Destinations"}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [{
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 16,
            borderRadius: 10,
            backgroundColor: activeTab === "activities" ? colors.primary : colors.surface,
            opacity: pressed ? 0.8 : 1,
          }]}
          onPress={() => setActiveTab("activities")}
        >
          <Text style={{ textAlign: "center", fontWeight: "700", color: activeTab === "activities" ? "#fff" : colors.foreground }}>
            {isRTL ? "🎯 أنشطة" : "🎯 Activities"}
          </Text>
        </Pressable>
      </View>

      {/* Categories */}
      <View style={[styles.categoriesContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
          renderItem={({ item, index }) => (
            <Pressable
              style={[
                styles.categoryChip,
                {
                  backgroundColor: categoryIdx === index ? colors.primary : colors.background,
                  borderColor: categoryIdx === index ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCategoryIdx(index)}
            >
              <Text style={[styles.categoryText, { color: categoryIdx === index ? "#FFFFFF" : colors.muted }]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Results count */}
      <View style={[styles.resultsHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.resultsCount, { color: colors.muted }]}>
          {filtered.length} {activeTab === "destinations" ? (isRTL ? "وجهة" : "destinations") : (isRTL ? "نشاط" : "activities")}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === "destinations" ? renderDestination : renderActivity}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    marginBottom: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 13,
  },
  destCard: {
    flex: 1,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
  },
  destImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  destOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: "transparent",
  },
  destTag: {
    position: "absolute",
    top: 10,
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  destTagText: {
    fontSize: 11,
    fontWeight: "700",
  },
  destInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 2,
  },
  destCity: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  destCountry: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginBottom: 4,
  },
  pricePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
});
