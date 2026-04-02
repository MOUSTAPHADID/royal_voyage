import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCurrency } from "@/lib/currency-context";
import { toMRUWithSettings, getAgencyFee } from "@/lib/pricing-settings";

// ── Deal Data ──
export interface Deal {
  id: string;
  type: "flight" | "hotel";
  title: string;
  subtitle: string;
  image: string;
  originalPrice: number;
  discountedPrice: number;
  currency: string;
  discountPercent: number;
  badge: string;
  badgeColor: string;
  expiresAt: string; // ISO date
  // Flight-specific
  airline?: string;
  flightNumber?: string;
  originCode?: string;
  origin?: string;
  destinationCode?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  duration?: string;
  stops?: number;
  cabinClass?: string;
  // Hotel-specific
  hotelName?: string;
  hotelCity?: string;
  hotelCountry?: string;
  stars?: number;
  nights?: number;
}

function getDealsEndDate(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function getTomorrowEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function getWeekEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

const TODAY_DEALS: Deal[] = [
  {
    id: "deal1",
    type: "flight",
    title: "نواكشوط → اسطنبول",
    subtitle: "Mauritania Airlines · رحلة مباشرة",
    image: "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80",
    originalPrice: 850,
    discountedPrice: 595,
    currency: "USD",
    discountPercent: 30,
    badge: "عرض ساخن",
    badgeColor: "#EF4444",
    expiresAt: getDealsEndDate(),
    airline: "Mauritania Airlines",
    flightNumber: "L6 201",
    originCode: "NKC",
    origin: "Nouakchott",
    destinationCode: "IST",
    destination: "Istanbul",
    departureTime: "08:30",
    arrivalTime: "18:45",
    duration: "7h 15m",
    stops: 0,
    cabinClass: "Economy",
  },
  {
    id: "deal2",
    type: "flight",
    title: "نواكشوط → الدار البيضاء",
    subtitle: "Royal Air Maroc · رحلة مباشرة",
    image: "https://images.unsplash.com/photo-1569383746724-6f1b882b8f46?w=800&q=80",
    originalPrice: 420,
    discountedPrice: 294,
    currency: "USD",
    discountPercent: 30,
    badge: "الأكثر طلباً",
    badgeColor: "#C9A84C",
    expiresAt: getTomorrowEnd(),
    airline: "Royal Air Maroc",
    flightNumber: "AT 520",
    originCode: "NKC",
    origin: "Nouakchott",
    destinationCode: "CMN",
    destination: "Casablanca",
    departureTime: "14:00",
    arrivalTime: "17:30",
    duration: "2h 30m",
    stops: 0,
    cabinClass: "Economy",
  },
  {
    id: "deal3",
    type: "flight",
    title: "نواكشوط → باريس",
    subtitle: "Air France · توقف واحد",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
    originalPrice: 780,
    discountedPrice: 546,
    currency: "USD",
    discountPercent: 30,
    badge: "سعر خاص",
    badgeColor: "#3B82F6",
    expiresAt: getWeekEnd(),
    airline: "Air France",
    flightNumber: "AF 750",
    originCode: "NKC",
    origin: "Nouakchott",
    destinationCode: "CDG",
    destination: "Paris",
    departureTime: "22:15",
    arrivalTime: "08:30",
    duration: "6h 15m",
    stops: 1,
    cabinClass: "Economy",
  },
  {
    id: "deal4",
    type: "hotel",
    title: "فندق أزاليا نواكشوط",
    subtitle: "نواكشوط · 4 نجوم · إفطار مجاني",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    originalPrice: 120,
    discountedPrice: 84,
    currency: "USD",
    discountPercent: 30,
    badge: "عرض فندقي",
    badgeColor: "#10B981",
    expiresAt: getWeekEnd(),
    hotelName: "Azalai Hotel Nouakchott",
    hotelCity: "Nouakchott",
    hotelCountry: "Mauritania",
    stars: 4,
    nights: 3,
  },
  {
    id: "deal5",
    type: "flight",
    title: "نواكشوط → دبي",
    subtitle: "Emirates · توقف واحد",
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
    originalPrice: 950,
    discountedPrice: 665,
    currency: "USD",
    discountPercent: 30,
    badge: "عرض مميز",
    badgeColor: "#8B5CF6",
    expiresAt: getTomorrowEnd(),
    airline: "Emirates",
    flightNumber: "EK 780",
    originCode: "NKC",
    origin: "Nouakchott",
    destinationCode: "DXB",
    destination: "Dubai",
    departureTime: "01:30",
    arrivalTime: "14:00",
    duration: "9h 30m",
    stops: 1,
    cabinClass: "Economy",
  },
  {
    id: "deal6",
    type: "flight",
    title: "نواكشوط → جدة",
    subtitle: "Saudia · رحلة مباشرة",
    image: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=800&q=80",
    originalPrice: 680,
    discountedPrice: 476,
    currency: "USD",
    discountPercent: 30,
    badge: "عمرة",
    badgeColor: "#059669",
    expiresAt: getWeekEnd(),
    airline: "Saudia",
    flightNumber: "SV 310",
    originCode: "NKC",
    origin: "Nouakchott",
    destinationCode: "JED",
    destination: "Jeddah",
    departureTime: "06:00",
    arrivalTime: "14:30",
    duration: "5h 30m",
    stops: 0,
    cabinClass: "Economy",
  },
];

// ── Countdown Hook ──
function useCountdown(expiresAt: string) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      setRemaining(diff > 0 ? diff : 0);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return remaining;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "انتهى العرض";
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (hours > 0) return `${hours}س ${minutes}د ${seconds}ث`;
  return `${minutes}د ${seconds}ث`;
}

