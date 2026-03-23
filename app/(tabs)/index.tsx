import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { DESTINATIONS, FLIGHTS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

type SearchTab = "flights" | "hotels";

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<SearchTab>("flights");

  // Flight search state
  const [flightFrom, setFlightFrom] = useState("Casablanca (CMN)");
  const [flightTo, setFlightTo] = useState("");
  const [flightDate, setFlightDate] = useState("Apr 15, 2024");
  const [passengers, setPassengers] = useState(1);

  // Hotel search state
  const [hotelDest, setHotelDest] = useState("");
  const [checkIn, setCheckIn] = useState("Apr 20, 2024");
  const [checkOut, setCheckOut] = useState("Apr 25, 2024");
  const [guests, setGuests] = useState(2);

  const handleFlightSearch = () => {
    router.push({
      pathname: "/flights/results" as any,
      params: {
        origin: "Casablanca",
        originCode: "CMN",
        destination: flightTo || "Dubai",
        destinationCode: "DXB",
        date: flightDate,
        passengers: passengers.toString(),
      },
    });
  };

  const handleHotelSearch = () => {
    router.push({
      pathname: "/hotels/results" as any,
      params: {
        destination: hotelDest || "Dubai",
        checkIn,
        checkOut,
        guests: guests.toString(),
      },
    });
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <ScreenContainer containerClassName="bg-primary" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>{user?.name?.split(" ")[0] ?? "Traveller"} 👋</Text>
            </View>
            <Pressable
              style={[styles.notifButton, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => {}}
            >
              <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.headerSubtitle}>Where would you like to go?</Text>
        </View>

        {/* Search Widget */}
        <View style={[styles.searchWidget, { backgroundColor: colors.surface }]}>
          {/* Tabs */}
          <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
            {(["flights", "hotels"] as SearchTab[]).map((tab) => (
              <Pressable
                key={tab}
                style={[
                  styles.tabButton,
                  activeTab === tab && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <IconSymbol
                  name={tab === "flights" ? "airplane" : "building.2.fill"}
                  size={16}
                  color={activeTab === tab ? "#FFFFFF" : colors.muted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: activeTab === tab ? "#FFFFFF" : colors.muted },
                  ]}
                >
                  {tab === "flights" ? "Flights" : "Hotels"}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "flights" ? (
            <View style={styles.searchForm}>
              <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <IconSymbol name="airplane" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>From</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.foreground }]}
                    value={flightFrom}
                    onChangeText={setFlightFrom}
                    placeholder="Origin city"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <IconSymbol name="location.fill" size={18} color={colors.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>To</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.foreground }]}
                    value={flightTo}
                    onChangeText={setFlightTo}
                    placeholder="Destination city"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Date</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>{flightDate}</Text>
                  </View>
                </View>

                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Passengers</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setPassengers(Math.max(1, passengers - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{passengers}</Text>
                      <Pressable onPress={() => setPassengers(passengers + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.searchButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 }]}
                onPress={handleFlightSearch}
              >
                <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
                <Text style={[styles.searchButtonText, { color: colors.primary }]}>Search Flights</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.searchForm}>
              <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <IconSymbol name="location.fill" size={18} color={colors.secondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Destination</Text>
                  <TextInput
                    style={[styles.fieldInput, { color: colors.foreground }]}
                    value={hotelDest}
                    onChangeText={setHotelDest}
                    placeholder="City or hotel name"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Check-in</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>{checkIn}</Text>
                  </View>
                </View>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Check-out</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>{checkOut}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Guests</Text>
                  <View style={styles.counterRow}>
                    <Pressable onPress={() => setGuests(Math.max(1, guests - 1))}>
                      <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                    </Pressable>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>{guests} guests</Text>
                    <Pressable onPress={() => setGuests(guests + 1)}>
                      <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [styles.searchButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 }]}
                onPress={handleHotelSearch}
              >
                <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
                <Text style={[styles.searchButtonText, { color: colors.primary }]}>Search Hotels</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Featured Destinations */}
        <View style={[styles.section, { backgroundColor: colors.background }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Featured Destinations</Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as any)}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </Pressable>
          </View>

          <FlatList
            data={DESTINATIONS.slice(0, 5)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 4, gap: 14 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.9 : 1 }]}
                onPress={() => router.push({ pathname: "/hotels/results" as any, params: { destination: item.city } })}
              >
                <Image source={{ uri: item.image }} style={styles.destImage} />
                <View style={styles.destGradient} />
                {item.tag && (
                  <View style={[styles.destTag, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.destTagText, { color: colors.primary }]}>{item.tag}</Text>
                  </View>
                )}
                <View style={styles.destInfo}>
                  <Text style={styles.destCity}>{item.city}</Text>
                  <Text style={styles.destCountry}>{item.country}</Text>
                  <Text style={styles.destPrice}>from ${item.flightPrice}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Hot Deals */}
        <View style={[styles.section, { backgroundColor: colors.background, paddingBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Hot Deals ✈</Text>
          </View>

          {FLIGHTS.slice(0, 3).map((flight) => (
            <Pressable
              key={flight.id}
              style={({ pressed }) => [
                styles.dealCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() => router.push({ pathname: "/flights/detail" as any, params: { id: flight.id } })}
            >
              <View style={styles.dealLeft}>
                <View style={[styles.airlineIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={{ fontSize: 20 }}>✈</Text>
                </View>
                <View>
                  <Text style={[styles.dealAirline, { color: colors.foreground }]}>{flight.airline}</Text>
                  <Text style={[styles.dealRoute, { color: colors.muted }]}>
                    {flight.originCode} → {flight.destinationCode}
                  </Text>
                  <Text style={[styles.dealDuration, { color: colors.muted }]}>
                    {flight.duration} · {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop`}
                  </Text>
                </View>
              </View>
              <View style={styles.dealRight}>
                <Text style={[styles.dealPrice, { color: colors.primary }]}>${flight.price}</Text>
                <Text style={[styles.dealClass, { color: colors.muted }]}>{flight.class}</Text>
                <View style={[styles.dealSeats, { backgroundColor: flight.seatsLeft <= 5 ? colors.error + "15" : colors.success + "15" }]}>
                  <Text style={[styles.dealSeatsText, { color: flight.seatsLeft <= 5 ? colors.error : colors.success }]}>
                    {flight.seatsLeft} seats left
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  searchWidget: {
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchForm: {
    gap: 10,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  destCard: {
    width: 160,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
  },
  destImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  destGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.5)",
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
    left: 12,
    right: 12,
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
  destPrice: {
    color: "#C9A84C",
    fontSize: 13,
    fontWeight: "600",
  },
  dealCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  dealLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  airlineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dealAirline: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  dealRoute: {
    fontSize: 13,
    marginBottom: 2,
  },
  dealDuration: {
    fontSize: 12,
  },
  dealRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  dealPrice: {
    fontSize: 20,
    fontWeight: "700",
  },
  dealClass: {
    fontSize: 12,
  },
  dealSeats: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealSeatsText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
