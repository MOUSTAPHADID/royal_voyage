import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  ListRenderItemInfo,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { HOTELS, Hotel } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/lib/i18n";
import { formatPriceMRU, toMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";

type SortOption = "price" | "rating" | "stars";

type AnyHotel = {
  id: string;
  hotelId?: string;
  name: string;
  city: string;
  country: string;
  rating: number;
  stars: number;
  pricePerNight: number;
  currency?: string;
  amenities: string[];
  description?: string;
  address?: string;
  image: string;
  reviewCount?: number;
};

export default function HotelResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    destination: string;
    destinationCode: string;
    checkIn: string;
    checkOut: string;
    guests: string;
    useMock: string;
  }>();

  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  // Always use Duffel Production API
  const useMock = false;

  // Duffel Production API hotel search
  const { data: amadeusResult, isLoading, isError } = trpc.amadeus.searchHotels.useQuery(
    {
      cityCode: params.destinationCode || "",
      checkInDate: params.checkIn || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      checkOutDate: params.checkOut || new Date(Date.now() + 33 * 86400000).toISOString().slice(0, 10),
      adults: parseInt(params.guests || "2", 10),
      rooms: 1,
    },
    {
      enabled: true,
      retry: 2,
    }
  );

  const amadeusHotels: AnyHotel[] = (amadeusResult?.data ?? []) as AnyHotel[];

  // Use live Duffel data; fallback to mock only if API fails
  const rawHotels: AnyHotel[] = amadeusResult?.success && amadeusHotels.length > 0
    ? amadeusHotels
    : isLoading
    ? []
    : (HOTELS as unknown as AnyHotel[]);

  const sortedHotels = useMemo(() => {
    return [...rawHotels].sort((a, b) => {
      if (sortBy === "price") return (a.pricePerNight || 0) - (b.pricePerNight || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return (b.stars || 0) - (a.stars || 0);
    });
  }, [rawHotels, sortBy]);

  const renderStars = (count: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ fontSize: 12, color: i < count ? "#C9A84C" : "#D1D5DB" }}>
        ★
      </Text>
    ));

  const renderHotel = ({ item }: ListRenderItemInfo<AnyHotel>) => (
    <Pressable
      style={({ pressed }) => [
        styles.hotelCard,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() =>
        router.push({
          pathname: "/hotels/detail" as any,
          params: {
            id: item.id,
            name: item.name,
            city: item.city,
            country: item.country,
            rating: String(item.rating),
            stars: String(item.stars),
            pricePerNight: String(item.pricePerNight),
            currency: item.currency || "USD",
            amenities: JSON.stringify(item.amenities),
            description: item.description || "",
            address: item.address || "",
            image: item.image,
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests,
          },
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.hotelImage} />
      <View style={[styles.hotelBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.hotelBadgeText}>{item.stars}★</Text>
      </View>

      <View style={styles.hotelInfo}>
        <View style={styles.hotelHeader}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.hotelName, { color: colors.foreground }]}
              numberOfLines={1}
            >
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
            {item.pricePerNight > 0 ? (
              <>
                <Text style={[styles.hotelPrice, { color: colors.primary }]}>
                  {fmt(toMRU(item.pricePerNight, item.currency || "USD"))}
                </Text>
                <Text style={[styles.perNight, { color: colors.muted }]}>{t.hotels.perNight}</Text>
              </>
            ) : (
              <Text style={[styles.priceNA, { color: colors.muted }]}>{t.hotels.priceOnRequest}</Text>
            )}
          </View>
        </View>

        <View style={styles.ratingRow}>
          <View style={styles.starsRow}>{renderStars(item.stars)}</View>
          <View style={[styles.ratingBadge, { backgroundColor: colors.success + "15" }]}>
            <Text style={[styles.ratingText, { color: colors.success }]}>
              ⭐ {item.rating.toFixed(1)}
            </Text>
          </View>
          {item.reviewCount ? (
            <Text style={[styles.reviewCount, { color: colors.muted }]}>
              ({item.reviewCount.toLocaleString("en-US")})
            </Text>
          ) : null}
        </View>

        <View style={styles.amenitiesRow}>
          {item.amenities.slice(0, 4).map((a) => (
            <View
              key={a}
              style={[
                styles.amenityChip,
                { backgroundColor: colors.background, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.amenityChipText, { color: colors.muted }]}>{a}</Text>
            </View>
          ))}
          {item.amenities.length > 4 && (
            <Text style={[styles.moreAmenities, { color: colors.muted }]}>
              +{item.amenities.length - 4}
            </Text>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.viewBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            router.push({
              pathname: "/hotels/detail" as any,
              params: {
                id: item.id,
                name: item.name,
                city: item.city,
                country: item.country,
                rating: String(item.rating),
                stars: String(item.stars),
                pricePerNight: String(item.pricePerNight),
                currency: item.currency || "USD",
                amenities: JSON.stringify(item.amenities),
                description: item.description || "",
                address: item.address || "",
                image: item.image,
                checkIn: params.checkIn,
                checkOut: params.checkOut,
                guests: params.guests,
              },
            })
          }
        >
          <Text style={styles.viewBtnText}>{t.hotels.viewRooms}</Text>
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
          <Text style={styles.headerTitle}>{params.destination ?? ""}</Text>
          <Text style={styles.headerSub}>
            {params.checkIn
              ? new Date(params.checkIn).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Check-in"}{" "}
            –{" "}
            {params.checkOut
              ? new Date(params.checkOut).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Check-out"}{" "}
            · {params.guests ?? 2} guests
          </Text>
        </View>
        <Pressable
          style={[styles.filterBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
        >
          <IconSymbol name="slider.horizontal.3" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Sort */}
      <View
        style={[
          styles.sortBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
          <Text style={[styles.sortLabel, { color: colors.muted }]}>{t.flights.sortBy}</Text>
        {(["rating", "price", "stars"] as SortOption[]).map((opt) => (
          <Pressable
            key={opt}
            style={[styles.sortChip, sortBy === opt && { backgroundColor: colors.primary }]}
            onPress={() => setSortBy(opt)}
          >
            <Text
              style={[
                styles.sortChipText,
                { color: sortBy === opt ? "#FFFFFF" : colors.muted },
              ]}
            >
              {opt === "rating" ? t.hotels.rating : opt === "price" ? t.flights.price : t.hotels.stars}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Loading */}
      {isLoading && !useMock ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            {t.hotels.searching}
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.resultsCount, { backgroundColor: colors.background }]}>
            <Text style={[styles.resultsText, { color: colors.muted }]}>
              {sortedHotels.length} {t.hotels.hotelsFound}
              {!useMock && amadeusResult?.success ? " · ✅" : " · 📊"}
            </Text>
            {isError && (
              <Text style={[styles.errorNote, { color: colors.warning }]}>
                {t.hotels.liveUnavailable}
              </Text>
            )}
          </View>

          <FlatList
            data={sortedHotels}
            keyExtractor={(item) => item.id}
            renderItem={renderHotel}
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: colors.background }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 40 }}>🏨</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.hotels.noHotels}</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  {t.hotels.noHotelsHint}
                </Text>
              </View>
            }
          />
        </>
      )}
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
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 2 },
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
  sortLabel: { fontSize: 13, fontWeight: "600" },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sortChipText: { fontSize: 13, fontWeight: "600" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 40,
  },
  loadingText: { fontSize: 15, textAlign: "center" },
  resultsCount: { paddingHorizontal: 20, paddingVertical: 10 },
  resultsText: { fontSize: 13 },
  errorNote: { fontSize: 12, marginTop: 4 },
  hotelCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  hotelImage: { width: "100%", height: 200 },
  hotelBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotelBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  hotelInfo: { padding: 16, gap: 10 },
  hotelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  hotelName: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  hotelLocation: { fontSize: 13 },
  priceBox: { alignItems: "flex-end" },
  hotelPrice: { fontSize: 22, fontWeight: "700" },
  perNight: { fontSize: 12 },
  priceNA: { fontSize: 13, fontStyle: "italic" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  starsRow: { flexDirection: "row" },
  ratingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  ratingText: { fontSize: 13, fontWeight: "700" },
  reviewCount: { fontSize: 12 },
  amenitiesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  amenityChipText: { fontSize: 12 },
  moreAmenities: { fontSize: 12, alignSelf: "center" },
  viewBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  viewBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  emptyState: { alignItems: "center", padding: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
