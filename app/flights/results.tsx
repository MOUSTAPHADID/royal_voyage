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
import { applyMarkup, getAgencyFee } from "@/lib/pricing-settings";

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
  }>();

  const isRoundTrip = params.tripType === "roundtrip" && !!params.returnDate;
  const { t } = useTranslation();
  const { fmt } = useCurrency();

  // Sort & Filter
  const [sortBy, setSortBy] = useState<SortOption>("price");
  const [filterClass, setFilterClass] = useState<string>("All");
  const [filterBags, setFilterBags] = useState<number | null>(null); // null = All
  const [activeSection, setActiveSection] = useState<"outbound" | "return">("outbound");
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 999999]);
  const [priceRangeInitialized, setPriceRangeInitialized] = useState(false);

  // Always use Duffel Production API — useMock is kept for emergency fallback only
  const useMock = false;const classes = ["All", "ECONOMY", "BUSINESS", "FIRST"];

  // Duffel Production API query — outbound
  const { data: duffelResult, isLoading, isError } = trpc.duffel.searchFlights.useQuery(
    {
      originCode: params.originCode || "",
      destinationCode: params.destinationCode || "",
      departureDate: params.date || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
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

  const getFlightTotalMRU = (f: AnyFlight) => applyMarkup(toMRU(f.price, f.currency || "EUR") + getAgencyFee(f.originCode, f.destinationCode), f.originCode, f.destinationCode, f.class);

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

  const filteredFlights = useMemo(() => {
    return activeFlights
      .filter((f) => filterClass === "All" || f.class === filterClass)
      .filter((f) => {
        const priceMRU = getFlightTotalMRU(f);
        return priceMRU >= priceRange[0] && priceMRU <= priceRange[1];
      })
      .filter((f) => {
        if (filterBags === null) return true;
        // Filter by checked baggage quantity
        const checkedQty = f.baggageAllowance?.checked?.quantity ?? 1;
        return checkedQty >= filterBags;
      })
      .sort((a, b) => {
        if (sortBy === "price") return getFlightTotalMRU(a) - getFlightTotalMRU(b);
        if (sortBy === "duration") return a.duration.localeCompare(b.duration);
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [activeFlights, filterClass, sortBy, priceRange]);

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
          <View>
            <Text style={[styles.airlineName, { color: colors.foreground }]}>{item.airline}</Text>
            <Text style={[styles.flightNumber, { color: colors.muted }]}>{item.flightNumber}</Text>
          </View>
        </View>
        <View style={styles.priceBox}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {fmt(flightTotal)}
          </Text>
          <Text style={[styles.perPerson, { color: colors.muted }]}>الإجمالي</Text>
          {totalPassengers > 1 && (
            <Text style={[styles.perPersonDetail, { color: colors.muted }]}>
              {fmt(perPerson)} / شخص
            </Text>
          )}
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
            {item.stops === 0 ? t.flights.nonStop : `${item.stops} ${item.stops > 1 ? t.flights.stops : t.flights.stop}`}
          </Text>
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
                },
             })
           }
        >
          <Text style={styles.selectBtnText}>{t.flights.select}</Text>
        </Pressable>
      </View>
    </Pressable>
  );
  }, [colors, router, params, totalPassengers, cheapestPrice, filteredFlights, fmt, t]);

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
    overflow: "hidden",
  },
  airlineLogo: {
    width: 34,
    height: 34,
    borderRadius: 4,
  },
  airlineName: { fontSize: 15, fontWeight: "600" },
  flightNumber: { fontSize: 12, marginTop: 2 },
  priceBox: { alignItems: "flex-end" },
  price: { fontSize: 22, fontWeight: "700" },
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
});
