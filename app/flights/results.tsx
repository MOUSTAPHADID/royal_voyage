import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { FLIGHTS, Flight } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

type SortOption = "price" | "duration" | "departure";

// Amadeus FlightOffer mapped to Flight shape for rendering
type AnyFlight = {
  id: string;
  airline: string;
  airlineCode: string;
  flightNumber: string;
  origin: string;
  originCode: string;
  destination: string;
  destinationCode: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
  class: string;
  seatsLeft: number;
};

export default function FlightResultsScreen() {
  const router = useRouter();
  const colors = useColors();
  const params = useLocalSearchParams<{
    origin: string;
    originCode: string;
    destination: string;
    destinationCode: string;
    date: string;
    passengers: string;
    useMock: string;
  }>();

  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [filterClass, setFilterClass] = useState<string>("All");

  const useMock = params.useMock === "true" || !params.originCode || !params.destinationCode;
  const classes = ["All", "ECONOMY", "BUSINESS", "FIRST"];

  // Real Amadeus query
  const { data: amadeusResult, isLoading, isError } = trpc.amadeus.searchFlights.useQuery(
    {
      originCode: params.originCode || "CMN",
      destinationCode: params.destinationCode || "DXB",
      departureDate: params.date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      adults: parseInt(params.passengers || "1", 10),
      max: 15,
    },
    {
      enabled: !useMock,
      retry: 1,
    }
  );

  const amadeusFlights: AnyFlight[] = (amadeusResult?.data ?? []) as AnyFlight[];

  // Combine real + mock
  const rawFlights: AnyFlight[] = useMock
    ? (FLIGHTS as unknown as AnyFlight[])
    : amadeusResult?.success
    ? amadeusFlights
    : (FLIGHTS as unknown as AnyFlight[]); // fallback to mock on error

  const filteredFlights = useMemo(() => {
    return rawFlights
      .filter((f) => filterClass === "All" || f.class === filterClass)
      .sort((a, b) => {
        if (sortBy === "price") return a.price - b.price;
        if (sortBy === "duration") return a.duration.localeCompare(b.duration);
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [rawFlights, filterClass, sortBy]);

  const renderFlight = ({ item }: ListRenderItemInfo<AnyFlight>) => (
    <Pressable
      style={({ pressed }) => [
        styles.flightCard,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() =>
        router.push({
          pathname: "/flights/detail" as any,
          params: {
            id: item.id,
            airline: item.airline,
            flightNumber: item.flightNumber,
            originCode: item.originCode,
            origin: item.origin,
            destinationCode: item.destinationCode,
            destination: item.destination,
            departureTime: item.departureTime,
            arrivalTime: item.arrivalTime,
            duration: item.duration,
            stops: String(item.stops),
            price: String(item.price),
            currency: item.currency || "USD",
            class: item.class,
            seatsLeft: String(item.seatsLeft),
          },
        })
      }
    >
      {/* Airline header */}
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <View style={[styles.airlineIconBox, { backgroundColor: colors.primary + "15" }]}>
            <Text style={{ fontSize: 22 }}>✈</Text>
          </View>
          <View>
            <Text style={[styles.airlineName, { color: colors.foreground }]}>{item.airline}</Text>
            <Text style={[styles.flightNumber, { color: colors.muted }]}>{item.flightNumber}</Text>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {item.currency === "USD" ? "$" : item.currency + " "}
            {typeof item.price === "number" ? item.price.toFixed(0) : item.price}
          </Text>
          <Text style={[styles.perPerson, { color: colors.muted }]}>per person</Text>
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <Text style={[styles.time, { color: colors.foreground }]}>{item.departureTime}</Text>
          <Text style={[styles.code, { color: colors.primary }]}>{item.originCode}</Text>
          <Text style={[styles.city, { color: colors.muted }]}>{item.origin}</Text>
        </View>

        <View style={styles.routeMiddle}>
          <Text style={[styles.duration, { color: colors.muted }]}>{item.duration}</Text>
          <View style={styles.routeLine}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            {item.stops > 0 && <View style={[styles.stopDot, { backgroundColor: colors.warning }]} />}
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          </View>
          <Text
            style={[
              styles.stops,
              { color: item.stops === 0 ? colors.success : colors.warning },
            ]}
          >
            {item.stops === 0 ? "Non-stop" : `${item.stops} stop${item.stops > 1 ? "s" : ""}`}
          </Text>
        </View>

        <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
          <Text style={[styles.time, { color: colors.foreground }]}>{item.arrivalTime}</Text>
          <Text style={[styles.code, { color: colors.secondary }]}>{item.destinationCode}</Text>
          <Text style={[styles.city, { color: colors.muted }]}>{item.destination}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <View style={[styles.classBadge, { backgroundColor: colors.primary + "15" }]}>
          <Text style={[styles.classText, { color: colors.primary }]}>{item.class}</Text>
        </View>
        <View
          style={[
            styles.seatsBadge,
            { backgroundColor: item.seatsLeft <= 5 ? colors.error + "15" : colors.success + "15" },
          ]}
        >
          <Text
            style={[
              styles.seatsText,
              { color: item.seatsLeft <= 5 ? colors.error : colors.success },
            ]}
          >
            {item.seatsLeft} seats left
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.selectBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={() =>
            router.push({
              pathname: "/flights/detail" as any,
              params: {
                id: item.id,
                airline: item.airline,
                flightNumber: item.flightNumber,
                originCode: item.originCode,
                origin: item.origin,
                destinationCode: item.destinationCode,
                destination: item.destination,
                departureTime: item.departureTime,
                arrivalTime: item.arrivalTime,
                duration: item.duration,
                stops: String(item.stops),
                price: String(item.price),
                currency: item.currency || "USD",
                class: item.class,
                seatsLeft: String(item.seatsLeft),
              },
            })
          }
        >
          <Text style={styles.selectBtnText}>Select</Text>
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
          <Text style={styles.headerTitle}>
            {params.originCode ?? "CMN"} → {params.destinationCode ?? "DXB"}
          </Text>
          <Text style={styles.headerSub}>
            {params.date
              ? new Date(params.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Any date"}{" "}
            · {params.passengers ?? 1} passenger
          </Text>
        </View>
        <Pressable
          style={[styles.filterBtn, { backgroundColor: "rgba(255,255,255,0.15)" }]}
        >
          <IconSymbol name="slider.horizontal.3" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Sort & Filter */}
      <View
        style={[
          styles.filterBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.muted }]}>Sort:</Text>
          {(["price", "duration", "departure"] as SortOption[]).map((opt) => (
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
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.classRow}>
          {classes.map((cls) => (
            <Pressable
              key={cls}
              style={[
                styles.classChip,
                filterClass === cls && { backgroundColor: colors.secondary },
              ]}
              onPress={() => setFilterClass(cls)}
            >
              <Text
                style={[
                  styles.classChipText,
                  { color: filterClass === cls ? colors.primary : colors.muted },
                ]}
              >
                {cls === "ECONOMY" ? "Economy" : cls === "BUSINESS" ? "Business" : cls === "FIRST" ? "First" : cls}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Loading / Error / Results count */}
      {isLoading && !useMock ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Searching live flights via Amadeus...
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.resultsCount, { backgroundColor: colors.background }]}>
            <Text style={[styles.resultsText, { color: colors.muted }]}>
              {filteredFlights.length} flight{filteredFlights.length !== 1 ? "s" : ""} found
              {!useMock && amadeusResult?.success ? " · Live data" : " · Sample data"}
            </Text>
            {isError && (
              <Text style={[styles.errorNote, { color: colors.warning }]}>
                ⚠ Live search unavailable, showing sample data
              </Text>
            )}
          </View>

          <FlatList
            data={filteredFlights}
            keyExtractor={(item) => item.id}
            renderItem={renderFlight}
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: colors.background }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 40 }}>✈</Text>
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No flights found</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Try different dates or destinations
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
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  sortRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sortLabel: { fontSize: 13, fontWeight: "600" },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sortChipText: { fontSize: 13, fontWeight: "600" },
  classRow: { flexDirection: "row", gap: 8 },
  classChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  classChipText: { fontSize: 13, fontWeight: "600" },
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
  flightCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  airlineRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  airlineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  airlineName: { fontSize: 15, fontWeight: "600" },
  flightNumber: { fontSize: 12, marginTop: 2 },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 22, fontWeight: "700" },
  perPerson: { fontSize: 11 },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  routePoint: { alignItems: "flex-start", minWidth: 70 },
  time: { fontSize: 20, fontWeight: "700" },
  code: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  city: { fontSize: 11, marginTop: 1 },
  routeMiddle: { flex: 1, alignItems: "center", gap: 4 },
  duration: { fontSize: 12 },
  routeLine: { flexDirection: "row", alignItems: "center", width: "100%" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, height: 1.5 },
  stopDot: { width: 6, height: 6, borderRadius: 3 },
  stops: { fontSize: 11, fontWeight: "600" },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  classBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  classText: { fontSize: 12, fontWeight: "600" },
  seatsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, flex: 1 },
  seatsText: { fontSize: 12, fontWeight: "600" },
  selectBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10 },
  selectBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", padding: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
