import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ListRenderItemInfo,
  Image,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { FLIGHTS, Flight } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/lib/i18n";
import { formatDuffelPriceMRU, toMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { applyMarkup, getAgencyFee, toMRUWithSettings } from "@/lib/pricing-settings";

type SortOption = "price" | "duration" | "departure";

// Duffel FlightOffer mapped to Flight shape for rendering
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
  stopCodes?: string[];
  operatingAirlines?: string[];
  allFlightNumbers?: string[];
  price: number;
  currency: string;
  class: string;
  seatsLeft: number;
  passengerPricing?: Array<{
    type: string;
    quantity: number;
    totalAmount: number;
    perPersonAmount: number;
  }>;
  baggageAllowance?: {
    cabin: { quantity: number; maxWeightKg?: number } | null;
    checked: { quantity: number; maxWeightKg?: number } | null;
  };
  rawOffer?: unknown;
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
    returnDate: string;
    tripType: string;
    passengers: string;
    children: string;
    infants: string;
    childAges: string;
    childDobs: string;
    useMock: string;
    flexibleDates: string;
  }>();

  const isFlexible = params.flexibleDates === "true";

  // Generate ±3 day window dates
  const flexDates = useMemo(() => {
    if (!isFlexible || !params.date) return [];
    const base = new Date(params.date);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + (i - 3));
      return d.toISOString().slice(0, 10);
    });
  }, [isFlexible, params.date]);

  // Selected flexible date (null = use original date)
  const [selectedFlexDate, setSelectedFlexDate] = useState<string | null>(null);
  const effectiveDate = selectedFlexDate ?? params.date;

  const isRoundTrip = params.tripType === "roundtrip" && !!params.returnDate;
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  // Sort & Filter
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [filterClass, setFilterClass] = useState<string>("All");
  const [filterBags, setFilterBags] = useState<number | null>(null); // null = All
  const [filterDirectOnly, setFilterDirectOnly] = useState(false);
  const [activeSection, setActiveSection] = useState<"outbound" | "return">("outbound");
  const [filterAirline, setFilterAirline] = useState<string>("All"); // airline filter
  const [filterStops, setFilterStops] = useState<number | null>(null); // null = All stops
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [priceRangeInitialized, setPriceRangeInitialized] = useState(false);
  // Compare feature: up to 2 flights
  const [compareList, setCompareList] = useState<AnyFlight[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const toggleCompare = (flight: AnyFlight) => {
    setCompareList((prev) => {
      const exists = prev.find((f) => f.id === flight.id);
      if (exists) return prev.filter((f) => f.id !== flight.id);
      if (prev.length >= 2) return [prev[1], flight]; // replace oldest
      return [...prev, flight];
    });
  };

  // Always use Duffel Production API — useMock is kept for emergency fallback only
  const useMock = false;const classes = ["All", "ECONOMY", "BUSINESS", "FIRST"];

  // Duffel Production API query — outbound
  const { data: duffelResult, isLoading, isError } = trpc.duffel.searchFlights.useQuery(
    {
      originCode: params.originCode || "",
      destinationCode: params.destinationCode || "",
      departureDate: effectiveDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      returnDate: isRoundTrip ? params.returnDate : undefined,
      adults: parseInt(params.passengers || "1", 10),
      children: parseInt(params.children || "0", 10),
      infants: parseInt(params.infants || "0", 10),
      childAges: params.childAges ? JSON.parse(params.childAges) : undefined,
      max: 15,
    },
    {
      enabled: true,
      retry: 2,
    }
  );

  // Flexible dates — fetch cheapest price per day (7 queries, enabled only when flexible)
  const flexQuery0 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[0] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[0], retry: 1 });
  const flexQuery1 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[1] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[1], retry: 1 });
  const flexQuery2 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[2] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[2], retry: 1 });
  const flexQuery3 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[3] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[3], retry: 1 });
  const flexQuery4 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[4] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[4], retry: 1 });
  const flexQuery5 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[5] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[5], retry: 1 });
  const flexQuery6 = trpc.duffel.searchFlights.useQuery({ originCode: params.originCode || "", destinationCode: params.destinationCode || "", departureDate: flexDates[6] || "", adults: parseInt(params.passengers || "1", 10), children: parseInt(params.children || "0", 10), infants: parseInt(params.infants || "0", 10), max: 3 }, { enabled: isFlexible && !!flexDates[6], retry: 1 });

  // Map flex queries to date → cheapest price
  const flexPrices = useMemo(() => {
    const queries = [flexQuery0, flexQuery1, flexQuery2, flexQuery3, flexQuery4, flexQuery5, flexQuery6];
    return flexDates.map((date, i) => {
      const q = queries[i];
      const offers = (q.data?.data ?? []) as AnyFlight[];
      const cheapest = offers.length > 0 ? Math.min(...offers.map((f) => applyMarkup(toMRUWithSettings(f.price, f.currency || "EUR") + getAgencyFee(f.originCode, f.destinationCode), f.originCode, f.destinationCode, f.class))) : null;
      return { date, price: cheapest, isLoading: q.isLoading };
    });
  }, [flexDates, flexQuery0.data, flexQuery1.data, flexQuery2.data, flexQuery3.data, flexQuery4.data, flexQuery5.data, flexQuery6.data]);

  // Duffel Production API query — inbound (return leg)
  const { data: returnResult, isLoading: returnLoading } = trpc.duffel.searchFlights.useQuery(
    {
      originCode: params.destinationCode || "",
      destinationCode: params.originCode || "",
      departureDate: params.returnDate || new Date(Date.now() + 37 * 86400000).toISOString().slice(0, 10),
      adults: parseInt(params.passengers || "1", 10),
      children: parseInt(params.children || "0", 10),
      infants: parseInt(params.infants || "0", 10),
      childAges: params.childAges ? JSON.parse(params.childAges) : undefined,
      max: 10,
    },
    {
      enabled: isRoundTrip,
      retry: 2,
    }
  );

  const duffelFlights: AnyFlight[] = (duffelResult?.data ?? []) as AnyFlight[];
  const returnFlights: AnyFlight[] = (returnResult?.data ?? []) as AnyFlight[];

  // Use live Duffel data; fallback to mock only if API fails
  const rawFlights: AnyFlight[] = duffelResult?.success && duffelFlights.length > 0
    ? duffelFlights
    : isLoading
    ? []
    : (FLIGHTS as unknown as AnyFlight[]);

  const rawReturnFlights: AnyFlight[] = returnResult?.success && returnFlights.length > 0
    ? returnFlights
    : [];

  const activeFlights = activeSection === "outbound" ? rawFlights : rawReturnFlights;

  const getFlightTotalMRU = (f: AnyFlight) => applyMarkup(toMRUWithSettings(f.price, f.currency || "EUR") + getAgencyFee(f.originCode, f.destinationCode), f.originCode, f.destinationCode, f.class);

  // Calculate min/max prices for slider
  const { minPrice, maxPrice } = useMemo(() => {
    if (activeFlights.length === 0) return { minPrice: 0, maxPrice: 999999 };
    const prices = activeFlights.map(getFlightTotalMRU);
    return { minPrice: Math.floor(Math.min(...prices)), maxPrice: Math.ceil(Math.max(...prices)) };
  }, [activeFlights]);

  // Initialize price range when data loads
  useEffect(() => {
    if (activeFlights.length > 0 && !priceRangeInitialized) {
      setPriceRange([minPrice, maxPrice]);
      setPriceRangeInitialized(true);
    }
  }, [activeFlights.length, minPrice, maxPrice, priceRangeInitialized]);

  // Reset price range when switching sections
  useEffect(() => {
    setPriceRangeInitialized(false);
  }, [activeSection]);

  // Collect unique airlines from active flights
  const uniqueAirlines = useMemo(() => {
    const codes = new Map<string, string>(); // code -> name
    activeFlights.forEach((f) => {
      if (f.airlineCode) codes.set(f.airlineCode, f.airline);
    });
    return Array.from(codes.entries()).map(([code, name]) => ({ code, name }));
  }, [activeFlights]);

  const filteredFlights = useMemo(() => {
    return activeFlights
      .filter((f) => filterClass === "All" || f.class === filterClass)
      .filter((f) => {
        const priceMRU = getFlightTotalMRU(f);
        return priceMRU >= priceRange[0] && priceMRU <= priceRange[1];
      })
      .filter((f) => {
        if (filterBags === null) return true;
        const checkedQty = f.baggageAllowance?.checked?.quantity ?? 1;
        return checkedQty >= filterBags;
      })
      .filter((f) => {
        if (!filterDirectOnly) return true;
        return f.stops === 0;
      })
      .filter((f) => {
        if (filterAirline === "All") return true;
        return f.airlineCode === filterAirline;
      })
      .filter((f) => {
        if (filterStops === null) return true;
        return f.stops === filterStops;
      })
      .sort((a, b) => {
        if (sortBy === "price") return getFlightTotalMRU(a) - getFlightTotalMRU(b);
        if (sortBy === "duration") return a.duration.localeCompare(b.duration);
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [activeFlights, filterClass, sortBy, priceRange, filterBags, filterDirectOnly]);

  // Cheapest price for "Best Price" badge
  const cheapestPrice = useMemo(() => {
    if (filteredFlights.length === 0) return 0;
    return Math.min(...filteredFlights.map(getFlightTotalMRU));
  }, [filteredFlights]);

  const totalPassengers = Math.max(1, parseInt(params.passengers || "1", 10) + parseInt(params.children || "0", 10) + parseInt(params.infants || "0", 10));

  // Fade-in animation when results load
  const listAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (filteredFlights.length > 0) {
      listAnim.setValue(0);
      Animated.timing(listAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }
  }, [filteredFlights.length]);

  // Airline logo helper - uses IATA code to get logo from public CDN
  const getAirlineLogo = (airlineCode: string) => {
    if (!airlineCode) return null;
    return `https://images.kiwi.com/airlines/64/${airlineCode}.png`;
  };

  const renderFlight = useCallback(({ item }: ListRenderItemInfo<AnyFlight>) => {
    const flightTotal = getFlightTotalMRU(item);
    const perPerson = Math.round(flightTotal / totalPassengers);
    const isCheapest = flightTotal <= cheapestPrice && filteredFlights.length > 1;

    return (
    <Pressable
      style={({ pressed }) => [
        styles.flightCard,
        { backgroundColor: colors.surface, borderColor: isCheapest ? colors.success : colors.border, borderWidth: isCheapest ? 1.5 : 1, opacity: pressed ? 0.9 : 1 },
      ]}
      onPress={() =>
        router.push({
          pathname: "/flights/detail" as any,
          params: {
            id: item.id,
            airline: item.airline,
            airlineCode: item.airlineCode || "",
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
             passengers: params.passengers || "1",
              children: params.children || "0",
              infants: params.infants || "0",
              childDobs: params.childDobs || "[]",
              tripType: params.tripType || "oneway",
              returnDate: params.returnDate || "",
              passengerPricingJson: item.passengerPricing ? JSON.stringify(item.passengerPricing) : "",
              baggageAllowanceJson: item.baggageAllowance ? JSON.stringify(item.baggageAllowance) : "",
              rawOffer: (item as any).rawOffer ? JSON.stringify((item as any).rawOffer) : "",
            },
         })
       }
     >
       {/* Best Price Badge */}
       {isCheapest && (
         <View style={[styles.bestPriceBadge, { backgroundColor: colors.success }]}>
           <Text style={styles.bestPriceText}>أفضل سعر</Text>
         </View>
       )}
       {/* Airline header */}
      <View style={styles.cardHeader}>
        <View style={styles.airlineRow}>
          <View style={[styles.airlineIconBox, { backgroundColor: colors.primary + "15" }]}>
            {item.airlineCode ? (
              <Image
                source={{ uri: `https://images.kiwi.com/airlines/64/${item.airlineCode}.png` }}
                style={styles.airlineLogo}
                resizeMode="contain"
                onError={() => {}}
              />
            ) : (
              <MaterialIcons name="flight" size={22} color={colors.muted} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.airlineName, { color: colors.foreground }]}>{item.airline}</Text>
            {/* Show all flight numbers for multi-segment */}
            {item.allFlightNumbers && item.allFlightNumbers.length > 1 ? (
              <Text style={[styles.flightNumber, { color: colors.muted }]}>
                {item.allFlightNumbers.join(" · ")}
              </Text>
            ) : (
              <Text style={[styles.flightNumber, { color: colors.muted }]}>{item.flightNumber}</Text>
            )}
            {/* Additional carriers: show logos + names for unique operating airlines */}
            {(() => {
              const uniqueOps = [...new Set(
                (item.operatingAirlines || []).filter(c => c && c !== item.airlineCode)
              )];
              if (uniqueOps.length === 0) return null;
              return (
                <View style={styles.additionalCarriersRow}>
                  <MaterialIcons name="connecting-airports" size={11} color={colors.muted} />
                  {uniqueOps.map((code) => (
                    <View key={code} style={styles.additionalCarrierItem}>
                      <Image
                        source={{ uri: `https://images.kiwi.com/airlines/64/${code}.png` }}
                        style={styles.additionalCarrierLogo}
                        resizeMode="contain"
                      />
                      <Text style={[styles.additionalCarrierName, { color: colors.muted }]}>
                        {code}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })()}
          </View>
        </View>
        <View style={styles.priceBox}>
          {/* السعر الإجمالي */}
          <Text style={[styles.price, { color: colors.primary }]}>
            {fmt(flightTotal)}
          </Text>
          <Text style={[styles.perPerson, { color: colors.muted }]}>إجمالي</Text>
          {/* تفاصيل السعر حسب نوع المسافر */}
          {(() => {
            const adultCount = parseInt(params.passengers || "1", 10);
            const childCount = parseInt(params.children || "0", 10);
            const infantCount = parseInt(params.infants || "0", 10);
            // سعر البالغ = السعر الأساسي للرحلة (قبل ضرب في عدد المسافرين)
            // Amadeus يُرجع السعر الإجمالي لجميع المسافرين
            // نحسب سعر البالغ الواحد بقسمة الإجمالي على عدد المسافرين المكافئ
            // (طفل = 0.75 بالغ، رضيع = 0.10 بالغ)
            const equivalentAdults = adultCount + childCount * 0.75 + infantCount * 0.10;
            const adultPrice = Math.round(flightTotal / Math.max(equivalentAdults, 1));
            const childPrice = Math.round(adultPrice * 0.75);
            const infantPrice = Math.round(adultPrice * 0.10);
            if (childCount === 0 && infantCount === 0) {
              // بالغون فقط — عرض سعر البالغ الواحد
              if (adultCount > 1) {
                return (
                  <Text style={[styles.perPersonDetail, { color: colors.muted }]}>
                    {fmt(adultPrice)} / بالغ
                  </Text>
                );
              }
              return null;
            }
            return (
              <View style={{ marginTop: 3, gap: 2, alignItems: "flex-end" }}>
                {adultCount > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={{ fontSize: 10, color: colors.muted }}>
                      {adultCount}×
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.foreground, fontWeight: "600" }}>
                      {fmt(adultPrice)}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.muted }}>بالغ</Text>
                  </View>
                )}
                {childCount > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={{ fontSize: 10, color: colors.muted }}>
                      {childCount}×
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.warning, fontWeight: "600" }}>
                      {fmt(childPrice)}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.muted }}>طفل</Text>
                  </View>
                )}
                {infantCount > 0 && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={{ fontSize: 10, color: colors.muted }}>
                      {infantCount}×
                    </Text>
                    <Text style={{ fontSize: 10, color: colors.muted, fontWeight: "600" }}>
                      {fmt(infantPrice)}
                    </Text>
                    <Text style={{ fontSize: 9, color: colors.muted }}>رضيع</Text>
                  </View>
                )}
              </View>
            );
          })()}
        </View>
      </View>

      {/* Route */}
      <View style={styles.routeRow}>
        <View style={styles.routePoint}>
          <Text style={[styles.time, { color: colors.foreground }]}>{item.departureTime}</Text>
          <Text style={[styles.code, { color: colors.primary }]}>{item.originCode}</Text>
          <Text style={[styles.city, { color: colors.muted }]} numberOfLines={1} ellipsizeMode="tail">
            {item.origin?.replace(/\s*(International|Airport|Intl\.?)\s*/gi, ' ').trim()}
          </Text>
        </View>

        <View style={styles.routeMiddle}>
          {/* Duration — prominent */}
          <Text style={[styles.duration, { color: colors.foreground, fontWeight: "700" }]}>
            {item.duration}
          </Text>
          {/* Route line with stop dots */}
          <View style={styles.routeLine}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            {item.stops > 0 && item.stopCodes && item.stopCodes.map((code, i) => (
              <React.Fragment key={code + i}>
                <View style={[styles.line, { backgroundColor: colors.border }]} />
                <View style={[styles.stopDot, { backgroundColor: colors.warning }]} />
              </React.Fragment>
            ))}
            {item.stops === 0 && <View style={[styles.line, { backgroundColor: colors.border }]} />}
            <View style={[styles.line, { backgroundColor: colors.border }]} />
            <View style={[styles.dot, { backgroundColor: colors.secondary }]} />
          </View>
          {/* Stop status */}
          <Text
            style={[
              styles.stops,
              { color: item.stops === 0 ? colors.success : colors.warning },
            ]}
          >
            {item.stops === 0
              ? t.flights.nonStop
              : `${item.stops} ${item.stops > 1 ? t.flights.stops : t.flights.stop}`}
          </Text>
          {/* Stopover airport codes */}
          {item.stopCodes && item.stopCodes.length > 0 && (
            <Text style={[styles.stopCodes, { color: colors.warning }]}>
              via {item.stopCodes.join(" · ")}
            </Text>
          )}
        </View>

        <View style={[styles.routePoint, { alignItems: "flex-end" }]}>
          <Text style={[styles.time, { color: colors.foreground }]}>{item.arrivalTime}</Text>
          <Text style={[styles.code, { color: colors.secondary }]}>{item.destinationCode}</Text>
          <Text style={[styles.city, { color: colors.muted }]} numberOfLines={1} ellipsizeMode="tail">
            {item.destination?.replace(/\s*(International|Airport|Intl\.?)\s*/gi, ' ').trim()}
          </Text>
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
            {item.seatsLeft} {t.flights.seatsLeft}
          </Text>
        </View>
        {/* Compare toggle button */}
        <Pressable
          style={({ pressed }) => [{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: compareList.find(f => f.id === item.id) ? colors.warning + "30" : colors.border + "60",
            borderWidth: 1,
            borderColor: compareList.find(f => f.id === item.id) ? colors.warning : colors.border,
            alignItems: "center", justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          }]}
          onPress={() => toggleCompare(item)}
        >
          <MaterialIcons
            name={compareList.find(f => f.id === item.id) ? "compare-arrows" : "compare"}
            size={18}
            color={compareList.find(f => f.id === item.id) ? colors.warning : colors.muted}
          />
        </Pressable>
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
                airlineCode: item.airlineCode || "",
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
                 passengers: params.passengers || "1",
                  children: params.children || "0",
                  infants: params.infants || "0",
                  tripType: params.tripType || "oneway",
                  returnDate: params.returnDate || "",
                  passengerPricingJson: item.passengerPricing ? JSON.stringify(item.passengerPricing) : "",
                 baggageAllowanceJson: item.baggageAllowance ? JSON.stringify(item.baggageAllowance) : "",
                 allFlightNumbers: item.allFlightNumbers ? JSON.stringify(item.allFlightNumbers) : "",
                 stopCodes: item.stopCodes ? JSON.stringify(item.stopCodes) : "",
                 operatingAirlines: item.operatingAirlines ? JSON.stringify(item.operatingAirlines) : "",
                 segmentsJson: "",
                 rawOffer: item.rawOffer ? JSON.stringify(item.rawOffer) : "",
                },
             })
           }
        >
          <Text style={styles.selectBtnText}>{t.flights.select}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
  }, [colors, router, params, totalPassengers, cheapestPrice, filteredFlights, fmt, t, compareList, toggleCompare]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {params.originCode ?? ""} {isRoundTrip ? "⇄" : "→"} {params.destinationCode ?? ""}
          </Text>
          <Text style={styles.headerSub}>
            {params.date
              ? new Date(params.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "Any date"}
            {isRoundTrip && params.returnDate
              ? ` – ${new Date(params.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : params.date
              ? `, ${new Date(params.date).getFullYear()}`
              : ""}
            {" · "}{params.passengers ?? 1} pax
            {isRoundTrip ? ` · ${t.home.roundTrip}` : ` · ${t.home.oneWay}`}
          </Text>
        </View>
        <Pressable
          style={[styles.filterBtn, { backgroundColor: showPriceFilter ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)" }]}
          onPress={() => setShowPriceFilter(!showPriceFilter)}
        >
          <IconSymbol name="slider.horizontal.3" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Flexible Dates Strip */}
      {isFlexible && flexDates.length > 0 && (
        <View style={[styles.flexStrip, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.flexStripLabel, { color: colors.muted }]}>
            تواريخ مرنة ±3 أيام
          </Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={flexPrices}
            keyExtractor={(item) => item.date}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            renderItem={({ item }) => {
              const isSelected = effectiveDate === item.date;
              const isOriginal = item.date === params.date;
              // إصلاح timezone: إضافة T12:00:00 لتجنب إزاحة اليوم
              const dayLabel = new Date(item.date + "T12:00:00").toLocaleDateString("ar-SA", { weekday: "short", month: "short", day: "numeric" });
              const allPrices = flexPrices.filter((p) => p.price !== null).map((p) => p.price as number);
              const cheapestDay = allPrices.length > 0 ? Math.min(...allPrices) : null;
              const isCheapestDay = item.price !== null && item.price === cheapestDay;
              return (
                <Pressable
                  style={[styles.flexDayChip, {
                    backgroundColor: isSelected ? colors.primary : colors.background,
                    borderColor: isCheapestDay ? colors.success : isSelected ? colors.primary : colors.border,
                    borderWidth: isCheapestDay || isSelected ? 2 : 1,
                  }]}
                  onPress={() => setSelectedFlexDate(item.date)}
                >
                  {isCheapestDay && (
                    <Text style={[styles.flexCheapBadge, { color: colors.success }]}>أرخص</Text>
                  )}
                  {isOriginal && !isCheapestDay && (
                    <Text style={[styles.flexCheapBadge, { color: colors.muted }]}>مختار</Text>
                  )}
                  <Text style={[styles.flexDayText, { color: isSelected ? "#fff" : colors.foreground }]}>
                    {dayLabel}
                  </Text>
                  {item.isLoading ? (
                    <ActivityIndicator size="small" color={isSelected ? "#fff" : colors.primary} />
                  ) : item.price !== null ? (
                    <Text style={[styles.flexDayPrice, { color: isSelected ? "#fff" : colors.primary }]}>
                      {fmt(item.price)}
                    </Text>
                  ) : (
                    <Text style={[styles.flexDayPrice, { color: colors.muted }]}>—</Text>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      )}

      {/* Round Trip section tabs */}
      {isRoundTrip && (
        <View style={[styles.sectionTabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.sectionTab, activeSection === "outbound" && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveSection("outbound")}
          >
            <IconSymbol name="airplane" size={14} color={activeSection === "outbound" ? colors.primary : colors.muted} />
            <Text style={[styles.sectionTabText, { color: activeSection === "outbound" ? colors.primary : colors.muted }]}>
              {t.flights.outbound}
            </Text>
            <Text style={[styles.sectionTabDate, { color: colors.muted }]}>
              {params.date ? new Date(params.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sectionTab, activeSection === "return" && { borderBottomColor: colors.secondary }]}
            onPress={() => setActiveSection("return")}
          >
            <IconSymbol name="airplane.arrival" size={14} color={activeSection === "return" ? colors.secondary : colors.muted} />
            <Text style={[styles.sectionTabText, { color: activeSection === "return" ? colors.secondary : colors.muted }]}>
              {t.flights.returnLeg}
            </Text>
            <Text style={[styles.sectionTabDate, { color: colors.muted }]}>
              {params.returnDate ? new Date(params.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
            </Text>
            {returnLoading && <ActivityIndicator size="small" color={colors.secondary} style={{ marginLeft: 4 }} />}
          </Pressable>
        </View>
      )}

      {/* Price Range Filter */}
      {showPriceFilter && activeFlights.length > 0 && (
        <View style={[styles.priceFilterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.priceFilterHeader}>
            <Text style={[styles.priceFilterTitle, { color: colors.foreground }]}>نطاق السعر</Text>
            <Pressable
              onPress={() => { setPriceRange([minPrice, maxPrice]); }}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Text style={[styles.priceFilterReset, { color: colors.primary }]}>إعادة تعيين</Text>
            </Pressable>
          </View>
          <View style={styles.priceLabels}>
            <Text style={[styles.priceLabel, { color: colors.primary }]}>
              {fmt(Math.round(priceRange[0]))}
            </Text>
            <Text style={[styles.priceLabel, { color: colors.muted }]}>—</Text>
            <Text style={[styles.priceLabel, { color: colors.primary }]}>
              {fmt(Math.round(priceRange[1]))}
            </Text>
          </View>
          {/* Min slider */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.muted }]}>الحد الأدنى</Text>
            <View style={styles.sliderTrack}>
              <View
                style={[
                  styles.sliderFill,
                  {
                    backgroundColor: colors.primary + "30",
                    left: `${((priceRange[0] - minPrice) / Math.max(maxPrice - minPrice, 1)) * 100}%`,
                    right: `${100 - ((priceRange[1] - minPrice) / Math.max(maxPrice - minPrice, 1)) * 100}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.sliderBtns}>
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const val = Math.round(minPrice + (maxPrice - minPrice) * pct);
                const isActive = priceRange[0] <= val && val <= priceRange[1];
                return (
                  <Pressable
                    key={`min-${pct}`}
                    style={[styles.sliderDot, { backgroundColor: isActive ? colors.primary : colors.border }]}
                    onPress={() => setPriceRange([val, Math.max(val, priceRange[1])])}
                  />
                );
              })}
            </View>
          </View>
          {/* Max slider */}
          <View style={styles.sliderContainer}>
            <Text style={[styles.sliderLabel, { color: colors.muted }]}>الحد الأقصى</Text>
            <View style={styles.sliderBtns}>
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const val = Math.round(minPrice + (maxPrice - minPrice) * pct);
                const isActive = priceRange[0] <= val && val <= priceRange[1];
                return (
                  <Pressable
                    key={`max-${pct}`}
                    style={[styles.sliderDot, { backgroundColor: isActive ? colors.primary : colors.border }]}
                    onPress={() => setPriceRange([Math.min(priceRange[0], val), val])}
                  />
                );
              })}
            </View>
          </View>
          {/* Quick presets */}
          <View style={styles.presetRow}>
            {[
              { label: "< $250", max: Math.round(250 * 40.08) },
              { label: "$250-500", min: Math.round(250 * 40.08), max: Math.round(500 * 40.08) },
              { label: "$500-1K", min: Math.round(500 * 40.08), max: Math.round(1000 * 40.08) },
              { label: "> $1K", min: Math.round(1000 * 40.08) },
            ].map((preset) => {
              const pMin = preset.min ?? minPrice;
              const pMax = preset.max ?? maxPrice;
              const isActive = priceRange[0] === pMin && priceRange[1] === pMax;
              return (
                <Pressable
                  key={preset.label}
                  style={[styles.presetChip, { backgroundColor: isActive ? colors.primary : colors.border + "40" }]}
                  onPress={() => setPriceRange([pMin, pMax])}
                >
                  <Text style={[styles.presetText, { color: isActive ? "#FFF" : colors.muted }]}>
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Sort & Filter */}
      <View
        style={[
          styles.filterBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.sortRow}>
          <Text style={[styles.sortLabel, { color: colors.muted }]}>{t.flights.sortBy}</Text>
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
                {opt === "price" ? t.flights.price : opt === "duration" ? t.flights.duration : t.flights.departure}
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
                {cls === "ECONOMY" ? t.flights.economy : cls === "BUSINESS" ? t.flights.business : cls === "FIRST" ? t.flights.first : t.flights.all}
              </Text>
            </Pressable>
          ))}
        </View>
        {/* Direct flights filter */}
        <View style={[styles.classRow, { marginTop: 4 }]}>
          <Pressable
            style={[styles.classChip, filterDirectOnly && { backgroundColor: colors.success + "25", borderColor: colors.success }]}
            onPress={() => setFilterDirectOnly(!filterDirectOnly)}
          >
            <MaterialIcons name="flight" size={14} color={filterDirectOnly ? colors.success : colors.muted} style={{ marginRight: 3 }} />
            <Text style={[styles.classChipText, { color: filterDirectOnly ? colors.success : colors.muted, fontWeight: filterDirectOnly ? "700" : "400" }]}>
              رحلات مباشرة فقط
            </Text>
          </Pressable>
          <Text style={[styles.sortLabel, { color: colors.muted, marginLeft: 8 }]}>
            {filteredFlights.filter(f => f.stops === 0).length} مباشرة
          </Text>
        </View>
        {/* Bags filter row */}
        <View style={[styles.classRow, { marginTop: 4 }]}>
          <MaterialIcons name="luggage" size={18} color={colors.muted} style={{ marginRight: 4 }} />
          {([null, 1, 2, 3] as (number | null)[]).map((n) => (
            <Pressable
              key={String(n)}
              style={[
                styles.classChip,
                filterBags === n && { backgroundColor: colors.primary + "30" },
              ]}
              onPress={() => setFilterBags(n)}
            >
              <Text style={[styles.classChipText, { color: filterBags === n ? colors.primary : colors.muted }]}>
                {n === null ? "All" : `${n}+`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Stops filter row */}
        <View style={[styles.classRow, { marginTop: 4 }]}>
          <MaterialIcons name="connecting-airports" size={18} color={colors.muted} style={{ marginRight: 4 }} />
          {([null, 0, 1, 2] as (number | null)[]).map((n) => {
            const label = n === null ? "الكل" : n === 0 ? "مباشر" : n === 1 ? "توقف 1" : "توقف 2+";
            const isActive = filterStops === n;
            return (
              <Pressable
                key={String(n)}
                style={[styles.classChip, isActive && { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}
                onPress={() => setFilterStops(n)}
              >
                <Text style={[styles.classChipText, { color: isActive ? colors.primary : colors.muted, fontWeight: isActive ? "700" : "400" }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Airline filter row — shown only when multiple airlines available */}
        {uniqueAirlines.length > 1 && (
          <View style={[styles.classRow, { marginTop: 4, flexWrap: "wrap" }]}>
            <MaterialIcons name="flight" size={18} color={colors.muted} style={{ marginRight: 4 }} />
            <Pressable
              style={[styles.classChip, filterAirline === "All" && { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}
              onPress={() => setFilterAirline("All")}
            >
              <Text style={[styles.classChipText, { color: filterAirline === "All" ? colors.primary : colors.muted }]}>الكل</Text>
            </Pressable>
            {uniqueAirlines.map(({ code, name }) => {
              const isActive = filterAirline === code;
              return (
                <Pressable
                  key={code}
                  style={[styles.classChip, isActive && { backgroundColor: colors.primary + "30", borderColor: colors.primary }, { flexDirection: "row", alignItems: "center", gap: 4 }]}
                  onPress={() => setFilterAirline(isActive ? "All" : code)}
                >
                  <Image source={{ uri: `https://images.kiwi.com/airlines/64/${code}.png` }} style={{ width: 16, height: 16, borderRadius: 2 }} resizeMode="contain" />
                  <Text style={[styles.classChipText, { color: isActive ? colors.primary : colors.muted, fontWeight: isActive ? "700" : "400" }]}>
                    {name.length > 12 ? name.slice(0, 12) + "…" : name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Loading / Error / Results count */}
      {isLoading && !useMock ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            {t.flights.searching}
          </Text>
        </View>
      ) : (
        <>
          <View style={[styles.resultsCount, { backgroundColor: colors.background }]}>
            <Text style={[styles.resultsText, { color: colors.muted }]}>
              {filteredFlights.length} {t.flights.flightsFound}
              {!useMock && duffelResult?.success ? " · Live" : " · Mock"}
            </Text>
            {isError && (
              <Text style={[styles.errorNote, { color: colors.warning }]}>
                {t.flights.liveUnavailable}
              </Text>
            )}
          </View>

          <Animated.View style={{ flex: 1, opacity: listAnim }}>
          <FlatList
            data={filteredFlights}
            keyExtractor={(item) => item.id}
            renderItem={renderFlight}
            contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: colors.background }}
            maxToRenderPerBatch={6}
            initialNumToRender={5}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MaterialIcons name="flight" size={40} color={colors.muted} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t.flights.noFlights}</Text>
                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  {t.flights.noFlightsHint}
                </Text>
              </View>
            }
          />
          </Animated.View>
        </>
      )}

      {/* Compare Bar — shown when 1 or 2 flights selected */}
      {compareList.length > 0 && (
        <View style={[compareStyles.bar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={compareStyles.barLeft}>
            <MaterialIcons name="compare" size={20} color={colors.primary} />
            <Text style={[compareStyles.barText, { color: colors.foreground }]}>
              {compareList.length === 1 ? "اختر رحلة ثانية للمقارنة" : "جاهز للمقارنة"}
            </Text>
          </View>
          <View style={compareStyles.barRight}>
            {compareList.length === 2 && (
              <Pressable
                style={[compareStyles.compareBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowCompare(true)}
              >
                <Text style={compareStyles.compareBtnText}>قارن</Text>
              </Pressable>
            )}
            <Pressable
              style={[compareStyles.clearBtn, { borderColor: colors.border }]}
              onPress={() => setCompareList([])}
            >
              <MaterialIcons name="close" size={16} color={colors.muted} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Compare Modal */}
      <Modal visible={showCompare} animationType="slide" transparent onRequestClose={() => setShowCompare(false)}>
        <View style={compareStyles.modalOverlay}>
          <View style={[compareStyles.modalSheet, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={[compareStyles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[compareStyles.modalTitle, { color: colors.foreground }]}>مقارنة الرحلات</Text>
              <Pressable onPress={() => setShowCompare(false)}>
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>
            {/* Comparison Table */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {compareList.length === 2 && (() => {
                const [a, b] = compareList;
                const aPrice = getFlightTotalMRU(a);
                const bPrice = getFlightTotalMRU(b);
                const aDur = a.duration;
                const bDur = b.duration;
                const rows: { label: string; aVal: string; bVal: string; aWin?: boolean; bWin?: boolean }[] = [
                  { label: "الناقلة", aVal: a.airline, bVal: b.airline },
                  { label: "رقم الرحلة", aVal: a.flightNumber, bVal: b.flightNumber },
                  { label: "الإقلاع", aVal: a.departureTime, bVal: b.departureTime },
                  { label: "الوصول", aVal: a.arrivalTime, bVal: b.arrivalTime },
                  { label: "المدة", aVal: aDur, bVal: bDur, aWin: aDur < bDur, bWin: bDur < aDur },
                  { label: "التوقفات", aVal: a.stops === 0 ? "مباشر" : `${a.stops} توقف`, bVal: b.stops === 0 ? "مباشر" : `${b.stops} توقف`, aWin: a.stops < b.stops, bWin: b.stops < a.stops },
                  { label: "الدرجة", aVal: a.class, bVal: b.class },
                  { label: "المقاعد المتبقية", aVal: `${a.seatsLeft}`, bVal: `${b.seatsLeft}`, aWin: a.seatsLeft > b.seatsLeft, bWin: b.seatsLeft > a.seatsLeft },
                  { label: "السعر الإجمالي", aVal: `${fmt(aPrice)} MRU`, bVal: `${fmt(bPrice)} MRU`, aWin: aPrice < bPrice, bWin: bPrice < aPrice },
                ];
                return (
                  <View style={{ padding: 16 }}>
                    {/* Airline logos header */}
                    <View style={compareStyles.compareHeader}>
                      <View style={compareStyles.compareCol}>
                        <Image source={{ uri: `https://images.kiwi.com/airlines/64/${a.airlineCode}.png` }} style={compareStyles.compareLogo} resizeMode="contain" />
                        <Text style={[compareStyles.compareAirline, { color: colors.foreground }]} numberOfLines={1}>{a.airline}</Text>
                        <Text style={[compareStyles.compareRoute, { color: colors.muted }]}>{a.originCode} → {a.destinationCode}</Text>
                      </View>
                      <View style={compareStyles.vsCol}>
                        <Text style={[compareStyles.vsText, { color: colors.muted }]}>VS</Text>
                      </View>
                      <View style={compareStyles.compareCol}>
                        <Image source={{ uri: `https://images.kiwi.com/airlines/64/${b.airlineCode}.png` }} style={compareStyles.compareLogo} resizeMode="contain" />
                        <Text style={[compareStyles.compareAirline, { color: colors.foreground }]} numberOfLines={1}>{b.airline}</Text>
                        <Text style={[compareStyles.compareRoute, { color: colors.muted }]}>{b.originCode} → {b.destinationCode}</Text>
                      </View>
                    </View>
                    {/* Rows */}
                    {rows.map((row, i) => (
                      <View key={i} style={[compareStyles.compareRow, { borderBottomColor: colors.border, backgroundColor: i % 2 === 0 ? colors.background : colors.surface }]}>
                        <Text style={[compareStyles.rowLabel, { color: colors.muted }]}>{row.label}</Text>
                        <Text style={[compareStyles.rowVal, { color: row.aWin ? colors.success : colors.foreground, fontWeight: row.aWin ? "700" : "400" }]}>
                          {row.aWin ? "✓ " : ""}{row.aVal}
                        </Text>
                        <Text style={[compareStyles.rowVal, { color: row.bWin ? colors.success : colors.foreground, fontWeight: row.bWin ? "700" : "400" }]}>
                          {row.bWin ? "✓ " : ""}{row.bVal}
                        </Text>
                      </View>
                    ))}
                    {/* Action buttons */}
                    <View style={compareStyles.compareActions}>
                      <Pressable
                        style={[compareStyles.selectFlight, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setShowCompare(false);
                          router.push({ pathname: "/flights/detail" as any, params: { id: a.id, airline: a.airline, airlineCode: a.airlineCode || "", flightNumber: a.flightNumber, originCode: a.originCode, origin: a.origin, destinationCode: a.destinationCode, destination: a.destination, departureTime: a.departureTime, arrivalTime: a.arrivalTime, duration: a.duration, stops: String(a.stops), price: String(a.price), currency: a.currency || "USD", class: a.class, seatsLeft: String(a.seatsLeft), passengers: params.passengers || "1", children: params.children || "0", infants: params.infants || "0", tripType: params.tripType || "oneway", returnDate: params.returnDate || "", rawOffer: a.rawOffer ? JSON.stringify(a.rawOffer) : "" } });
                        }}
                      >
                        <Text style={compareStyles.selectFlightText}>اختر الأولى</Text>
                      </Pressable>
                      <Pressable
                        style={[compareStyles.selectFlight, { backgroundColor: colors.primary }]}
                        onPress={() => {
                          setShowCompare(false);
                          router.push({ pathname: "/flights/detail" as any, params: { id: b.id, airline: b.airline, airlineCode: b.airlineCode || "", flightNumber: b.flightNumber, originCode: b.originCode, origin: b.origin, destinationCode: b.destinationCode, destination: b.destination, departureTime: b.departureTime, arrivalTime: b.arrivalTime, duration: b.duration, stops: String(b.stops), price: String(b.price), currency: b.currency || "USD", class: b.class, seatsLeft: String(b.seatsLeft), passengers: params.passengers || "1", children: params.children || "0", infants: params.infants || "0", tripType: params.tripType || "oneway", returnDate: params.returnDate || "", rawOffer: b.rawOffer ? JSON.stringify(b.rawOffer) : "" } });
                        }}
                      >
                        <Text style={compareStyles.selectFlightText}>اختر الثانية</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  airlineRow: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, marginRight: 8 },
  airlineIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  airlineLogo: {
    width: 34,
    height: 34,
    borderRadius: 4,
  },
  airlineName: { fontSize: 15, fontWeight: "600" },
  flightNumber: { fontSize: 12, marginTop: 2 },
  priceBox: { alignItems: "flex-end", flexShrink: 0, minWidth: 100 },
  price: { fontSize: 18, fontWeight: "700" },
  perPerson: { fontSize: 11 },
  perPersonDetail: { fontSize: 10, marginTop: 1 },
  bestPriceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 10,
  },
  bestPriceText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  routePoint: { alignItems: "flex-start", minWidth: 70, maxWidth: 110 },
  time: { fontSize: 20, fontWeight: "700" },
  code: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  city: { fontSize: 10, marginTop: 1 },
  routeMiddle: { flex: 1, alignItems: "center", gap: 4 },
  duration: { fontSize: 12 },
  routeLine: { flexDirection: "row", alignItems: "center", width: "100%" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  line: { flex: 1, height: 1.5 },
  stopDot: { width: 6, height: 6, borderRadius: 3 },
  stops: { fontSize: 11, fontWeight: "600" },
  stopCodes: { fontSize: 10, fontWeight: "600", textAlign: "center" },
  operatedBy: { fontSize: 10, marginTop: 1, fontStyle: "italic" },
  additionalCarriersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 4,
    flexWrap: "wrap",
  },
  additionalCarrierItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  additionalCarrierLogo: { width: 14, height: 14, borderRadius: 2 },
  additionalCarrierName: { fontSize: 10, fontWeight: "600" },
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
  // Round Trip section tabs
  sectionTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  sectionTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  sectionTabText: { fontSize: 14, fontWeight: "700" },
  sectionTabDate: { fontSize: 12 },
  // Price filter styles
  priceFilterBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  priceFilterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceFilterTitle: { fontSize: 14, fontWeight: "700" },
  priceFilterReset: { fontSize: 13, fontWeight: "600" },
  priceLabels: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  priceLabel: { fontSize: 16, fontWeight: "700" },
  sliderContainer: { gap: 6 },
  sliderLabel: { fontSize: 11, fontWeight: "600" },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E5E7EB",
    position: "relative",
    overflow: "hidden",
  },
  sliderFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    borderRadius: 2,
  },
  sliderBtns: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  presetRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  presetText: { fontSize: 12, fontWeight: "600" },
  flexStrip: {
    borderBottomWidth: 1,
    paddingTop: 8,
    paddingBottom: 10,
  },
  flexStripLabel: {
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 8,
    textAlign: "right",
  },
  flexDayChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
    gap: 2,
  },
  flexCheapBadge: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  flexDayText: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
  },
  flexDayPrice: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});

const compareStyles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  barLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  barText: { fontSize: 14, fontWeight: "600" },
  barRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  compareBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 10 },
  compareBtnText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  clearBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "90%", minHeight: "60%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  compareHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  compareCol: { flex: 1, alignItems: "center", gap: 6 },
  vsCol: { width: 32, alignItems: "center" },
  vsText: { fontSize: 14, fontWeight: "700" },
  compareLogo: { width: 48, height: 48, borderRadius: 8 },
  compareAirline: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  compareRoute: { fontSize: 11, textAlign: "center" },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 0.5 },
  rowLabel: { width: 90, fontSize: 12, fontWeight: "600" },
  rowVal: { flex: 1, fontSize: 13, textAlign: "center" },
  compareActions: { flexDirection: "row", gap: 12, marginTop: 20, paddingBottom: 20 },
  selectFlight: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  selectFlightText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
});
