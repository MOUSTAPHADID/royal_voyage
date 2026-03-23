import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  ListRenderItemInfo,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { HOTELS, Hotel } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

type SortOption = "price" | "rating" | "stars";

export default function HotelResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    destination: string;
    checkIn: string;
    checkOut: string;
    guests: string;
  }>();

  const [sortBy, setSortBy] = useState<SortOption>("rating");

  const sortedHotels = [...HOTELS].sort((a, b) => {
    if (sortBy === "price") return a.pricePerNight - b.pricePerNight;
    if (sortBy === "rating") return b.rating - a.rating;
    return b.stars - a.stars;
  });

  const renderStars = (count: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ fontSize: 12, color: i < count ? "#C9A84C" : "#D1D5DB" }}>★</Text>
    ));

  const renderHotel = ({ item }: ListRenderItemInfo<Hotel>) => (
    <Pressable
      style={({ pressed }) => [
        styles.hotelCard,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() => router.push({ pathname: "/hotels/detail" as any, params: { id: item.id } })}
    >
      <Image source={{ uri: item.image }} style={styles.hotelImage} />
      <View style={[styles.hotelBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.hotelBadgeText}>{item.stars}★</Text>
      </View>

      <View style={styles.hotelInfo}>
        <View style={styles.hotelHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hotelName, { color: colors.foreground }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.locationRow}>
              <IconSymbol name="location.fill" size={12} color={colors.muted} />
              <Text style={[styles.hotelLocation, { color: colors.muted }]}>
                {item.city}, {item.country}
              </Text>
            </View>
          </View>
          <View style={styles.priceBox}>
            <Text style={[styles.hotelPrice, { color: colors.primary }]}>${item.pricePerNight}</Text>
            <Text style={[styles.perNight, { color: colors.muted }]}>/ night</Text>
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.starsRow}>{renderStars(item.stars)}</View>
          <View style={[styles.ratingBadge, { backgroundColor: colors.success + "15" }]}>
            <Text style={[styles.ratingText, { color: colors.success }]}>⭐ {item.rating}</Text>
          </View>
          <Text style={[styles.reviewCount, { color: colors.muted }]}>({item.reviewCount.toLocaleString()})</Text>
        </View>

        <View style={styles.amenitiesRow}>
          {item.amenities.slice(0, 4).map((a) => (
            <View key={a} style={[styles.amenityChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.amenityChipText, { color: colors.muted }]}>{a}</Text>
            </View>
          ))}
          {item.amenities.length > 4 && (
            <Text style={[styles.moreAmenities, { color: colors.muted }]}>+{item.amenities.length - 4}</Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [styles.viewBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() => router.push({ pathname: "/hotels/detail" as any, params: { id: item.id } })}
        >
          <Text style={styles.viewBtnText}>View Rooms</Text>
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{params.destination ?? "Dubai"}</Text>
          <Text style={styles.headerSub}>
            {params.checkIn ?? "Apr 20"} – {params.checkOut ?? "Apr 25"} · {params.guests ?? 2} guests
          </Text>
        </View>
        <Pressable style={[styles.filterBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="slider.horizontal.3" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Sort */}
      <View style={[styles.sortBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.sortLabel, { color: colors.muted }]}>Sort by:</Text>
        {(["rating", "price", "stars"] as SortOption[]).map((opt) => (
          <Pressable
            key={opt}
            style={[styles.sortChip, sortBy === opt && { backgroundColor: colors.primary }]}
            onPress={() => setSortBy(opt)}
          >
            <Text style={[styles.sortChipText, { color: sortBy === opt ? "#FFFFFF" : colors.muted }]}>
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.resultsCount, { backgroundColor: colors.background }]}>
        <Text style={[styles.resultsText, { color: colors.muted }]}>
          {sortedHotels.length} hotels found
        </Text>
      </View>

      <FlatList
        data={sortedHotels}
        keyExtractor={(item) => item.id}
        renderItem={renderHotel}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.background }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 2,
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  sortBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  sortLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 13,
  },
  hotelCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  hotelImage: {
    width: "100%",
    height: 200,
  },
  hotelBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotelBadgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  hotelInfo: {
    padding: 16,
    gap: 10,
  },
  hotelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  hotelName: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hotelLocation: {
    fontSize: 13,
  },
  priceBox: {
    alignItems: "flex-end",
  },
  hotelPrice: {
    fontSize: 22,
    fontWeight: "700",
  },
  perNight: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsRow: {
    flexDirection: "row",
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "700",
  },
  reviewCount: {
    fontSize: 12,
  },
  amenitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  amenityChipText: {
    fontSize: 12,
  },
  moreAmenities: {
    fontSize: 12,
    alignSelf: "center",
  },
  viewBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  viewBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
