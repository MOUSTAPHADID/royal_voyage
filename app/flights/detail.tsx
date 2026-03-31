import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { FLIGHTS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { toMRUWithSettings, getAgencyFee } from "@/lib/pricing-settings";
import { usePricingSettings as _usePricingSettings } from "@/hooks/use-pricing-settings";

export default function FlightDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { fmt } = useCurrency();
  const params = useLocalSearchParams<{
    id: string;
    airline: string;
    flightNumber: string;
    originCode: string;
    origin: string;
    destinationCode: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: string;
    price: string;
    currency: string;
    class: string;
    seatsLeft: string;
    tripType: string;
    returnDate: string;
    passengers: string;
    children: string;
    infants: string;
  }>();

  // If params have flight data (from Amadeus), use them; otherwise fall back to mock
  const hasFlight = !!params.airline;
  const mockFlight = FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0];

  const flight = hasFlight
    ? {
        id: params.id,
        airline: params.airline,
        flightNumber: params.flightNumber,
        originCode: params.originCode,
        origin: params.origin,
        destinationCode: params.destinationCode,
        destination: params.destination,
        departureTime: params.departureTime,
        arrivalTime: params.arrivalTime,
        duration: params.duration,
        stops: parseInt(params.stops || "0", 10),
        price: parseFloat(params.price || "0"),
        currency: params.currency || "USD",
        class: params.class || "ECONOMY",
        seatsLeft: parseInt(params.seatsLeft || "9", 10),
      }
    : mockFlight;
  const pricing = _usePricingSettings();
  const isRoundTrip = params.tripType === "roundtrip";
  const adultCount = parseInt(params.passengers || "1", 10);
  const childCount = parseInt(params.children || "0", 10);
  const infantCount = parseInt(params.infants || "0", 10);
  const currency = flight.currency || "EUR";
  // Duffel API: total_amount = السعر الإجمالي لكل الركاب + كل الرحلات (ذهاب وإياب)
  // لا نحتاج لضرب × عدد الركاب أو × 2 لأن السعر شامل بالفعل
  const totalPrice = flight.price;
  // رسوم الوكالة: داخلي = 500 أوقية، دولي = 1000 أوقية (مخفية)
  const agencyFee = getAgencyFee(flight.originCode, flight.destinationCode);
  const totalMRU = toMRUWithSettings(totalPrice, currency) + agencyFee;
  // سعر الشخص الواحد (للعرض في البادج)
  const totalPersons = adultCount + childCount + infantCount;
  const perPersonMRU = totalPersons > 0 ? Math.round(totalMRU / totalPersons) : totalMRU;

  const amenities = [
    { icon: "wifi", label: "Wi-Fi" },
    { icon: "fork.knife", label: "Meals" },
    { icon: "tv", label: "Entertainment" },
    { icon: "person.2.fill", label: "Extra Legroom" },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Flight Details</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Airline card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.airlineRow}>
            <View style={[styles.airlineIcon, { backgroundColor: colors.primary + "15" }]}>
              <Text style={{ fontSize: 28 }}>✈</Text>
            </View>
            <View>
              <Text style={[styles.airlineName, { color: colors.foreground }]}>{flight.airline}</Text>
              <Text style={[styles.flightNum, { color: colors.muted }]}>{flight.flightNumber} · {flight.class}</Text>
            </View>
            <View style={[styles.priceBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.priceText}>{fmt(perPersonMRU)}</Text>
              <Text style={styles.priceLabel}>للشخص</Text>
            </View>
          </View>

          {/* Route visualization */}
          <View style={[styles.routeCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.routePoint}>
              <Text style={[styles.routeTime, { color: colors.foreground }]}>{flight.departureTime}</Text>
              <Text style={[styles.routeCode, { color: colors.primary }]}>{flight.originCode}</Text>
              <Text style={[styles.routeCity, { color: colors.muted }]}>{flight.origin}</Text>
            </View>

            <View style={styles.routeCenter}>
              <Text style={[styles.routeDuration, { color: colors.muted }]}>{flight.duration}</Text>
              <View style={styles.routeLineRow}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                <Text style={{ fontSize: 18 }}>✈</Text>
                <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
                <View style={[styles.routeDot, { backgroundColor: colors.secondary }]} />
              </View>
              <Text style={[styles.routeStops, { color: flight.stops === 0 ? colors.success : colors.warning }]}>
                {flight.stops === 0 ? "Direct Flight" : `${flight.stops} Stop`}
              </Text>
            </View>

            <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
              <Text style={[styles.routeTime, { color: colors.foreground }]}>{flight.arrivalTime}</Text>
              <Text style={[styles.routeCode, { color: colors.secondary }]}>{flight.destinationCode}</Text>
              <Text style={[styles.routeCity, { color: colors.muted }]}>{flight.destination}</Text>
            </View>
          </View>
        </View>

        {/* Flight Info */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Flight Information</Text>
          {[
            { label: "Flight Number", value: flight.flightNumber },
            { label: "Airline", value: flight.airline },
            { label: "Class", value: flight.class },
            { label: "Duration", value: flight.duration },
            { label: "Stops", value: flight.stops === 0 ? "Non-stop" : `${flight.stops} stop(s)` },
            { label: "Seats Available", value: `${flight.seatsLeft} seats` },
          ].map((item) => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Amenities */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Included Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {amenities.map((a) => (
              <View key={a.label} style={[styles.amenityItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <IconSymbol name={a.icon as any} size={22} color={colors.primary} />
                <Text style={[styles.amenityLabel, { color: colors.foreground }]}>{a.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Price breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تفصيل الأسعار</Text>

          {/* عدد الركاب */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>
              {adultCount} بالغ{childCount > 0 ? ` + ${childCount} طفل` : ""}{infantCount > 0 ? ` + ${infantCount} رضيع` : ""}
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {fmt(perPersonMRU)}/شخص
            </Text>
          </View>

          {/* نوع الرحلة */}
          {isRoundTrip && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>نوع الرحلة</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>ذهاب وإياب</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>
              الإجمالي{isRoundTrip ? " (شامل الذهاب والإياب)" : ""}
            </Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              {fmt(totalMRU)}
            </Text>
          </View>
          </View>

          {/* Book Button */}
          <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomPrice, { color: colors.primary }]}>
            {fmt(totalMRU)}
          </Text>
          <Text style={[styles.bottomLabel, { color: colors.muted }]}>
            {adultCount} بالغ{childCount > 0 ? ` · ${childCount} طفل` : ""}{infantCount > 0 ? ` · ${infantCount} رضيع` : ""}{isRoundTrip ? " · ذهاب وإياب" : ""}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.bookBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
          onPress={() =>
            router.push({
              pathname: "/booking/passenger-details" as any,
              params: {
                type: "flight",
                id: flight.id,
                airline: flight.airline,
                flightNumber: flight.flightNumber,
                originCode: flight.originCode,
                origin: flight.origin,
                destinationCode: flight.destinationCode,
                destination: flight.destination,
                departureTime: flight.departureTime,
                arrivalTime: flight.arrivalTime,
                duration: flight.duration,
                price: String(totalMRU),
                priceCurrency: "MRU",
                currency: flight.currency,
                class: flight.class,
                tripType: isRoundTrip ? "roundtrip" : "oneway",
                returnDate: params.returnDate || "",
                passengers: String(adultCount),
                children: String(childCount),
                infants: String(infantCount),
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  airlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  airlineIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  airlineName: {
    fontSize: 17,
    fontWeight: "700",
  },
  flightNum: {
    fontSize: 13,
    marginTop: 2,
  },
  priceBadge: {
    marginLeft: "auto",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  priceText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  priceLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
  },
  routeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  routePoint: {
    alignItems: "flex-start",
    minWidth: 70,
  },
  routeTime: {
    fontSize: 22,
    fontWeight: "700",
  },
  routeCode: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  routeCity: {
    fontSize: 12,
    marginTop: 2,
  },
  routeCenter: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  routeDuration: {
    fontSize: 12,
  },
  routeLineRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeLine: {
    flex: 1,
    height: 1.5,
  },
  routeStops: {
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  amenitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  amenityItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  amenityLabel: {
    fontSize: 14,
    fontWeight: "500",
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
});
