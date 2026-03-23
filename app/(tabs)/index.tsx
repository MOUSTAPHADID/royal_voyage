import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { DESTINATIONS, FLIGHTS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { useTranslation } from "@/lib/i18n";

type SearchTab = "flights" | "hotels";
type TripType = "oneway" | "roundtrip";

// Helper: get next date N days from now in YYYY-MM-DD
function futureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useApp();
  const { t, isRTL } = useTranslation();
  const [activeTab, setActiveTab] = useState<SearchTab>("flights");

  // Trip type
  const [tripType, setTripType] = useState<TripType>("oneway");

  // Flight search state
  const [flightFrom, setFlightFrom] = useState("Casablanca");
  const [flightFromCode, setFlightFromCode] = useState("CMN");
  const [flightTo, setFlightTo] = useState("");
  const [flightToCode, setFlightToCode] = useState("");
  const [departureDate, setDepartureDate] = useState(futureDate(30));
  const [returnDate, setReturnDate] = useState(futureDate(37));
  const [passengers, setPassengers] = useState(1);

  // Children count
  const [children, setChildren] = useState(0);
  const [hotelChildren, setHotelChildren] = useState(0);

  // Hotel search state
  const [hotelDest, setHotelDest] = useState("");
  const [hotelDestCode, setHotelDestCode] = useState("");
  const [checkIn] = useState(futureDate(30));
  const [checkOut] = useState(futureDate(33));
  const [guests, setGuests] = useState(2);

  // Swap origin ↔ destination
  const handleSwap = () => {
    const tmpName = flightFrom;
    const tmpCode = flightFromCode;
    setFlightFrom(flightTo || "");
    setFlightFromCode(flightToCode || "");
    setFlightTo(tmpName);
    setFlightToCode(tmpCode);
  };

  const handleFlightSearch = () => {
    const destCode = flightToCode || "DXB";
    const destName = flightTo || "Dubai";
    router.push({
      pathname: "/flights/results" as any,
      params: {
        origin: flightFrom,
        originCode: flightFromCode || "CMN",
        destination: destName,
        destinationCode: destCode,
        date: departureDate,
        returnDate: tripType === "roundtrip" ? returnDate : "",
        tripType,
        passengers: passengers.toString(),
        children: children.toString(),
        useMock: "false",
      },
    });
  };

  const handleHotelSearch = () => {
    router.push({
      pathname: "/hotels/results" as any,
      params: {
        destination: hotelDest || "Dubai",
        destinationCode: hotelDestCode || "DXB",
        checkIn,
        checkOut,
        guests: guests.toString(),
        children: hotelChildren.toString(),
        useMock: "false",
      },
    });
  };

  const greeting = () => {
    return t.home.greeting;
  };

  return (
    <ScreenContainer containerClassName="bg-primary" edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={[styles.userName, { textAlign: isRTL ? "right" : "left" }]}>
                {user?.name?.split(" ")[0] ?? (isRTL ? "مسافر" : "Traveller")} 👋
              </Text>
            </View>
            <Pressable
              style={[styles.notifButton, { backgroundColor: "rgba(255,255,255,0.15)" }]}
              onPress={() => {}}
            >
              <IconSymbol name="bell.fill" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={[styles.headerSubtitle, { textAlign: isRTL ? "right" : "left" }]}>{t.home.tagline}</Text>
        </View>

        {/* Search Widget */}
        <View style={[styles.searchWidget, { backgroundColor: colors.surface }]}>
          {/* Tabs: Flights / Hotels */}
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
                  {tab === "flights" ? t.home.flights : t.home.hotels}
                </Text>
              </Pressable>
            ))}
          </View>

          {activeTab === "flights" ? (
            <View style={styles.searchForm}>

              {/* ── Trip Type Toggle ── */}
              <View style={[styles.tripTypeRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {(["oneway", "roundtrip"] as TripType[]).map((type) => (
                  <Pressable
                    key={type}
                    style={[
                      styles.tripTypeBtn,
                      tripType === type && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setTripType(type)}
                  >
                    <IconSymbol
                      name={type === "oneway" ? "arrow.right" : "arrow.2.squarepath"}
                      size={14}
                      color={tripType === type ? "#FFFFFF" : colors.muted}
                    />
                    <Text
                      style={[
                        styles.tripTypeText,
                        { color: tripType === type ? "#FFFFFF" : colors.muted },
                      ]}
                    >
                      {type === "oneway" ? t.home.oneWay : t.home.roundTrip}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* From — with autocomplete */}
              <LocationAutocomplete
                label={t.home.from}
                placeholder={isRTL ? "مدينة أو مطار الإقلاع" : "Origin city or airport"}
                value={flightFrom}
                iataCode={flightFromCode}
                onSelect={(name, code) => {
                  setFlightFrom(name);
                  setFlightFromCode(code);
                }}
                iconName="airplane"
              />

              {/* Swap button */}
              <View style={styles.swapRow}>
                <View style={[styles.swapDivider, { backgroundColor: colors.border }]} />
                <Pressable
                  style={[styles.swapBtn, { backgroundColor: colors.primary, borderColor: colors.surface }]}
                  onPress={handleSwap}
                >
                  <IconSymbol name="arrow.up.arrow.down" size={16} color="#FFFFFF" />
                </Pressable>
                <View style={[styles.swapDivider, { backgroundColor: colors.border }]} />
              </View>

              {/* To — with autocomplete */}
              <LocationAutocomplete
                label={t.home.to}
                placeholder={isRTL ? "مدينة أو مطار الوجهة" : "Destination city or airport"}
                value={flightTo}
                iataCode={flightToCode}
                onSelect={(name, code) => {
                  setFlightTo(name);
                  setFlightToCode(code);
                }}
                iconName="location.fill"
              />

              {/* Date fields */}
              {tripType === "oneway" ? (
                /* One Way — single date */
                <View style={[styles.searchField, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="calendar" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.departure}</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                      {formatDate(departureDate)}
                    </Text>
                  </View>
                  <View style={[styles.tripBadge, { backgroundColor: colors.primary + "18" }]}>
                    <Text style={[styles.tripBadgeText, { color: colors.primary }]}>{t.home.oneWay}</Text>
                  </View>
                </View>
              ) : (
                /* Round Trip — two dates side by side */
                <View style={styles.rowFields}>
                  <Pressable
                    style={[styles.searchField, { flex: 1, borderColor: colors.primary, backgroundColor: colors.background }]}
                    onPress={() => {
                      // Cycle departure date +1 day (simple demo interaction)
                      const d = new Date(departureDate);
                      d.setDate(d.getDate() + 1);
                      // Ensure return is after departure
                      const r = new Date(returnDate);
                      if (r <= d) {
                        r.setDate(d.getDate() + 3);
                        setReturnDate(r.toISOString().slice(0, 10));
                      }
                      setDepartureDate(d.toISOString().slice(0, 10));
                    }}
                  >
                    <IconSymbol name="airplane" size={16} color={colors.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.departure}</Text>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                        {formatDateShort(departureDate)}
                      </Text>
                    </View>
                  </Pressable>

                  <View style={styles.dateArrow}>
                    <IconSymbol name="arrow.right" size={14} color={colors.muted} />
                  </View>

                  <Pressable
                    style={[styles.searchField, { flex: 1, borderColor: colors.secondary, backgroundColor: colors.background }]}
                    onPress={() => {
                      const r = new Date(returnDate);
                      r.setDate(r.getDate() + 1);
                      setReturnDate(r.toISOString().slice(0, 10));
                    }}
                  >
                    <IconSymbol name="airplane.arrival" size={16} color={colors.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.returnDate}</Text>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                        {formatDateShort(returnDate)}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}

              {/* Passengers + Children */}
              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.passengers}</Text>
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
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="figure.and.child.holdinghands" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{isRTL ? "أطفال" : "Children"}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setChildren(Math.max(0, children - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{children}</Text>
                      <Pressable onPress={() => setChildren(children + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.searchButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleFlightSearch}
              >
                <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
                <Text style={[styles.searchButtonText, { color: colors.primary }]}>
                  {tripType === "roundtrip" ? t.home.roundTrip : t.home.searchFlights}
                </Text>
              </Pressable>
            </View>
          ) : (
            /* ── Hotels Form ── */
            <View style={styles.searchForm}>
              <LocationAutocomplete
                label={t.home.destination}
                placeholder={isRTL ? "مدينة أو وجهة الفندق" : "City or hotel destination"}
                value={hotelDest}
                iataCode={hotelDestCode}
                onSelect={(name, code) => {
                  setHotelDest(name);
                  setHotelDestCode(code);
                }}
                iconName="location.fill"
              />

              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.checkIn}</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                      {formatDateShort(checkIn)}
                    </Text>
                  </View>
                </View>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="clock.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.checkOut}</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>
                      {formatDateShort(checkOut)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="person.2.fill" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{t.home.guests}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setGuests(Math.max(1, guests - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{guests}</Text>
                      <Pressable onPress={() => setGuests(guests + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
                <View style={[styles.searchField, { flex: 1, borderColor: colors.border, backgroundColor: colors.background }]}>
                  <IconSymbol name="figure.and.child.holdinghands" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>{isRTL ? "أطفال" : "Children"}</Text>
                    <View style={styles.counterRow}>
                      <Pressable onPress={() => setHotelChildren(Math.max(0, hotelChildren - 1))}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>−</Text>
                      </Pressable>
                      <Text style={[styles.fieldValue, { color: colors.foreground }]}>{hotelChildren}</Text>
                      <Pressable onPress={() => setHotelChildren(hotelChildren + 1)}>
                        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: "700" }}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.searchButton,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={handleHotelSearch}
              >
                <IconSymbol name="magnifyingglass" size={18} color={colors.primary} />
                <Text style={[styles.searchButtonText, { color: colors.primary }]}>{t.home.searchHotels}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.popularDestinations}</Text>
            <Pressable>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t.seeAll}</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={DESTINATIONS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.destCard, { opacity: pressed ? 0.9 : 1 }]}
                onPress={() => {
                  setActiveTab("flights");
                  setFlightTo(item.city);
                }}
              >
                <Image source={{ uri: item.image }} style={styles.destImage} />
                <View style={[styles.destTag, { backgroundColor: colors.primary }]}>
                  <Text style={styles.destTagText}>{item.tag}</Text>
                </View>
                <View style={styles.destInfo}>
                  <Text style={styles.destCity}>{item.city}</Text>
                  <Text style={styles.destCountry}>{item.country}</Text>
                  <Text style={styles.destPrice}>{t.home.fromPrice} ${item.flightPrice}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>

        {/* Hot Deals */}
        <View style={[styles.section, { paddingBottom: 32 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{t.home.trendingNow}</Text>
            <Pressable>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t.seeAll}</Text>
            </Pressable>
          </View>
          {FLIGHTS.slice(0, 3).map((flight) => (
            <Pressable
              key={flight.id}
              style={({ pressed }) => [
                styles.dealCard,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/flights/detail" as any,
                  params: { id: flight.id },
                })
              }
            >
              <View style={styles.dealLeft}>
                <View style={[styles.airlineIcon, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={{ fontSize: 22 }}>✈</Text>
                </View>
                <View>
                  <Text style={[styles.dealAirline, { color: colors.foreground }]}>{flight.airline}</Text>
                  <Text style={[styles.dealRoute, { color: colors.muted }]}>
                    {flight.originCode} → {flight.destinationCode}
                  </Text>
                  <Text style={[styles.dealDuration, { color: colors.muted }]}>{flight.duration}</Text>
                </View>
              </View>
              <View style={styles.dealRight}>
                <Text style={[styles.dealPrice, { color: colors.primary }]}>${flight.price}</Text>
                <Text style={[styles.dealClass, { color: colors.muted }]}>{flight.class}</Text>
                <View style={[styles.dealSeats, { backgroundColor: colors.error + "15" }]}>
                  <Text style={[styles.dealSeatsText, { color: colors.error }]}>
                    {flight.seatsLeft} {t.flights.seatsLeft}
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
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  greeting: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  notifButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
  },
  searchWidget: {
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  tabRow: {
    flexDirection: "row",
    padding: 6,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  searchForm: {
    padding: 16,
    gap: 10,
  },
  // ── Trip Type Toggle ──
  tripTypeRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 3,
    gap: 3,
  },
  tripTypeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    gap: 5,
  },
  tripTypeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  // ── Swap button ──
  swapRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: -4,
  },
  swapDivider: {
    flex: 1,
    height: 1,
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    marginHorizontal: 8,
  },
  // ── Date arrow ──
  dateArrow: {
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  // ── Trip badge ──
  tripBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tripBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  rowFields: {
    flexDirection: "row",
    gap: 10,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: "600",
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
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  destCard: {
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
  },
  destImage: {
    width: "100%",
    height: "100%",
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
    color: "#FFFFFF",
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
