import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { FLIGHTS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { formatMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { toMRUWithSettings, getAgencyFee, applyMarkup } from "@/lib/pricing-settings";
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
    childDobs: string;
    passengerPricingJson: string;
    airlineCode: string;
    baggageAllowanceJson: string;
  }>();

  // If params have flight data (from Amadeus), use them; otherwise fall back to mock
  const hasFlight = !!params.airline;
  const mockFlight = FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0];

  // Airline logo helper
  const getAirlineLogo = (code: string) => code ? `https://images.kiwi.com/airlines/64/${code}.png` : null;

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
  const [selectedClass, setSelectedClass] = useState<string>(params.class || "ECONOMY");
  const isRoundTrip = params.tripType === "roundtrip";
  const adultCount = parseInt(params.passengers || "1", 10);
  const childCount = parseInt(params.children || "0", 10);
  const infantCount = parseInt(params.infants || "0", 10);
  const currency = flight.currency || "EUR";
  // Parse passenger pricing from JSON if available
  type PassengerPricingItem = { type: string; quantity: number; totalAmount: number; perPersonAmount: number };
  let passengerPricing: PassengerPricingItem[] = [];
  if (params.passengerPricingJson) {
    try {
      const parsed = JSON.parse(params.passengerPricingJson);
      if (Array.isArray(parsed)) passengerPricing = parsed;
    } catch (e) { /* ignore */ }
  }

  // سعر الرحلة الأساسي (Economy)
  const basePrice = flight.price;
  // معامل الدرجة الأصلية للتحويل إلى Economy
  const origClassMultiplier = flight.class?.toUpperCase() === "FIRST" ? 3.5 : flight.class?.toUpperCase() === "BUSINESS" ? 2.0 : 1.0;
  // معامل الدرجة المختارة حالياً
  const selectedClassMultiplier = selectedClass.toUpperCase() === "FIRST" ? 3.5 : selectedClass.toUpperCase() === "BUSINESS" ? 2.0 : 1.0;
  // سعر الرحلة بالدرجة المختارة
  const totalPrice = basePrice / origClassMultiplier * selectedClassMultiplier;
  // رسوم الوكالة: داخلي = 500 أوقية، دولي = 1000 أوقية (مخفية)
  const agencyFee = getAgencyFee(flight.originCode, flight.destinationCode);
  const baseMRU = toMRUWithSettings(totalPrice, currency) + agencyFee;
  const totalMRU = applyMarkup(baseMRU, flight.originCode, flight.destinationCode, selectedClass);
  // سعر الشخص الواحد (للعرض في البادج)
  const totalPersons = adultCount + childCount + infantCount;
  const perPersonMRU = totalPersons > 0 ? Math.round(totalMRU / totalPersons) : totalMRU;

  // Compute per-type pricing in MRU (with agency fee distributed proportionally)
  const adultPricing = passengerPricing.find(p => p.type === "adult");
  const childPricing = passengerPricing.find(p => p.type === "child");
  const infantPricing = passengerPricing.find(p => p.type === "infant_without_seat");
  // Distribute agency fee proportionally across passenger types
  const feePerPerson = totalPersons > 0 ? agencyFee / totalPersons : 0;
  // عند تغيير الدرجة نحسب السعر بالتناسب مع selectedClassMultiplier
  const adultPerPersonMRU = adultPricing && selectedClass.toUpperCase() === (flight.class?.toUpperCase() || "ECONOMY")
    ? applyMarkup(Math.round(toMRUWithSettings(adultPricing.perPersonAmount, currency) + feePerPerson), flight.originCode, flight.destinationCode, selectedClass)
    : Math.round(totalMRU / Math.max(totalPersons, 1));
  const childPerPersonMRU = childPricing && selectedClass.toUpperCase() === (flight.class?.toUpperCase() || "ECONOMY")
    ? applyMarkup(Math.round(toMRUWithSettings(childPricing.perPersonAmount, currency) + feePerPerson), flight.originCode, flight.destinationCode, selectedClass)
    : Math.round(adultPerPersonMRU * 0.75);
  const infantPerPersonMRU = infantPricing && selectedClass.toUpperCase() === (flight.class?.toUpperCase() || "ECONOMY")
    ? applyMarkup(Math.round(toMRUWithSettings(infantPricing.perPersonAmount, currency) + feePerPerson), flight.originCode, flight.destinationCode, selectedClass)
    : Math.round(adultPerPersonMRU * 0.10);



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
              {(params.airlineCode || flight.flightNumber?.split(' ')[0]) ? (
                <Image
                  source={{ uri: getAirlineLogo(params.airlineCode || flight.flightNumber?.split(' ')[0]?.replace(/[0-9]/g, '') || '') || '' }}
                  style={{ width: 38, height: 38, borderRadius: 6 }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ fontSize: 28 }}>✈</Text>
              )}
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


        {/* Baggage Policy */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Baggage Policy</Text>
          {(() => {
            // Parse real baggage allowance from Duffel API if available
            let realBaggage: { cabin: { quantity: number; maxWeightKg?: number } | null; checked: { quantity: number; maxWeightKg?: number } | null } | null = null;
            if (params.baggageAllowanceJson) {
              try { realBaggage = JSON.parse(params.baggageAllowanceJson); } catch { /* ignore */ }
            }
            const cabinQty = realBaggage?.cabin?.quantity ?? (selectedClass === "ECONOMY" ? 1 : 2);
            const cabinKg = realBaggage?.cabin?.maxWeightKg ?? (selectedClass === "ECONOMY" ? 10 : 12);
            const checkedQty = realBaggage?.checked?.quantity ?? (selectedClass === "FIRST" ? 3 : selectedClass === "BUSINESS" ? 2 : 1);
            const checkedKg = realBaggage?.checked?.maxWeightKg ?? (selectedClass === "FIRST" ? 32 : selectedClass === "BUSINESS" ? 32 : 23);
            const isRealData = !!realBaggage;
            return [
            {
              iconEl: <MaterialIcons name="backpack" size={22} color={colors.primary} />,
              title: "Personal Item",
              desc: "1 personal item (bag under seat) included for all passengers.",
              included: true,
            },
            {
              iconEl: <MaterialIcons name="luggage" size={22} color={colors.primary} />,
              title: "Cabin Baggage",
              desc: `${cabinQty} carry-on bag${cabinQty > 1 ? "s" : ""} (max ${cabinKg} kg each) included.${isRealData ? " ✓ Airline confirmed" : ""}`,
              included: true,
            },
            {
              iconEl: <MaterialIcons name="inventory-2" size={22} color={colors.primary} />,
              title: "Checked Baggage",
              desc: `${checkedQty} checked bag${checkedQty > 1 ? "s" : ""} (max ${checkedKg} kg each) included.${isRealData ? " ✓ Airline confirmed" : ""}`,
              included: true,
            },
            {
              iconEl: <MaterialIcons name="add-circle-outline" size={22} color={colors.warning} />,
              title: "Extra Baggage",
              desc: "Additional bags can be purchased during booking or at the airport (fees vary by airline).",
              included: false,
            },
          ].map((item) => (
            <View
              key={item.title}
              style={[
                styles.infoRow,
                {
                  borderBottomColor: colors.border,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  paddingVertical: 12,
                },
              ]}
            >
              <View style={{ marginTop: 2 }}>{item.iconEl}</View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: colors.foreground }}>{item.title}</Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      backgroundColor: item.included ? colors.success + "20" : colors.warning + "20",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: item.included ? colors.success : colors.warning }}>
                      {item.included ? "Included" : "Extra Fee"}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18 }}>{item.desc}</Text>
              </View>
            </View>
          ));
          })()
          }
          <View style={{ marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: colors.primary + "10" }}>
            <Text style={{ fontSize: 12, color: colors.primary, lineHeight: 18 }}>
              ℹ Baggage allowances may vary by airline and route. Please verify with the airline before travel.
            </Text>
          </View>
        </View>

        {/* Price breakdown */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تفصيل الأسعار</Text>

          {/* سعر البالغين */}
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.infoLabel, { color: colors.muted }]}>
              {adultCount} بالغ{adultCount > 1 ? "ين" : ""}
            </Text>
            <Text style={[styles.infoValue, { color: colors.foreground }]}>
              {fmt(adultPerPersonMRU)} × {adultCount}
            </Text>
          </View>

          {/* سعر الأطفال */}
          {childCount > 0 && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                {childCount} طفل{childCount > 1 ? "" : ""}
              </Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {fmt(childPerPersonMRU)} × {childCount}
              </Text>
            </View>
          )}

          {/* سعر الرضع */}
          {infantCount > 0 && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.muted }]}>
                {infantCount} رضيع{infantCount > 1 ? "" : ""}
              </Text>
              <Text style={[styles.infoValue, { color: colors.success }]}>
                {fmt(infantPerPersonMRU)} × {infantCount}
              </Text>
            </View>
          )}

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

          {/* Class Price Comparison */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>مقارنة أسعار الدرجات</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>نفس الرحلة بدرجات مختلفة (تقديري)</Text>
            {(["ECONOMY", "BUSINESS", "FIRST"] as const).map((cls) => {
              const isCurrentClass = selectedClass.toUpperCase() === cls;
              const classLabels = { ECONOMY: "اقتصادي", BUSINESS: "أعمال", FIRST: "أولى" };
              const classIconEls = {
                ECONOMY: <MaterialIcons name="flight" size={20} color={isCurrentClass ? colors.primary : colors.muted} />,
                BUSINESS: <MaterialIcons name="work" size={20} color={isCurrentClass ? colors.primary : colors.muted} />,
                FIRST: <MaterialIcons name="star" size={20} color={isCurrentClass ? colors.primary : colors.muted} />,
              };
              // Estimate price for other classes based on multiplier from economy
              const classMultiplier = cls === "FIRST" ? 3.5 : cls === "BUSINESS" ? 2.0 : 1.0;
              const currentMultiplier = flight.class?.toUpperCase() === "FIRST" ? 3.5 : flight.class?.toUpperCase() === "BUSINESS" ? 2.0 : 1.0;
              const estimatedBasePrice = flight.price / currentMultiplier * classMultiplier;
              const estimatedMRU = applyMarkup(
                toMRUWithSettings(estimatedBasePrice, currency) + getAgencyFee(flight.originCode, flight.destinationCode),
                flight.originCode, flight.destinationCode, cls
              );
              return (
                <Pressable
                  key={cls}
                  style={({ pressed }) => [{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: isCurrentClass ? 1.5 : 1,
                    borderColor: isCurrentClass ? colors.primary : colors.border,
                    backgroundColor: isCurrentClass ? colors.primary + "08" : colors.background,
                    opacity: pressed ? 0.8 : 1,
                  }]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View>{classIconEls[cls]}</View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>{classLabels[cls]}</Text>
                      {isCurrentClass && (
                        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: "600", marginTop: 1 }}>الدرجة الحالية</Text>
                      )}
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: isCurrentClass ? colors.primary : colors.foreground }}>
                      {fmt(isCurrentClass ? totalMRU : estimatedMRU)}
                    </Text>
                    {totalPersons > 1 && (
                      <Text style={{ fontSize: 10, color: colors.muted }}>
                        {fmt(Math.round((isCurrentClass ? totalMRU : estimatedMRU) / totalPersons))} / شخص
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
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
                class: selectedClass,
                tripType: isRoundTrip ? "roundtrip" : "oneway",
                returnDate: params.returnDate || "",
                passengers: String(adultCount),
                children: String(childCount),
                infants: String(infantCount),
                childDobs: params.childDobs || "[]",
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
