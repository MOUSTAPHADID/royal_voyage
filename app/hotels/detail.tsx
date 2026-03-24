import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { HOTELS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatPriceMRU, formatMRU, toMRU, AGENCY_FEE_MRU } from "@/lib/currency";

const { width } = Dimensions.get("window");

const ROOM_TYPES = [
  { id: "r1", name: "Deluxe Room", size: "35 m²", beds: "1 King Bed", price: 0, features: ["City View", "Free WiFi", "Breakfast"] },
  { id: "r2", name: "Junior Suite", size: "55 m²", beds: "1 King Bed + Sofa", price: 150, features: ["Sea View", "Free WiFi", "Breakfast", "Lounge Access"] },
  { id: "r3", name: "Royal Suite", size: "120 m²", beds: "2 King Beds", price: 400, features: ["Panoramic View", "Butler Service", "Private Pool", "All Inclusive"] },
];

export default function HotelDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    id: string;
    guests?: string;
    children?: string;
    checkIn?: string;
    checkOut?: string;
  }>();
  const { id } = params;

  const hotel = HOTELS.find((h) => h.id === id) ?? HOTELS[0];
  const [selectedRoom, setSelectedRoom] = useState(ROOM_TYPES[0].id);

  const selectedRoomData = ROOM_TYPES.find((r) => r.id === selectedRoom) ?? ROOM_TYPES[0];
  const adultCount = parseInt(params.guests ?? "1", 10);
  const childCount = parseInt(params.children ?? "0", 10);
  const nightlyRate = hotel.pricePerNight + selectedRoomData.price;
  const childNightlyRate = Math.round(nightlyRate * 0.75);
  const totalPrice = nightlyRate * adultCount + childNightlyRate * childCount;
  // الإجمالي بالأوقية مع رسوم الوكالة
  const totalMRU = toMRU(totalPrice, hotel.currency || "USD") + AGENCY_FEE_MRU;

  const amenityIcons: Record<string, string> = {
    Pool: "figure.pool.swim",
    Spa: "heart.fill",
    Restaurant: "fork.knife",
    WiFi: "wifi",
    Gym: "dumbbell.fill",
    Beach: "location.fill",
    Bar: "tag.fill",
    Concierge: "person.fill",
    Yoga: "person.fill",
    "Room Service": "bell.fill",
    "Afternoon Tea": "tag.fill",
    "Lounge Access": "building.2.fill",
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: hotel.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay} />
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <View style={[styles.backBtnBg, { backgroundColor: "rgba(0,0,0,0.4)" }]}>
              <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
            </View>
          </Pressable>
          <View style={styles.heroInfo}>
            <View style={styles.starsRow}>
              {Array.from({ length: hotel.stars }, (_, i) => (
                <Text key={i} style={{ color: "#C9A84C", fontSize: 14 }}>★</Text>
              ))}
            </View>
            <Text style={styles.heroName}>{hotel.name}</Text>
            <View style={styles.heroLocation}>
              <IconSymbol name="location.fill" size={14} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroLocationText}>{hotel.address}</Text>
            </View>
          </View>
        </View>

        {/* Rating & Quick Info */}
        <View style={[styles.quickInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.quickItem}>
            <Text style={[styles.quickValue, { color: colors.foreground }]}>⭐ {hotel.rating}</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Rating</Text>
          </View>
          <View style={[styles.quickDivider, { backgroundColor: colors.border }]} />
          <View style={styles.quickItem}>
            <Text style={[styles.quickValue, { color: colors.foreground }]}>{hotel.reviewCount.toLocaleString("en-US")}</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Reviews</Text>
          </View>
          <View style={[styles.quickDivider, { backgroundColor: colors.border }]} />
          <View style={styles.quickItem}>
            <Text style={[styles.quickValue, { color: colors.primary }]}>{formatPriceMRU(hotel.pricePerNight, hotel.currency || "USD")}</Text>
            <Text style={[styles.quickLabel, { color: colors.muted }]}>Per night</Text>
          </View>
        </View>

        {/* Description */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{hotel.description}</Text>
        </View>

        {/* Amenities */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {hotel.amenities.map((a) => (
              <View key={a} style={[styles.amenityItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name={(amenityIcons[a] ?? "checkmark.circle.fill") as any} size={20} color={colors.primary} />
                <Text style={[styles.amenityLabel, { color: colors.foreground }]}>{a}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* تفصيل سعر الليلة */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تفصيل الأسعار / ليلة</Text>

          {/* سعر البالغ */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>بالغ × {adultCount}</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {formatMRU(toMRU(nightlyRate * adultCount, hotel.currency || "USD"))}
            </Text>
          </View>

          {/* سعر الطفل */}
          {childCount > 0 && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoLabel, { color: colors.muted }]}>طفل × {childCount}</Text>
                <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>خصم 25% • {formatMRU(toMRU(childNightlyRate, hotel.currency || "USD"))} / شخص</Text>
              </View>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {formatMRU(toMRU(childNightlyRate * childCount, hotel.currency || "USD"))}
              </Text>
            </View>
          )}

          {/* رسوم الوكالة */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>رسوم الخدمة</Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {formatMRU(AGENCY_FEE_MRU)}
            </Text>
          </View>

          <View style={[styles.totalRow, { marginTop: 8 }]}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>إجمالي / ليلة</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {formatMRU(totalMRU)}
            </Text>
          </View>
        </View>

        {/* Room Types */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose Room</Text>
          <View style={{ gap: 12 }}>
            {ROOM_TYPES.map((room) => (
              <Pressable
                key={room.id}
                style={[
                  styles.roomCard,
                  {
                    borderColor: selectedRoom === room.id ? colors.primary : colors.border,
                    backgroundColor: selectedRoom === room.id ? colors.primary + "08" : colors.background,
                    borderWidth: selectedRoom === room.id ? 2 : 1,
                  },
                ]}
                onPress={() => setSelectedRoom(room.id)}
              >
                <View style={styles.roomHeader}>
                  <View>
                    <Text style={[styles.roomName, { color: colors.foreground }]}>{room.name}</Text>
                    <Text style={[styles.roomMeta, { color: colors.muted }]}>{room.size} · {room.beds}</Text>
                  </View>
                  <View>
                    <Text style={[styles.roomPrice, { color: colors.primary }]}>
                      {formatMRU(toMRU(hotel.pricePerNight + room.price, hotel.currency || "USD"))}
                    </Text>
                    <Text style={[styles.roomPriceLabel, { color: colors.muted }]}>/ night</Text>
                  </View>
                </View>
                <View style={styles.roomFeatures}>
                  {room.features.map((f) => (
                    <View key={f} style={[styles.featureChip, { backgroundColor: colors.primary + "12" }]}>
                      <Text style={[styles.featureText, { color: colors.primary }]}>{f}</Text>
                    </View>
                  ))}
                </View>
                {selectedRoom === room.id && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
                    <IconSymbol name="checkmark.circle.fill" size={16} color="#FFFFFF" />
                    <Text style={styles.selectedText}>Selected</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomPrice, { color: colors.primary }]}>
            {formatMRU(totalMRU)}
          </Text>
          <Text style={[styles.bottomLabel, { color: colors.muted }]}>
            {adultCount} بالغ{childCount > 0 ? ` · ${childCount} طفل` : ""} · ليلة
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() =>
            router.push({
              pathname: "/booking/passenger-details" as any,
              params: {
                type: "hotel",
                id: hotel.id,
                roomId: selectedRoom,
                guests: String(adultCount),
                children: String(childCount),
                checkIn: params.checkIn ?? "",
                checkOut: params.checkOut ?? "",
                hotelName: hotel.name,
                roomType: selectedRoomData.name,
                roomPrice: String(totalMRU),
                priceCurrency: "MRU",
              },
            })
          }
        >
          <Text style={styles.bookBtnText}>احجز الآن</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    height: 300,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
  },
  backBtnBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
  },
  heroLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  heroLocationText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  quickInfo: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  quickItem: {
    flex: 1,
    alignItems: "center",
  },
  quickValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  quickLabel: {
    fontSize: 12,
  },
  quickDivider: {
    width: 1,
    marginVertical: 4,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  amenityLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  roomCard: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  roomName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  roomMeta: {
    fontSize: 12,
  },
  roomPrice: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "right",
  },
  roomPriceLabel: {
    fontSize: 11,
    textAlign: "right",
  },
  roomFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  featureChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  selectedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: "700",
  },
  bottomLabel: {
    fontSize: 12,
  },
  bookBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 14,
  },
  bookBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
  },
});
