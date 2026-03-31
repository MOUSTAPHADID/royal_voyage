import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Image,
  TextInput,
  ListRenderItemInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { DESTINATIONS, Destination } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

const CATEGORIES = ["All", "Beach", "City", "Mountain", "Cultural", "Luxury"];

export default function ExploreScreen() {
  const router = useRouter();
  const colors = useColors();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = DESTINATIONS.filter((d) =>
    search.trim() === "" ||
    d.city.toLowerCase().includes(search.toLowerCase()) ||
    d.country.toLowerCase().includes(search.toLowerCase())
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
        <View style={styles.destPrices}>
          <View style={[styles.pricePill, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <Text style={{ color: "#C9A84C", fontSize: 11 }}>✈ from ${item.flightPrice}</Text>
          </View>
          <View style={[styles.pricePill, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
            <Text style={{ color: "#FFFFFF", fontSize: 11 }}>🏨 from ${item.hotelPrice}/night</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSub}>Discover your next adventure</Text>

        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
          <IconSymbol name="magnifyingglass" size={18} color="rgba(255,255,255,0.7)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={[styles.categoriesContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                {
                  backgroundColor: category === item ? colors.primary : colors.background,
                  borderColor: category === item ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setCategory(item)}
            >
              <Text style={[styles.categoryText, { color: category === item ? "#FFFFFF" : colors.muted }]}>
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Results count */}
      <View style={[styles.resultsHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.resultsCount, { color: colors.muted }]}>
          {filtered.length} destinations
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderDestination}
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
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  destTag: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  destTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  destInfo: {
    position: "absolute",
    bottom: 12,
    left: 10,
    right: 10,
    gap: 4,
  },
  destCity: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  destCountry: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  destPrices: {
    gap: 4,
    marginTop: 4,
  },
  pricePill: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
});