// ── Deal Card Component ──
function DealCard({ deal, onPress }: { deal: Deal; onPress: () => void }) {
  const colors = useColors();
  const { fmt } = useCurrency();
  const remaining = useCountdown(deal.expiresAt);
  const isExpired = remaining <= 0;
  const isUrgent = remaining > 0 && remaining < 3600000; // less than 1 hour

  const originalMRU = toMRUWithSettings(deal.originalPrice, deal.currency);
  const discountedMRU = toMRUWithSettings(deal.discountedPrice, deal.currency);

  // Pulse animation for urgent deals
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (isUrgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.02, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isUrgent]);

  return (
    <Animated.View style={[{ transform: [{ scale: isUrgent ? pulseAnim : 1 }] }]}>
      <Pressable
        style={({ pressed }) => [
          styles.dealCard,
          {
            backgroundColor: colors.surface,
            borderColor: isUrgent ? "#EF4444" : colors.border,
            opacity: pressed ? 0.92 : isExpired ? 0.5 : 1,
          },
        ]}
        onPress={onPress}
        disabled={isExpired}
      >
        {/* Image */}
        <Image source={{ uri: deal.image }} style={styles.dealImage} />

        {/* Badge */}
        <View style={[styles.dealBadge, { backgroundColor: deal.badgeColor }]}>
          <Text style={styles.dealBadgeText}>{deal.badge}</Text>
        </View>

        {/* Discount Badge */}
        <View style={[styles.discountBadge, { backgroundColor: "#EF4444" }]}>
          <Text style={styles.discountBadgeText}>-{deal.discountPercent}%</Text>
        </View>

        {/* Content */}
        <View style={styles.dealContent}>
          <Text style={[styles.dealTitle, { color: colors.foreground }]} numberOfLines={1}>
            {deal.title}
          </Text>
          <Text style={[styles.dealSubtitle, { color: colors.muted }]} numberOfLines={1}>
            {deal.subtitle}
          </Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View style={styles.priceLeft}>
              <Text style={[styles.originalPrice, { color: colors.muted }]}>
                {fmt(originalMRU)}
              </Text>
              <Text style={[styles.discountedPrice, { color: colors.primary }]}>
                {fmt(discountedMRU)}
              </Text>
            </View>
            <View style={[styles.saveBadge, { backgroundColor: colors.success + "15" }]}>
              <Text style={[styles.saveText, { color: colors.success }]}>
                وفّر {fmt(originalMRU - discountedMRU)}
              </Text>
            </View>
          </View>

          {/* Countdown */}
          <View style={[
            styles.countdownRow,
            {
              backgroundColor: isExpired
                ? colors.error + "10"
                : isUrgent
                  ? "#EF444415"
                  : colors.warning + "10",
            },
          ]}>
            <IconSymbol name="timer" size={14} color={isExpired ? colors.error : isUrgent ? "#EF4444" : colors.warning} />
            <Text style={[
              styles.countdownText,
              {
                color: isExpired
                  ? colors.error
                  : isUrgent
                    ? "#EF4444"
                    : colors.warning,
              },
            ]}>
              {isExpired ? "انتهى العرض" : `ينتهي خلال ${formatCountdown(remaining)}`}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Main Screen ──
export default function DealsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { fmt } = useCurrency();
  const [filter, setFilter] = useState<"all" | "flights" | "hotels">("all");

  // Page-level countdown for the main banner
  const bannerRemaining = useCountdown(getDealsEndDate());

  const filteredDeals = TODAY_DEALS.filter((d) => {
    if (filter === "flights") return d.type === "flight";
    if (filter === "hotels") return d.type === "hotel";
    return true;
  });

  const handleDealPress = (deal: Deal) => {
    if (deal.type === "flight") {
      const discountedMRU = toMRUWithSettings(deal.discountedPrice, deal.currency);
      router.push({
        pathname: "/booking/passenger-details" as any,
        params: {
          type: "flight",
          id: deal.id,
          airline: deal.airline ?? "",
          flightNumber: deal.flightNumber ?? "",
          originCode: deal.originCode ?? "",
          origin: deal.origin ?? "",
          destinationCode: deal.destinationCode ?? "",
          destination: deal.destination ?? "",
          departureTime: deal.departureTime ?? "",
          arrivalTime: deal.arrivalTime ?? "",
          duration: deal.duration ?? "",
          price: String(discountedMRU),
          priceCurrency: "MRU",
          currency: deal.currency,
          class: deal.cabinClass ?? "Economy",
          tripType: "oneway",
          returnDate: "",
          passengers: "1",
          children: "0",
          dealDiscount: String(deal.discountPercent),
          dealOriginalPrice: String(toMRUWithSettings(deal.originalPrice, deal.currency)),
        },
      });
    } else {
      // Hotel deal — navigate to hotel search or detail
      router.push({
        pathname: "/(tabs)" as any,
      });
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>عروض اليوم</Text>
          <Text style={styles.headerSubtitle}>Today's Deals</Text>
        </View>
        <View style={styles.headerRight}>
          <IconSymbol name="flame.fill" size={22} color="#C9A84C" />
        </View>
      </View>

      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary + "30" }]}>
        <View style={styles.bannerLeft}>
          <IconSymbol name="flame.fill" size={28} color="#EF4444" />
        </View>
        <View style={styles.bannerCenter}>
          <Text style={[styles.bannerTitle, { color: colors.foreground }]}>عروض حصرية لفترة محدودة!</Text>
          <Text style={[styles.bannerDesc, { color: colors.muted }]}>خصومات تصل إلى 30% على رحلات وفنادق مختارة</Text>
        </View>
        <View style={[styles.bannerTimer, { backgroundColor: colors.primary }]}>
          <IconSymbol name="timer" size={12} color="#FFFFFF" />
          <Text style={styles.bannerTimerText}>
            {formatCountdown(bannerRemaining)}
          </Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { borderColor: colors.border }]}>
        {([
          { key: "all", label: "الكل", icon: "flame.fill" },
          { key: "flights", label: "رحلات", icon: "airplane" },
          { key: "hotels", label: "فنادق", icon: "building.2.fill" },
        ] as { key: "all" | "flights" | "hotels"; label: string; icon: any }[]).map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === tab.key ? colors.primary : "transparent",
                borderColor: filter === tab.key ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <IconSymbol
              name={tab.icon}
              size={16}
              color={filter === tab.key ? "#FFFFFF" : colors.muted}
            />
            <Text
              style={[
                styles.filterTabText,
                { color: filter === tab.key ? "#FFFFFF" : colors.muted },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Deals List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.dealsList}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: colors.muted }]}>
            {filteredDeals.length} عرض متاح
          </Text>
          <View style={[styles.statsBadge, { backgroundColor: colors.success + "15" }]}>
            <Text style={[styles.statsBadgeText, { color: colors.success }]}>
              خصم يصل إلى 30%
            </Text>
          </View>
        </View>

        {filteredDeals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onPress={() => handleDealPress(deal)}
          />
        ))}

        {filteredDeals.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="tag.fill" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد عروض حالياً</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>تابعنا للحصول على أحدث العروض</Text>
          </View>
        )}

        {/* Info Note */}
        <View style={[styles.infoNote, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "20" }]}>
          <IconSymbol name="info.circle.fill" size={16} color={colors.primary} />
          <Text style={[styles.infoNoteText, { color: colors.muted }]}>
            الأسعار المعروضة تشمل الضرائب ورسوم الخدمة. العروض محدودة وقابلة للتغيير.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  headerCenter: { alignItems: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  headerRight: { padding: 4 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  bannerLeft: {},
  bannerCenter: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  bannerDesc: { fontSize: 12 },
  bannerTimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bannerTimerText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTabText: { fontSize: 13, fontWeight: "600" },
  dealsList: { paddingHorizontal: 16 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statsText: { fontSize: 13, fontWeight: "600" },
  statsBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statsBadgeText: { fontSize: 11, fontWeight: "700" },
  dealCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  dealImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  dealBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dealBadgeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  discountBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountBadgeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  dealContent: { padding: 14, gap: 6 },
  dealTitle: { fontSize: 16, fontWeight: "700" },
  dealSubtitle: { fontSize: 13 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  priceLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: "line-through",
  },
  discountedPrice: { fontSize: 18, fontWeight: "800" },
  saveBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  saveText: { fontSize: 11, fontWeight: "700" },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  countdownText: { fontSize: 12, fontWeight: "600" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptyDesc: { fontSize: 13 },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  infoNoteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
