import { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/lib/i18n";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────
type SeatPreference = "window" | "middle" | "aisle";
type CheckinStep = "info" | "seat" | "confirm" | "done";

interface SeatInfo {
  id: string;
  row: number;
  col: string;
  type: SeatPreference;
  available: boolean;
  isExit: boolean;
  isExtra: boolean; // extra legroom
}

// ─── Seat Map Generator ───────────────────────────────────────────
const COLS = ["A", "B", "C", "D", "E", "F"];
const COL_TYPES: Record<string, SeatPreference> = {
  A: "window",
  B: "middle",
  C: "aisle",
  D: "aisle",
  E: "middle",
  F: "window",
};
const EXIT_ROWS = [12, 25];
const EXTRA_ROWS = [1, 12, 25];

function generateSeatMap(rows: number = 30): SeatInfo[] {
  const seats: SeatInfo[] = [];
  for (let row = 1; row <= rows; row++) {
    for (const col of COLS) {
      // Randomly mark ~25% as unavailable (already taken)
      const hash = (row * 7 + col.charCodeAt(0) * 13) % 100;
      seats.push({
        id: `${row}${col}`,
        row,
        col,
        type: COL_TYPES[col],
        available: hash > 25,
        isExit: EXIT_ROWS.includes(row),
        isExtra: EXTRA_ROWS.includes(row),
      });
    }
  }
  return seats;
}

// ─── Boarding Group Generator ─────────────────────────────────────
function getBoardingGroup(row: number): string {
  if (row <= 5) return "A";
  if (row <= 15) return "B";
  if (row <= 25) return "C";
  return "D";
}

// ─── Step Indicator ───────────────────────────────────────────────
function StepIndicator({
  steps,
  current,
  colors,
}: {
  steps: { key: CheckinStep; label: string }[];
  current: CheckinStep;
  colors: any;
}) {
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <View style={stepStyles.container}>
      {steps.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <View key={step.key} style={stepStyles.item}>
            <View
              style={[
                stepStyles.circle,
                {
                  backgroundColor: isDone
                    ? colors.success
                    : isActive
                      ? colors.primary
                      : colors.border,
                },
              ]}
            >
              {isDone ? (
                <IconSymbol name="checkmark.circle.fill" size={14} color="#FFF" />
              ) : (
                <Text
                  style={[
                    stepStyles.circleText,
                    { color: isActive ? "#FFF" : colors.muted },
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                stepStyles.label,
                {
                  color: isActive ? colors.primary : isDone ? colors.success : colors.muted,
                  fontWeight: isActive ? "700" : "500",
                },
              ]}
            >
              {step.label}
            </Text>
            {i < steps.length - 1 && (
              <View
                style={[
                  stepStyles.line,
                  {
                    backgroundColor: isDone ? colors.success : colors.border,
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  circleText: {
    fontSize: 12,
    fontWeight: "700",
  },
  label: {
    fontSize: 11,
    marginLeft: 4,
  },
  line: {
    width: 20,
    height: 2,
    marginHorizontal: 6,
    borderRadius: 1,
  },
});

// ─── Seat Component ───────────────────────────────────────────────
function SeatButton({
  seat,
  isSelected,
  colors,
  onPress,
}: {
  seat: SeatInfo;
  isSelected: boolean;
  colors: any;
  onPress: () => void;
}) {
  const bgColor = !seat.available
    ? colors.border
    : isSelected
      ? colors.primary
      : seat.isExtra
        ? "#E8F5E9"
        : colors.surface;

  const textColor = !seat.available
    ? colors.muted
    : isSelected
      ? "#FFF"
      : colors.foreground;

  return (
    <Pressable
      onPress={seat.available ? onPress : undefined}
      style={({ pressed }) => [
        seatBtnStyles.seat,
        {
          backgroundColor: bgColor,
          borderColor: isSelected ? colors.primary : seat.isExtra ? "#4CAF50" : colors.border,
          opacity: !seat.available ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[seatBtnStyles.seatText, { color: textColor }]}>
        {seat.col}
      </Text>
    </Pressable>
  );
}

const seatBtnStyles = StyleSheet.create({
  seat: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  },
  seatText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────
export default function OnlineCheckinScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { bookings, updateBookingCheckin } = useApp();
  const { t, isRTL } = useI18n();

  const booking = useMemo(
    () => bookings.find((b) => b.id === id),
    [bookings, id]
  );

  const [step, setStep] = useState<CheckinStep>("info");
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatPreference, setSeatPreference] = useState<SeatPreference>("window");

  const seatMap = useMemo(() => generateSeatMap(30), []);

  const filteredSeats = useMemo(() => {
    if (seatPreference === "window") return seatMap.filter((s) => s.type === "window" && s.available);
    if (seatPreference === "aisle") return seatMap.filter((s) => s.type === "aisle" && s.available);
    return seatMap.filter((s) => s.type === "middle" && s.available);
  }, [seatMap, seatPreference]);

  const selectedSeatInfo = useMemo(
    () => seatMap.find((s) => s.id === selectedSeat),
    [seatMap, selectedSeat]
  );

  const STEPS: { key: CheckinStep; label: string }[] = [
    { key: "info", label: isRTL ? "المعلومات" : "Info" },
    { key: "seat", label: isRTL ? "المقعد" : "Seat" },
    { key: "confirm", label: isRTL ? "تأكيد" : "Confirm" },
    { key: "done", label: isRTL ? "تم" : "Done" },
  ];

  const handleCheckin = useCallback(async () => {
    if (!booking || !selectedSeat || !selectedSeatInfo) return;

    const boardingGroup = getBoardingGroup(selectedSeatInfo.row);
    await updateBookingCheckin(booking.id, selectedSeat, selectedSeatInfo.type, boardingGroup);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Send local notification
    try {
      const { scheduleLocalNotification } = await import("@/lib/push-notifications");
      await scheduleLocalNotification(
        isRTL ? "تم تسجيل الوصول" : "Check-in Complete",
        isRTL
          ? `تم تسجيل وصولك بنجاح. مقعدك: ${selectedSeat} | مجموعة الصعود: ${boardingGroup}`
          : `You're checked in! Seat: ${selectedSeat} | Boarding Group: ${boardingGroup}`,
        { bookingId: booking.id }
      );
    } catch {}

    setStep("done");
  }, [booking, selectedSeat, selectedSeatInfo, updateBookingCheckin, isRTL]);

  // Already checked in?
  if (booking?.checkedIn) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isRTL ? "تسجيل الوصول" : "Online Check-in"}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Animated.View entering={FadeIn.duration(400)} style={[styles.doneContainer]}>
            <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>
              {isRTL ? "تم تسجيل الوصول بالفعل" : "Already Checked In"}
            </Text>
            <Text style={[styles.doneSubtitle, { color: colors.muted }]}>
              {isRTL
                ? `مقعدك: ${booking.seatNumber} | مجموعة الصعود: ${booking.boardingGroup}`
                : `Seat: ${booking.seatNumber} | Boarding Group: ${booking.boardingGroup}`}
            </Text>

            {/* Boarding Pass Card */}
            <View style={[styles.boardingPass, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.bpHeader, { backgroundColor: colors.primary }]}>
                <Text style={styles.bpHeaderText}>BOARDING PASS</Text>
              </View>
              <View style={styles.bpBody}>
                <View style={styles.bpRow}>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>PASSENGER</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {(booking.passengerName || "---").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>FLIGHT</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {booking.flight?.flightNumber || "---"}
                    </Text>
                  </View>
                </View>
                <View style={styles.bpRow}>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>FROM</Text>
                    <Text style={[styles.bpValueLarge, { color: colors.foreground }]}>
                      {booking.flight?.originCode || "---"}
                    </Text>
                    <Text style={[styles.bpSmall, { color: colors.muted }]}>
                      {booking.flight?.origin || ""}
                    </Text>
                  </View>
                  <IconSymbol name="airplane" size={20} color={colors.primary} />
                  <View style={[styles.bpCol, { alignItems: "flex-end" }]}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>TO</Text>
                    <Text style={[styles.bpValueLarge, { color: colors.foreground }]}>
                      {booking.flight?.destinationCode || "---"}
                    </Text>
                    <Text style={[styles.bpSmall, { color: colors.muted }]}>
                      {booking.flight?.destination || ""}
                    </Text>
                  </View>
                </View>
                <View style={[styles.bpDivider, { borderColor: colors.border }]} />
                <View style={styles.bpRow}>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>SEAT</Text>
                    <Text style={[styles.bpSeat, { color: colors.primary }]}>
                      {booking.seatNumber}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>BOARDING</Text>
                    <Text style={[styles.bpSeat, { color: colors.primary }]}>
                      {booking.boardingGroup}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>CLASS</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {booking.flight?.class || "Economy"}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>DEPARTURE</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {booking.flight?.departureTime || "---"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.bpFooter, { backgroundColor: colors.primary + "10" }]}>
                <Text style={[styles.bpRef, { color: colors.primary }]}>
                  REF: {booking.reference}
                </Text>
                {booking.pnr && (
                  <Text style={[styles.bpRef, { color: colors.primary }]}>
                    PNR: {booking.pnr}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.doneBtnText}>
                {isRTL ? "العودة" : "Go Back"}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (!booking || booking.type !== "flight") {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isRTL ? "تسجيل الوصول" : "Online Check-in"}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.warning} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            {isRTL ? "الحجز غير متاح لتسجيل الوصول" : "Booking not available for check-in"}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable
          onPress={() => {
            if (step === "info") router.back();
            else if (step === "seat") setStep("info");
            else if (step === "confirm") setStep("seat");
          }}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>
          {isRTL ? "تسجيل الوصول الإلكتروني" : "Online Check-in"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} current={step} colors={colors} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {/* Step 1: Passenger Info */}
        {step === "info" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "معلومات المسافر" : "Passenger Information"}
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <InfoRow
                  label={isRTL ? "الاسم" : "Name"}
                  value={(booking.passengerName || "---").toUpperCase()}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "البريد الإلكتروني" : "Email"}
                  value={booking.passengerEmail || "---"}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "رقم الحجز" : "Booking Ref"}
                  value={booking.reference}
                  colors={colors}
                />
                {booking.pnr && (
                  <InfoRow label="PNR" value={booking.pnr} colors={colors} />
                )}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="airplane" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "تفاصيل الرحلة" : "Flight Details"}
                </Text>
              </View>

              <View style={styles.routeBox}>
                <View style={styles.routeCity}>
                  <Text style={[styles.routeCode, { color: colors.foreground }]}>
                    {booking.flight?.originCode}
                  </Text>
                  <Text style={[styles.routeName, { color: colors.muted }]}>
                    {booking.flight?.origin}
                  </Text>
                </View>
                <View style={styles.routeArrow}>
                  <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />
                  <IconSymbol name="airplane" size={18} color={colors.primary} />
                  <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />
                </View>
                <View style={[styles.routeCity, { alignItems: "flex-end" }]}>
                  <Text style={[styles.routeCode, { color: colors.foreground }]}>
                    {booking.flight?.destinationCode}
                  </Text>
                  <Text style={[styles.routeName, { color: colors.muted }]}>
                    {booking.flight?.destination}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGrid}>
                <InfoRow
                  label={isRTL ? "الخط الجوي" : "Airline"}
                  value={booking.flight?.airline || "---"}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "رقم الرحلة" : "Flight"}
                  value={booking.flight?.flightNumber || "---"}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "المغادرة" : "Departure"}
                  value={booking.flight?.departureTime || "---"}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "الوصول" : "Arrival"}
                  value={booking.flight?.arrivalTime || "---"}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "الدرجة" : "Class"}
                  value={booking.flight?.class || "Economy"}
                  colors={colors}
                />
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("seat");
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {isRTL ? "اختيار المقعد" : "Select Seat"}
              </Text>
              <IconSymbol name="arrow.right" size={18} color="#FFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* Step 2: Seat Selection */}
        {step === "seat" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            {/* Seat Preference */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground, marginBottom: 12 }]}>
                {isRTL ? "تفضيل المقعد" : "Seat Preference"}
              </Text>
              <View style={styles.prefRow}>
                {(["window", "aisle", "middle"] as SeatPreference[]).map((pref) => {
                  const isActive = seatPreference === pref;
                  const labels: Record<SeatPreference, { ar: string; en: string; icon: string }> = {
                    window: { ar: "نافذة", en: "Window", icon: "eye.fill" },
                    aisle: { ar: "ممر", en: "Aisle", icon: "door.left.hand.open" },
                    middle: { ar: "وسط", en: "Middle", icon: "chair.fill" },
                  };
                  return (
                    <Pressable
                      key={pref}
                      onPress={() => {
                        setSeatPreference(pref);
                        setSelectedSeat(null);
                        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={({ pressed }) => [
                        styles.prefBtn,
                        {
                          backgroundColor: isActive ? colors.primary : colors.background,
                          borderColor: isActive ? colors.primary : colors.border,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <IconSymbol
                        name={labels[pref].icon as any}
                        size={20}
                        color={isActive ? "#FFF" : colors.muted}
                      />
                      <Text
                        style={[
                          styles.prefText,
                          { color: isActive ? "#FFF" : colors.foreground },
                        ]}
                      >
                        {isRTL ? labels[pref].ar : labels[pref].en}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Seat Map Legend */}
            <View style={[styles.legendRow, { marginHorizontal: 16, marginBottom: 8 }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.surface, borderColor: colors.border }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>
                  {isRTL ? "متاح" : "Available"}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>
                  {isRTL ? "مختار" : "Selected"}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.border, opacity: 0.4 }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>
                  {isRTL ? "محجوز" : "Taken"}
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>
                  {isRTL ? "مساحة إضافية" : "Extra Leg"}
                </Text>
              </View>
            </View>

            {/* Seat Map */}
            <View style={[styles.seatMapContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Column headers */}
              <View style={styles.seatRow}>
                <View style={styles.rowLabel} />
                {COLS.slice(0, 3).map((c) => (
                  <View key={c} style={seatBtnStyles.seat}>
                    <Text style={[seatBtnStyles.seatText, { color: colors.muted }]}>{c}</Text>
                  </View>
                ))}
                <View style={styles.aisleGap} />
                {COLS.slice(3).map((c) => (
                  <View key={c} style={seatBtnStyles.seat}>
                    <Text style={[seatBtnStyles.seatText, { color: colors.muted }]}>{c}</Text>
                  </View>
                ))}
              </View>

              {/* Seat rows */}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((row) => {
                const rowSeats = seatMap.filter((s) => s.row === row);
                const isExitRow = EXIT_ROWS.includes(row);
                return (
                  <View key={row}>
                    {isExitRow && (
                      <View style={[styles.exitLabel, { backgroundColor: colors.warning + "20" }]}>
                        <Text style={[styles.exitText, { color: colors.warning }]}>
                          {isRTL ? "مخرج طوارئ" : "EXIT"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.seatRow}>
                      <View style={styles.rowLabel}>
                        <Text style={[styles.rowLabelText, { color: colors.muted }]}>{row}</Text>
                      </View>
                      {rowSeats.slice(0, 3).map((seat) => (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          isSelected={selectedSeat === seat.id}
                          colors={colors}
                          onPress={() => {
                            setSelectedSeat(seat.id);
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        />
                      ))}
                      <View style={styles.aisleGap} />
                      {rowSeats.slice(3).map((seat) => (
                        <SeatButton
                          key={seat.id}
                          seat={seat}
                          isSelected={selectedSeat === seat.id}
                          colors={colors}
                          onPress={() => {
                            setSelectedSeat(seat.id);
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        />
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Selected seat info */}
            {selectedSeat && selectedSeatInfo && (
              <Animated.View entering={FadeInUp.duration(200)}>
                <View style={[styles.selectedInfo, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
                  <IconSymbol name="chair.fill" size={20} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.selectedSeatText, { color: colors.primary }]}>
                      {isRTL ? `المقعد ${selectedSeat}` : `Seat ${selectedSeat}`}
                    </Text>
                    <Text style={[styles.selectedSeatType, { color: colors.muted }]}>
                      {selectedSeatInfo.type === "window"
                        ? isRTL ? "نافذة" : "Window"
                        : selectedSeatInfo.type === "aisle"
                          ? isRTL ? "ممر" : "Aisle"
                          : isRTL ? "وسط" : "Middle"}
                      {selectedSeatInfo.isExtra
                        ? isRTL ? " • مساحة إضافية للأرجل" : " • Extra Legroom"
                        : ""}
                    </Text>
                  </View>
                  <Text style={[styles.boardingGroupBadge, { backgroundColor: colors.primary, color: "#FFF" }]}>
                    {isRTL ? "مجموعة " : "Group "}
                    {getBoardingGroup(selectedSeatInfo.row)}
                  </Text>
                </View>
              </Animated.View>
            )}

            <Pressable
              onPress={() => {
                if (!selectedSeat) {
                  Alert.alert(
                    isRTL ? "تنبيه" : "Notice",
                    isRTL ? "يرجى اختيار مقعد أولاً" : "Please select a seat first"
                  );
                  return;
                }
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("confirm");
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                {
                  backgroundColor: selectedSeat ? colors.primary : colors.muted,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {isRTL ? "متابعة" : "Continue"}
              </Text>
              <IconSymbol name="arrow.right" size={18} color="#FFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* Step 3: Confirmation */}
        {step === "confirm" && selectedSeatInfo && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="checkmark.seal.fill" size={20} color={colors.success} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "مراجعة تسجيل الوصول" : "Check-in Review"}
                </Text>
              </View>

              <View style={styles.infoGrid}>
                <InfoRow
                  label={isRTL ? "المسافر" : "Passenger"}
                  value={(booking.passengerName || "---").toUpperCase()}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "الرحلة" : "Flight"}
                  value={`${booking.flight?.flightNumber} • ${booking.flight?.airline}`}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "المسار" : "Route"}
                  value={`${booking.flight?.originCode} → ${booking.flight?.destinationCode}`}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "المغادرة" : "Departure"}
                  value={booking.flight?.departureTime || "---"}
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "المقعد" : "Seat"}
                  value={selectedSeat || "---"}
                  colors={colors}
                  highlight
                />
                <InfoRow
                  label={isRTL ? "نوع المقعد" : "Seat Type"}
                  value={
                    selectedSeatInfo.type === "window"
                      ? isRTL ? "نافذة" : "Window"
                      : selectedSeatInfo.type === "aisle"
                        ? isRTL ? "ممر" : "Aisle"
                        : isRTL ? "وسط" : "Middle"
                  }
                  colors={colors}
                />
                <InfoRow
                  label={isRTL ? "مجموعة الصعود" : "Boarding Group"}
                  value={getBoardingGroup(selectedSeatInfo.row)}
                  colors={colors}
                  highlight
                />
              </View>
            </View>

            <View style={[styles.noticeBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
              <IconSymbol name="info.circle.fill" size={18} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.foreground }]}>
                {isRTL
                  ? "يرجى التأكد من صحة جميع البيانات. لا يمكن تعديل تسجيل الوصول بعد التأكيد."
                  : "Please verify all information. Check-in cannot be modified after confirmation."}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Alert.alert(
                  isRTL ? "تأكيد تسجيل الوصول" : "Confirm Check-in",
                  isRTL
                    ? `هل تريد تأكيد تسجيل الوصول بالمقعد ${selectedSeat}؟`
                    : `Confirm check-in with seat ${selectedSeat}?`,
                  [
                    { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
                    {
                      text: isRTL ? "تأكيد" : "Confirm",
                      onPress: handleCheckin,
                    },
                  ]
                );
              }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />
              <Text style={styles.primaryBtnText}>
                {isRTL ? "تأكيد تسجيل الوصول" : "Confirm Check-in"}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Step 4: Done / Boarding Pass */}
        {step === "done" && selectedSeatInfo && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.doneContainer}>
            <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>
              {isRTL ? "تم تسجيل الوصول بنجاح!" : "Check-in Complete!"}
            </Text>
            <Text style={[styles.doneSubtitle, { color: colors.muted }]}>
              {isRTL
                ? "بطاقة الصعود جاهزة. يرجى تقديمها عند البوابة."
                : "Your boarding pass is ready. Present it at the gate."}
            </Text>

            {/* Boarding Pass */}
            <View style={[styles.boardingPass, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.bpHeader, { backgroundColor: colors.primary }]}>
                <Text style={styles.bpHeaderText}>BOARDING PASS</Text>
              </View>
              <View style={styles.bpBody}>
                <View style={styles.bpRow}>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>PASSENGER</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {(booking.passengerName || "---").toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>FLIGHT</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {booking.flight?.flightNumber || "---"}
                    </Text>
                  </View>
                </View>
                <View style={styles.bpRow}>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>FROM</Text>
                    <Text style={[styles.bpValueLarge, { color: colors.foreground }]}>
                      {booking.flight?.originCode || "---"}
                    </Text>
                    <Text style={[styles.bpSmall, { color: colors.muted }]}>
                      {booking.flight?.origin || ""}
                    </Text>
                  </View>
                  <IconSymbol name="airplane" size={20} color={colors.primary} />
                  <View style={[styles.bpCol, { alignItems: "flex-end" }]}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>TO</Text>
                    <Text style={[styles.bpValueLarge, { color: colors.foreground }]}>
                      {booking.flight?.destinationCode || "---"}
                    </Text>
                    <Text style={[styles.bpSmall, { color: colors.muted }]}>
                      {booking.flight?.destination || ""}
                    </Text>
                  </View>
                </View>
                <View style={[styles.bpDivider, { borderColor: colors.border }]} />
                <View style={styles.bpRow}>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>SEAT</Text>
                    <Text style={[styles.bpSeat, { color: colors.primary }]}>
                      {selectedSeat}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>BOARDING</Text>
                    <Text style={[styles.bpSeat, { color: colors.primary }]}>
                      {getBoardingGroup(selectedSeatInfo.row)}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>CLASS</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {booking.flight?.class || "Economy"}
                    </Text>
                  </View>
                  <View style={styles.bpCol}>
                    <Text style={[styles.bpLabel, { color: colors.muted }]}>DEPARTURE</Text>
                    <Text style={[styles.bpValue, { color: colors.foreground }]}>
                      {booking.flight?.departureTime || "---"}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={[styles.bpFooter, { backgroundColor: colors.primary + "10" }]}>
                <Text style={[styles.bpRef, { color: colors.primary }]}>
                  REF: {booking.reference}
                </Text>
                {booking.pnr && (
                  <Text style={[styles.bpRef, { color: colors.primary }]}>
                    PNR: {booking.pnr}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.doneBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.doneBtnText}>
                {isRTL ? "العودة لتفاصيل الحجز" : "Back to Booking"}
              </Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────
function InfoRow({
  label,
  value,
  colors,
  highlight,
}: {
  label: string;
  value: string;
  colors: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          {
            color: highlight ? colors.primary : colors.foreground,
            fontWeight: highlight ? "800" : "600",
            fontSize: highlight ? 16 : 14,
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  card: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  infoGrid: {
    gap: 10,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingVertical: 8,
  },
  routeCity: {
    alignItems: "flex-start",
  },
  routeCode: {
    fontSize: 28,
    fontWeight: "800",
  },
  routeName: {
    fontSize: 12,
    marginTop: 2,
  },
  routeArrow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  routeLine: {
    flex: 1,
    height: 2,
    borderRadius: 1,
  },
  prefRow: {
    flexDirection: "row",
    gap: 8,
  },
  prefBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  prefText: {
    fontSize: 12,
    fontWeight: "600",
  },
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "transparent",
  },
  legendText: {
    fontSize: 11,
  },
  seatMapContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: "center",
  },
  seatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 1,
  },
  rowLabel: {
    width: 24,
    alignItems: "center",
  },
  rowLabelText: {
    fontSize: 10,
    fontWeight: "600",
  },
  aisleGap: {
    width: 20,
  },
  exitLabel: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginVertical: 4,
    alignSelf: "center",
  },
  exitText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  selectedSeatText: {
    fontSize: 16,
    fontWeight: "700",
  },
  selectedSeatType: {
    fontSize: 12,
    marginTop: 2,
  },
  boardingGroupBadge: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    margin: 16,
    marginBottom: 0,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  doneContainer: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  doneCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  doneBtn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    marginTop: 16,
    width: "100%",
    alignItems: "center",
  },
  doneBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Boarding Pass
  boardingPass: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 8,
  },
  bpHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  bpHeaderText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 3,
  },
  bpBody: {
    padding: 16,
    gap: 14,
  },
  bpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bpCol: {
    gap: 2,
  },
  bpLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  bpValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  bpValueLarge: {
    fontSize: 28,
    fontWeight: "800",
  },
  bpSmall: {
    fontSize: 11,
  },
  bpSeat: {
    fontSize: 24,
    fontWeight: "800",
  },
  bpDivider: {
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  bpFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  bpRef: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
