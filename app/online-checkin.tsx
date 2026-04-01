import { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
  Linking,
  Share,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useCurrency } from "@/lib/currency-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_PRICING, getPricingSettings } from "@/lib/pricing-settings";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────
type SeatPreference = "window" | "middle" | "aisle";
type MealChoice = "regular" | "vegetarian" | "halal" | "none";
type CheckinStep = "info" | "seat" | "meal" | "confirm" | "done";

interface SeatInfo {
  id: string;
  row: number;
  col: string;
  type: SeatPreference;
  available: boolean;
  isExit: boolean;
  isExtra: boolean;
}

// ─── Constants ────────────────────────────────────────────────────
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

function getBoardingGroup(row: number): string {
  if (row <= 5) return "A";
  if (row <= 15) return "B";
  if (row <= 25) return "C";
  return "D";
}

// ─── Boarding Pass Text Generator ─────────────────────────────────
function generateBoardingPassText(booking: any, seatNumber: string, boardingGroup: string, isUpgrade: boolean): string {
  const lines = [
    "═══════════════════════════════",
    "       ✈ BOARDING PASS ✈       ",
    "═══════════════════════════════",
    "",
    `PASSENGER: ${(booking.passengerName || "---").toUpperCase()}`,
    `FLIGHT:    ${booking.flight?.flightNumber || "---"}`,
    `AIRLINE:   ${booking.flight?.airline || "---"}`,
    "",
    `FROM: ${booking.flight?.originCode || "---"} (${booking.flight?.origin || ""})`,
    `TO:   ${booking.flight?.destinationCode || "---"} (${booking.flight?.destination || ""})`,
    "",
    `DATE:      ${booking.date || "---"}`,
    `DEPARTURE: ${booking.flight?.departureTime || "---"}`,
    `ARRIVAL:   ${booking.flight?.arrivalTime || "---"}`,
    "",
    "───────────────────────────────",
    `SEAT:           ${seatNumber}`,
    `BOARDING GROUP: ${boardingGroup}`,
    `CLASS:          ${booking.flight?.class || "Economy"}`,
    isUpgrade ? `UPGRADE:        Extra Legroom ✓` : "",
    "───────────────────────────────",
    "",
    `REF: ${booking.reference}`,
    booking.pnr ? `PNR: ${booking.pnr}` : "",
    "",
    "═══════════════════════════════",
    "    Royal Service Travel Agency",
    "    +222 33 70 00 00",
    "    suporte@royalvoyage.online",
    "    Tavragh Zeina, Nouakchott",
    "═══════════════════════════════",
  ].filter(Boolean);
  return lines.join("\n");
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
                  { backgroundColor: isDone ? colors.success : colors.border },
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
  container: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 16, paddingVertical: 16 },
  item: { flexDirection: "row", alignItems: "center" },
  circle: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  circleText: { fontSize: 12, fontWeight: "700" },
  label: { fontSize: 11, marginLeft: 4 },
  line: { width: 20, height: 2, marginHorizontal: 6, borderRadius: 1 },
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
  seat: { width: 36, height: 36, borderRadius: 6, borderWidth: 1.5, justifyContent: "center", alignItems: "center", margin: 2 },
  seatText: { fontSize: 12, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────
export default function OnlineCheckinScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { bookings, updateBookingCheckin, updateBookingFlightReminder, updateBookingMeal } = useApp();
  const { fmt } = useCurrency();
  const { t, isRTL } = useI18n();

  const booking = useMemo(() => bookings.find((b) => b.id === id), [bookings, id]);

  const [step, setStep] = useState<CheckinStep>("info");
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [seatPreference, setSeatPreference] = useState<SeatPreference>("window");
  const [wantUpgrade, setWantUpgrade] = useState(false);
  const [upgradeFee, setUpgradeFee] = useState(DEFAULT_PRICING.extraLegroomFeeMRU);
  const [mealChoice, setMealChoice] = useState<MealChoice>("regular");

  // Load actual pricing
  useEffect(() => {
    const ps = getPricingSettings();
    if (ps) setUpgradeFee(ps.extraLegroomFeeMRU);
  }, []);

  const seatMap = useMemo(() => generateSeatMap(30), []);

  const selectedSeatInfo = useMemo(
    () => seatMap.find((s) => s.id === selectedSeat),
    [seatMap, selectedSeat]
  );

  const STEPS: { key: CheckinStep; label: string }[] = [
    { key: "info", label: isRTL ? "\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062A" : "Info" },
    { key: "seat", label: isRTL ? "\u0627\u0644\u0645\u0642\u0639\u062F" : "Seat" },
    { key: "meal", label: isRTL ? "\u0627\u0644\u0648\u062C\u0628\u0629" : "Meal" },
    { key: "confirm", label: isRTL ? "\u062A\u0623\u0643\u064A\u062F" : "Confirm" },
    { key: "done", label: isRTL ? "\u062A\u0645" : "Done" },
  ];

  // ─── Share Boarding Pass via WhatsApp ─────────────────────────
  const shareBoardingPassWhatsApp = useCallback(async (seatNum: string, group: string, isUpgrade: boolean) => {
    if (!booking) return;
    const text = generateBoardingPassText(booking, seatNum, group, isUpgrade);
    const encoded = encodeURIComponent(text);
    const whatsappUrl = `whatsapp://send?text=${encoded}`;
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // Fallback to native share
        await Share.share({ message: text });
      }
    } catch {
      await Share.share({ message: text });
    }
  }, [booking]);

  // ─── Native Share ─────────────────────────────────────────────
  const shareBoardingPassNative = useCallback(async (seatNum: string, group: string, isUpgrade: boolean) => {
    if (!booking) return;
    const text = generateBoardingPassText(booking, seatNum, group, isUpgrade);
    await Share.share({ message: text, title: "Boarding Pass" });
  }, [booking]);

  // ─── Schedule Flight Reminder ─────────────────────────────────
  const scheduleReminder = useCallback(async (seatNum: string, group: string) => {
    if (!booking || !booking.flight || !booking.date) return;
    try {
      const { scheduleFlightReminder } = await import("@/lib/push-notifications");
      await scheduleFlightReminder(
        booking.reference,
        booking.flight.flightNumber,
        seatNum,
        group,
        booking.date,
        booking.flight.departureTime
      );
      await updateBookingFlightReminder(booking.id);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert(
        isRTL ? "\u062A\u0645 \u0627\u0644\u062C\u062F\u0648\u0644\u0629" : "Reminder Set",
        isRTL
          ? "\u0633\u064A\u062A\u0645 \u062A\u0630\u0643\u064A\u0631\u0643 \u0642\u0628\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0633\u0627\u0639\u062A\u064A\u0646"
          : "You will be reminded 2 hours before your flight"
      );
    } catch {
      Alert.alert(
        isRTL ? "\u062E\u0637\u0623" : "Error",
        isRTL ? "\u062A\u0639\u0630\u0631 \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u064A\u0631" : "Could not schedule reminder"
      );
    }
  }, [booking, updateBookingFlightReminder, isRTL]);

  // ─── Handle Check-in ──────────────────────────────────────────
  const handleCheckin = useCallback(async () => {
    if (!booking || !selectedSeat || !selectedSeatInfo) return;

    const boardingGroup = getBoardingGroup(selectedSeatInfo.row);
    const isUpgrade = wantUpgrade && selectedSeatInfo.isExtra;
    const fee = isUpgrade ? upgradeFee : 0;

    await updateBookingCheckin(booking.id, selectedSeat, selectedSeatInfo.type, boardingGroup, isUpgrade, fee);
    await updateBookingMeal(booking.id, mealChoice);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Send local notification
    try {
      const { scheduleLocalNotification } = await import("@/lib/push-notifications");
      await scheduleLocalNotification(
        isRTL ? "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Check-in Complete",
        isRTL
          ? `\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0648\u0635\u0648\u0644\u0643 \u0628\u0646\u062C\u0627\u062D. \u0645\u0642\u0639\u062F\u0643: ${selectedSeat} | \u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0635\u0639\u0648\u062F: ${boardingGroup}`
          : `You're checked in! Seat: ${selectedSeat} | Boarding Group: ${boardingGroup}`,
        { bookingId: booking.id }
      );
    } catch {}

    // Auto-schedule flight reminder
    try {
      if (booking.date && booking.flight?.departureTime) {
        const { scheduleFlightReminder } = await import("@/lib/push-notifications");
        await scheduleFlightReminder(
          booking.reference,
          booking.flight.flightNumber,
          selectedSeat,
          boardingGroup,
          booking.date,
          booking.flight.departureTime
        );
        await updateBookingFlightReminder(booking.id);
      }
    } catch {}

    setStep("done");
  }, [booking, selectedSeat, selectedSeatInfo, updateBookingCheckin, updateBookingFlightReminder, updateBookingMeal, isRTL, wantUpgrade, upgradeFee, mealChoice]);

  // ─── Already Checked In View ──────────────────────────────────
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
            {isRTL ? "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Online Check-in"}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.doneContainer}>
            <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>
              {isRTL ? "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0627\u0644\u0641\u0639\u0644" : "Already Checked In"}
            </Text>
            <Text style={[styles.doneSubtitle, { color: colors.muted }]}>
              {isRTL
                ? `\u0645\u0642\u0639\u062F\u0643: ${booking.seatNumber} | \u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0635\u0639\u0648\u062F: ${booking.boardingGroup}`
                : `Seat: ${booking.seatNumber} | Boarding Group: ${booking.boardingGroup}`}
            </Text>

            {booking.seatUpgrade && (
              <View style={[styles.upgradeBadgeRow, { backgroundColor: "#FFF3E0", borderColor: "#FF9800" }]}>
                <IconSymbol name="sparkles" size={16} color="#FF9800" />
                <Text style={[styles.upgradeBadgeText, { color: "#E65100" }]}>
                  {isRTL ? "\u062A\u0631\u0642\u064A\u0629 \u0645\u0633\u0627\u062D\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 \u0644\u0644\u0623\u0631\u062C\u0644" : "Extra Legroom Upgrade"}
                </Text>
              </View>
            )}

            {/* Boarding Pass Card */}
            <BoardingPassCard booking={booking} seatNumber={booking.seatNumber || ""} boardingGroup={booking.boardingGroup || ""} colors={colors} isUpgrade={booking.seatUpgrade || false} />

            {/* Share Buttons */}
            <View style={styles.shareRow}>
              <Pressable
                onPress={() => shareBoardingPassWhatsApp(booking.seatNumber || "", booking.boardingGroup || "", booking.seatUpgrade || false)}
                style={({ pressed }) => [styles.shareBtn, { backgroundColor: "#25D366", opacity: pressed ? 0.8 : 1 }]}
              >
                <IconSymbol name="paperplane.fill" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={() => shareBoardingPassNative(booking.seatNumber || "", booking.boardingGroup || "", booking.seatUpgrade || false)}
                style={({ pressed }) => [styles.shareBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              >
                <IconSymbol name="square.and.arrow.up" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>{isRTL ? "\u0645\u0634\u0627\u0631\u0643\u0629" : "Share"}</Text>
              </Pressable>
            </View>

            {/* Reminder Button */}
            {!booking.flightReminderScheduled ? (
              <Pressable
                onPress={() => scheduleReminder(booking.seatNumber || "", booking.boardingGroup || "")}
                style={({ pressed }) => [styles.reminderBtn, { backgroundColor: colors.warning + "15", borderColor: colors.warning, opacity: pressed ? 0.8 : 1 }]}
              >
                <IconSymbol name="bell.badge.fill" size={18} color={colors.warning} />
                <Text style={[styles.reminderBtnText, { color: colors.warning }]}>
                  {isRTL ? "\u062A\u0630\u0643\u064A\u0631 \u0642\u0628\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0633\u0627\u0639\u062A\u064A\u0646" : "Remind Me 2h Before Flight"}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.reminderBtn, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
                <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                <Text style={[styles.reminderBtnText, { color: colors.success }]}>
                  {isRTL ? "\u062A\u0645 \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u064A\u0631" : "Reminder Scheduled"}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.doneBtnText}>
                {isRTL ? "\u0627\u0644\u0639\u0648\u062F\u0629" : "Go Back"}
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Not Available ────────────────────────────────────────────
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
            {isRTL ? "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Online Check-in"}
          </Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.warning} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            {isRTL ? "\u0627\u0644\u062D\u062C\u0632 \u063A\u064A\u0631 \u0645\u062A\u0627\u062D \u0644\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Booking not available for check-in"}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Main Check-in Flow ───────────────────────────────────────
  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
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
          {isRTL ? "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Online Check-in"}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      <StepIndicator steps={STEPS} current={step} colors={colors} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {/* Step 1: Passenger Info */}
        {step === "info" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="person.fill" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062A \u0627\u0644\u0645\u0633\u0627\u0641\u0631" : "Passenger Information"}
                </Text>
              </View>
              <View style={styles.infoGrid}>
                <InfoRow label={isRTL ? "\u0627\u0644\u0627\u0633\u0645" : "Name"} value={(booking.passengerName || "---").toUpperCase()} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A" : "Email"} value={booking.passengerEmail || "---"} colors={colors} />
                <InfoRow label={isRTL ? "\u0631\u0642\u0645 \u0627\u0644\u062D\u062C\u0632" : "Booking Ref"} value={booking.reference} colors={colors} />
                {booking.pnr && <InfoRow label="PNR" value={booking.pnr} colors={colors} />}
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="airplane" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u0631\u062D\u0644\u0629" : "Flight Details"}
                </Text>
              </View>
              <View style={styles.routeBox}>
                <View style={styles.routeCity}>
                  <Text style={[styles.routeCode, { color: colors.foreground }]}>{booking.flight?.originCode}</Text>
                  <Text style={[styles.routeName, { color: colors.muted }]}>{booking.flight?.origin}</Text>
                </View>
                <View style={styles.routeArrow}>
                  <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />
                  <IconSymbol name="airplane" size={18} color={colors.primary} />
                  <View style={[styles.routeLine, { backgroundColor: colors.primary }]} />
                </View>
                <View style={[styles.routeCity, { alignItems: "flex-end" }]}>
                  <Text style={[styles.routeCode, { color: colors.foreground }]}>{booking.flight?.destinationCode}</Text>
                  <Text style={[styles.routeName, { color: colors.muted }]}>{booking.flight?.destination}</Text>
                </View>
              </View>
              <View style={styles.infoGrid}>
                <InfoRow label={isRTL ? "\u0627\u0644\u062E\u0637 \u0627\u0644\u062C\u0648\u064A" : "Airline"} value={booking.flight?.airline || "---"} colors={colors} />
                <InfoRow label={isRTL ? "\u0631\u0642\u0645 \u0627\u0644\u0631\u062D\u0644\u0629" : "Flight"} value={booking.flight?.flightNumber || "---"} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629" : "Departure"} value={booking.flight?.departureTime || "---"} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0648\u0635\u0648\u0644" : "Arrival"} value={booking.flight?.arrivalTime || "---"} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u062F\u0631\u062C\u0629" : "Class"} value={booking.flight?.class || "Economy"} colors={colors} />
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("seat");
              }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{isRTL ? "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0645\u0642\u0639\u062F" : "Select Seat"}</Text>
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
                {isRTL ? "\u062A\u0641\u0636\u064A\u0644 \u0627\u0644\u0645\u0642\u0639\u062F" : "Seat Preference"}
              </Text>
              <View style={styles.prefRow}>
                {(["window", "aisle", "middle"] as SeatPreference[]).map((pref) => {
                  const isActive = seatPreference === pref;
                  const labels: Record<SeatPreference, { ar: string; en: string; icon: string }> = {
                    window: { ar: "\u0646\u0627\u0641\u0630\u0629", en: "Window", icon: "eye.fill" },
                    aisle: { ar: "\u0645\u0645\u0631", en: "Aisle", icon: "door.left.hand.open" },
                    middle: { ar: "\u0648\u0633\u0637", en: "Middle", icon: "chair.fill" },
                  };
                  return (
                    <Pressable
                      key={pref}
                      onPress={() => { setSeatPreference(pref); setSelectedSeat(null); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={({ pressed }) => [styles.prefBtn, { backgroundColor: isActive ? colors.primary : colors.background, borderColor: isActive ? colors.primary : colors.border, opacity: pressed ? 0.7 : 1 }]}
                    >
                      <IconSymbol name={labels[pref].icon as any} size={20} color={isActive ? "#FFF" : colors.muted} />
                      <Text style={[styles.prefText, { color: isActive ? "#FFF" : colors.foreground }]}>
                        {isRTL ? labels[pref].ar : labels[pref].en}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Extra Legroom Upgrade Option */}
            <Pressable
              onPress={() => {
                setWantUpgrade(!wantUpgrade);
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              style={({ pressed }) => [
                styles.upgradeCard,
                {
                  backgroundColor: wantUpgrade ? "#FFF3E0" : colors.surface,
                  borderColor: wantUpgrade ? "#FF9800" : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={styles.upgradeLeft}>
                <View style={[styles.upgradeIcon, { backgroundColor: wantUpgrade ? "#FF9800" : colors.border }]}>
                  <IconSymbol name="sparkles" size={20} color={wantUpgrade ? "#FFF" : colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.upgradeTitle, { color: wantUpgrade ? "#E65100" : colors.foreground }]}>
                    {isRTL ? "\u062A\u0631\u0642\u064A\u0629 \u0645\u0633\u0627\u062D\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 \u0644\u0644\u0623\u0631\u062C\u0644" : "Extra Legroom Upgrade"}
                  </Text>
                  <Text style={[styles.upgradeDesc, { color: colors.muted }]}>
                    {isRTL
                      ? "\u0635\u0641\u0648\u0641 1\u060C 12\u060C 25 - \u0645\u0633\u0627\u062D\u0629 \u0623\u0643\u0628\u0631 \u0644\u0631\u0627\u062D\u0629 \u0623\u0641\u0636\u0644"
                      : "Rows 1, 12, 25 - More space for comfort"}
                  </Text>
                </View>
              </View>
              <View style={styles.upgradeRight}>
                <Text style={[styles.upgradePrice, { color: wantUpgrade ? "#E65100" : colors.primary }]}>
                  +{fmt(upgradeFee)}
                </Text>
                <View style={[styles.upgradeCheck, { backgroundColor: wantUpgrade ? "#FF9800" : "transparent", borderColor: wantUpgrade ? "#FF9800" : colors.border }]}>
                  {wantUpgrade && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                </View>
              </View>
            </Pressable>

            {/* Seat Map Legend */}
            <View style={[styles.legendRow, { marginHorizontal: 16, marginBottom: 8 }]}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.surface, borderColor: colors.border }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>{isRTL ? "\u0645\u062A\u0627\u062D" : "Available"}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>{isRTL ? "\u0645\u062E\u062A\u0627\u0631" : "Selected"}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: colors.border, opacity: 0.4 }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>{isRTL ? "\u0645\u062D\u062C\u0648\u0632" : "Taken"}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: "#E8F5E9", borderColor: "#4CAF50" }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>{isRTL ? "\u0645\u0633\u0627\u062D\u0629 \u0625\u0636\u0627\u0641\u064A\u0629" : "Extra Leg"}</Text>
              </View>
            </View>

            {/* Seat Map */}
            <View style={[styles.seatMapContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.seatRow}>
                <View style={styles.rowLabel} />
                {COLS.slice(0, 3).map((c) => (
                  <View key={c} style={seatBtnStyles.seat}><Text style={[seatBtnStyles.seatText, { color: colors.muted }]}>{c}</Text></View>
                ))}
                <View style={styles.aisleGap} />
                {COLS.slice(3).map((c) => (
                  <View key={c} style={seatBtnStyles.seat}><Text style={[seatBtnStyles.seatText, { color: colors.muted }]}>{c}</Text></View>
                ))}
              </View>
              {Array.from({ length: 30 }, (_, i) => i + 1).map((row) => {
                const rowSeats = seatMap.filter((s) => s.row === row);
                const isExitRow = EXIT_ROWS.includes(row);
                return (
                  <View key={row}>
                    {isExitRow && (
                      <View style={[styles.exitLabel, { backgroundColor: colors.warning + "20" }]}>
                        <Text style={[styles.exitText, { color: colors.warning }]}>{isRTL ? "\u0645\u062E\u0631\u062C \u0637\u0648\u0627\u0631\u0626" : "EXIT"}</Text>
                      </View>
                    )}
                    <View style={styles.seatRow}>
                      <View style={styles.rowLabel}>
                        <Text style={[styles.rowLabelText, { color: colors.muted }]}>{row}</Text>
                      </View>
                      {rowSeats.slice(0, 3).map((seat) => (
                        <SeatButton key={seat.id} seat={seat} isSelected={selectedSeat === seat.id} colors={colors}
                          onPress={() => { setSelectedSeat(seat.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} />
                      ))}
                      <View style={styles.aisleGap} />
                      {rowSeats.slice(3).map((seat) => (
                        <SeatButton key={seat.id} seat={seat} isSelected={selectedSeat === seat.id} colors={colors}
                          onPress={() => { setSelectedSeat(seat.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} />
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
                      {isRTL ? `\u0627\u0644\u0645\u0642\u0639\u062F ${selectedSeat}` : `Seat ${selectedSeat}`}
                    </Text>
                    <Text style={[styles.selectedSeatType, { color: colors.muted }]}>
                      {selectedSeatInfo.type === "window" ? (isRTL ? "\u0646\u0627\u0641\u0630\u0629" : "Window") : selectedSeatInfo.type === "aisle" ? (isRTL ? "\u0645\u0645\u0631" : "Aisle") : (isRTL ? "\u0648\u0633\u0637" : "Middle")}
                      {selectedSeatInfo.isExtra && wantUpgrade ? (isRTL ? ` \u2022 \u062A\u0631\u0642\u064A\u0629 (+${fmt(upgradeFee)})` : ` \u2022 Upgrade (+${fmt(upgradeFee)})`) : selectedSeatInfo.isExtra ? (isRTL ? " \u2022 \u0645\u0633\u0627\u062D\u0629 \u0625\u0636\u0627\u0641\u064A\u0629" : " \u2022 Extra Legroom") : ""}
                    </Text>
                  </View>
                  <Text style={[styles.boardingGroupBadge, { backgroundColor: colors.primary, color: "#FFF" }]}>
                    {isRTL ? "\u0645\u062C\u0645\u0648\u0639\u0629 " : "Group "}{getBoardingGroup(selectedSeatInfo.row)}
                  </Text>
                </View>
              </Animated.View>
            )}

            <Pressable
              onPress={() => {
                if (!selectedSeat) { Alert.alert(isRTL ? "\u062A\u0646\u0628\u064A\u0647" : "Notice", isRTL ? "\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0642\u0639\u062F \u0623\u0648\u0644\u0627\u064B" : "Please select a seat first"); return; }
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("meal");
              }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: selectedSeat ? colors.primary : colors.muted, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{isRTL ? "\u0645\u062A\u0627\u0628\u0639\u0629" : "Continue"}</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* Step 3: Meal Selection */}
        {step === "meal" && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="fork.knife" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "\u0627\u062E\u062A\u064A\u0627\u0631 \u0627\u0644\u0648\u062C\u0628\u0629" : "Meal Selection"}
                </Text>
              </View>
              <Text style={[styles.mealDesc, { color: colors.muted }]}>
                {isRTL
                  ? "\u0627\u062E\u062A\u0631 \u0648\u062C\u0628\u062A\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0644\u0644\u0631\u062D\u0644\u0629. \u064A\u0645\u0643\u0646\u0643 \u0627\u062E\u062A\u064A\u0627\u0631 \"\u0628\u062F\u0648\u0646 \u0648\u062C\u0628\u0629\" \u0625\u0630\u0627 \u0644\u0645 \u062A\u0631\u063A\u0628."
                  : "Choose your preferred meal for the flight. Select \"No Meal\" if you prefer not to have one."}
              </Text>
              {([
                { key: "regular" as MealChoice, icon: "fork.knife" as const, labelEn: "Regular Meal", labelAr: "\u0648\u062C\u0628\u0629 \u0639\u0627\u062F\u064A\u0629", descEn: "Standard in-flight meal", descAr: "\u0648\u062C\u0628\u0629 \u0627\u0644\u0637\u0627\u0626\u0631\u0629 \u0627\u0644\u0639\u0627\u062F\u064A\u0629" },
                { key: "vegetarian" as MealChoice, icon: "leaf.fill" as const, labelEn: "Vegetarian", labelAr: "\u0646\u0628\u0627\u062A\u064A\u0629", descEn: "Plant-based meal option", descAr: "\u0648\u062C\u0628\u0629 \u0646\u0628\u0627\u062A\u064A\u0629" },
                { key: "halal" as MealChoice, icon: "checkmark.shield.fill" as const, labelEn: "Halal", labelAr: "\u062D\u0644\u0627\u0644", descEn: "Halal-certified meal", descAr: "\u0648\u062C\u0628\u0629 \u062D\u0644\u0627\u0644 \u0645\u0639\u062A\u0645\u062F\u0629" },
                { key: "none" as MealChoice, icon: "xmark" as const, labelEn: "No Meal", labelAr: "\u0628\u062F\u0648\u0646 \u0648\u062C\u0628\u0629", descEn: "Skip meal service", descAr: "\u062A\u062E\u0637\u064A \u062E\u062F\u0645\u0629 \u0627\u0644\u0648\u062C\u0628\u0627\u062A" },
              ]).map((meal) => (
                <Pressable
                  key={meal.key}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMealChoice(meal.key);
                  }}
                  style={({ pressed }) => [styles.mealOption, {
                    backgroundColor: mealChoice === meal.key ? colors.primary + "12" : colors.background,
                    borderColor: mealChoice === meal.key ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <View style={[styles.mealRadio, { borderColor: mealChoice === meal.key ? colors.primary : colors.border, backgroundColor: mealChoice === meal.key ? colors.primary : "transparent" }]}>
                    {mealChoice === meal.key && <View style={styles.mealRadioInner} />}
                  </View>
                  <IconSymbol name={meal.icon} size={22} color={mealChoice === meal.key ? colors.primary : colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mealLabel, { color: mealChoice === meal.key ? colors.primary : colors.foreground }]}>
                      {isRTL ? meal.labelAr : meal.labelEn}
                    </Text>
                    <Text style={[styles.mealSubLabel, { color: colors.muted }]}>
                      {isRTL ? meal.descAr : meal.descEn}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep("confirm");
              }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.primaryBtnText}>{isRTL ? "\u0645\u062A\u0627\u0628\u0639\u0629" : "Continue"}</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFF" />
            </Pressable>
          </Animated.View>
        )}

        {/* Step 4: Confirmation */}
        {step === "confirm" && selectedSeatInfo && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <IconSymbol name="checkmark.seal.fill" size={20} color={colors.success} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {isRTL ? "\u0645\u0631\u0627\u062C\u0639\u0629 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Check-in Review"}
                </Text>
              </View>
              <View style={styles.infoGrid}>
                <InfoRow label={isRTL ? "\u0627\u0644\u0645\u0633\u0627\u0641\u0631" : "Passenger"} value={(booking.passengerName || "---").toUpperCase()} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0631\u062D\u0644\u0629" : "Flight"} value={`${booking.flight?.flightNumber} \u2022 ${booking.flight?.airline}`} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0645\u0633\u0627\u0631" : "Route"} value={`${booking.flight?.originCode} \u2192 ${booking.flight?.destinationCode}`} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629" : "Departure"} value={booking.flight?.departureTime || "---"} colors={colors} />
                <InfoRow label={isRTL ? "\u0627\u0644\u0645\u0642\u0639\u062F" : "Seat"} value={selectedSeat || "---"} colors={colors} highlight />
                <InfoRow
                  label={isRTL ? "\u0646\u0648\u0639 \u0627\u0644\u0645\u0642\u0639\u062F" : "Seat Type"}
                  value={selectedSeatInfo.type === "window" ? (isRTL ? "\u0646\u0627\u0641\u0630\u0629" : "Window") : selectedSeatInfo.type === "aisle" ? (isRTL ? "\u0645\u0645\u0631" : "Aisle") : (isRTL ? "\u0648\u0633\u0637" : "Middle")}
                  colors={colors}
                />
                <InfoRow label={isRTL ? "\u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0635\u0639\u0648\u062F" : "Boarding Group"} value={getBoardingGroup(selectedSeatInfo.row)} colors={colors} highlight />
                {wantUpgrade && selectedSeatInfo.isExtra && (
                  <InfoRow label={isRTL ? "\u062A\u0631\u0642\u064A\u0629 \u0627\u0644\u0645\u0642\u0639\u062F" : "Seat Upgrade"} value={`Extra Legroom (+${fmt(upgradeFee)})`} colors={colors} highlight />
                )}
                <InfoRow
                  label={isRTL ? "\u0627\u0644\u0648\u062C\u0628\u0629" : "Meal"}
                  value={mealChoice === "regular" ? (isRTL ? "\u0648\u062C\u0628\u0629 \u0639\u0627\u062F\u064A\u0629" : "Regular") : mealChoice === "vegetarian" ? (isRTL ? "\u0646\u0628\u0627\u062A\u064A\u0629" : "Vegetarian") : mealChoice === "halal" ? (isRTL ? "\u062D\u0644\u0627\u0644" : "Halal") : (isRTL ? "\u0628\u062F\u0648\u0646 \u0648\u062C\u0628\u0629" : "No Meal")}
                  colors={colors}
                />
              </View>
            </View>

            {/* Reminder notice */}
            <View style={[styles.noticeBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
              <IconSymbol name="bell.badge.fill" size={18} color={colors.primary} />
              <Text style={[styles.noticeText, { color: colors.foreground }]}>
                {isRTL
                  ? "\u0633\u064A\u062A\u0645 \u062C\u062F\u0648\u0644\u0629 \u062A\u0630\u0643\u064A\u0631 \u062A\u0644\u0642\u0627\u0626\u064A \u0642\u0628\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0633\u0627\u0639\u062A\u064A\u0646."
                  : "A reminder will be automatically scheduled 2 hours before your flight."}
              </Text>
            </View>

            <View style={[styles.noticeBox, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
              <IconSymbol name="info.circle.fill" size={18} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.foreground }]}>
                {isRTL
                  ? "\u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0623\u0643\u062F \u0645\u0646 \u0635\u062D\u0629 \u062C\u0645\u064A\u0639 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A. \u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0639\u062F \u0627\u0644\u062A\u0623\u0643\u064A\u062F."
                  : "Please verify all information. Check-in cannot be modified after confirmation."}
              </Text>
            </View>

            <Pressable
              onPress={() => {
                Alert.alert(
                  isRTL ? "\u062A\u0623\u0643\u064A\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Confirm Check-in",
                  isRTL
                    ? `\u0647\u0644 \u062A\u0631\u064A\u062F \u062A\u0623\u0643\u064A\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0627\u0644\u0645\u0642\u0639\u062F ${selectedSeat}\u061F`
                    : `Confirm check-in with seat ${selectedSeat}?`,
                  [
                    { text: isRTL ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel", style: "cancel" },
                    { text: isRTL ? "\u062A\u0623\u0643\u064A\u062F" : "Confirm", onPress: handleCheckin },
                  ]
                );
              }}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.success, opacity: pressed ? 0.8 : 1 }]}
            >
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFF" />
              <Text style={styles.primaryBtnText}>{isRTL ? "\u062A\u0623\u0643\u064A\u062F \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644" : "Confirm Check-in"}</Text>
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
              {isRTL ? "\u062A\u0645 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0628\u0646\u062C\u0627\u062D!" : "Check-in Complete!"}
            </Text>
            <Text style={[styles.doneSubtitle, { color: colors.muted }]}>
              {isRTL
                ? "\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0635\u0639\u0648\u062F \u062C\u0627\u0647\u0632\u0629. \u0633\u064A\u062A\u0645 \u062A\u0630\u0643\u064A\u0631\u0643 \u0642\u0628\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0633\u0627\u0639\u062A\u064A\u0646."
                : "Your boarding pass is ready. You'll be reminded 2 hours before departure."}
            </Text>

            {wantUpgrade && selectedSeatInfo.isExtra && (
              <View style={[styles.upgradeBadgeRow, { backgroundColor: "#FFF3E0", borderColor: "#FF9800" }]}>
                <IconSymbol name="sparkles" size={16} color="#FF9800" />
                <Text style={[styles.upgradeBadgeText, { color: "#E65100" }]}>
                  {isRTL ? `\u062A\u0631\u0642\u064A\u0629 \u0645\u0633\u0627\u062D\u0629 \u0625\u0636\u0627\u0641\u064A\u0629 (+${fmt(upgradeFee)})` : `Extra Legroom Upgrade (+${fmt(upgradeFee)})`}
                </Text>
              </View>
            )}

            <BoardingPassCard
              booking={booking}
              seatNumber={selectedSeat || ""}
              boardingGroup={getBoardingGroup(selectedSeatInfo.row)}
              colors={colors}
              isUpgrade={wantUpgrade && selectedSeatInfo.isExtra}
            />

            {/* Share Buttons */}
            <View style={styles.shareRow}>
              <Pressable
                onPress={() => shareBoardingPassWhatsApp(selectedSeat || "", getBoardingGroup(selectedSeatInfo.row), wantUpgrade && selectedSeatInfo.isExtra)}
                style={({ pressed }) => [styles.shareBtn, { backgroundColor: "#25D366", opacity: pressed ? 0.8 : 1 }]}
              >
                <IconSymbol name="paperplane.fill" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={() => shareBoardingPassNative(selectedSeat || "", getBoardingGroup(selectedSeatInfo.row), wantUpgrade && selectedSeatInfo.isExtra)}
                style={({ pressed }) => [styles.shareBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
              >
                <IconSymbol name="square.and.arrow.up" size={18} color="#FFF" />
                <Text style={styles.shareBtnText}>{isRTL ? "\u0645\u0634\u0627\u0631\u0643\u0629" : "Share"}</Text>
              </Pressable>
            </View>

            {/* Flight Reminder Info */}
            <View style={[styles.reminderBtn, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
              <IconSymbol name="bell.badge.fill" size={18} color={colors.success} />
              <Text style={[styles.reminderBtnText, { color: colors.success }]}>
                {isRTL ? "\u062A\u0645 \u062C\u062F\u0648\u0644\u0629 \u0627\u0644\u062A\u0630\u0643\u064A\u0631 \u0642\u0628\u0644 \u0627\u0644\u0631\u062D\u0644\u0629 \u0628\u0633\u0627\u0639\u062A\u064A\u0646" : "Reminder set for 2h before flight"}
              </Text>
            </View>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.doneBtnText}>{isRTL ? "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062D\u062C\u0632" : "Back to Booking"}</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Boarding Pass Card ───────────────────────────────────────────
function BoardingPassCard({ booking, seatNumber, boardingGroup, colors, isUpgrade }: { booking: any; seatNumber: string; boardingGroup: string; colors: any; isUpgrade: boolean }) {
  return (
    <View style={[styles.boardingPass, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.bpHeader, { backgroundColor: colors.primary }]}>
        <Text style={styles.bpHeaderText}>BOARDING PASS</Text>
      </View>
      <View style={styles.bpBody}>
        <View style={styles.bpRow}>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>PASSENGER</Text>
            <Text style={[styles.bpValue, { color: colors.foreground }]}>{(booking.passengerName || "---").toUpperCase()}</Text>
          </View>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>FLIGHT</Text>
            <Text style={[styles.bpValue, { color: colors.foreground }]}>{booking.flight?.flightNumber || "---"}</Text>
          </View>
        </View>
        <View style={styles.bpRow}>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>FROM</Text>
            <Text style={[styles.bpValueLarge, { color: colors.foreground }]}>{booking.flight?.originCode || "---"}</Text>
            <Text style={[styles.bpSmall, { color: colors.muted }]}>{booking.flight?.origin || ""}</Text>
          </View>
          <IconSymbol name="airplane" size={20} color={colors.primary} />
          <View style={[styles.bpCol, { alignItems: "flex-end" }]}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>TO</Text>
            <Text style={[styles.bpValueLarge, { color: colors.foreground }]}>{booking.flight?.destinationCode || "---"}</Text>
            <Text style={[styles.bpSmall, { color: colors.muted }]}>{booking.flight?.destination || ""}</Text>
          </View>
        </View>
        <View style={[styles.bpDivider, { borderColor: colors.border }]} />
        <View style={styles.bpRow}>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>SEAT</Text>
            <Text style={[styles.bpSeat, { color: colors.primary }]}>{seatNumber}</Text>
          </View>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>BOARDING</Text>
            <Text style={[styles.bpSeat, { color: colors.primary }]}>{boardingGroup}</Text>
          </View>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>CLASS</Text>
            <Text style={[styles.bpValue, { color: colors.foreground }]}>{booking.flight?.class || "Economy"}</Text>
          </View>
          <View style={styles.bpCol}>
            <Text style={[styles.bpLabel, { color: colors.muted }]}>DEPARTURE</Text>
            <Text style={[styles.bpValue, { color: colors.foreground }]}>{booking.flight?.departureTime || "---"}</Text>
          </View>
        </View>
        {isUpgrade && (
          <View style={[styles.bpUpgradeBadge, { backgroundColor: "#FFF3E0" }]}>
            <Text style={{ color: "#E65100", fontSize: 11, fontWeight: "700" }}>EXTRA LEGROOM UPGRADE</Text>
          </View>
        )}
      </View>
      <View style={[styles.bpFooter, { backgroundColor: colors.primary + "10" }]}>
        <Text style={[styles.bpRef, { color: colors.primary }]}>REF: {booking.reference}</Text>
        {booking.pnr && <Text style={[styles.bpRef, { color: colors.primary }]}>PNR: {booking.pnr}</Text>}
      </View>
    </View>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────
function InfoRow({ label, value, colors, highlight }: { label: string; value: string; colors: any; highlight?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: highlight ? colors.primary : colors.foreground, fontWeight: highlight ? "800" : "600", fontSize: highlight ? 16 : 14 }]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  card: { margin: 16, marginBottom: 0, borderRadius: 16, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  infoGrid: { gap: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: "600" },
  routeBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingVertical: 8 },
  routeCity: { alignItems: "flex-start" },
  routeCode: { fontSize: 28, fontWeight: "800" },
  routeName: { fontSize: 12, marginTop: 2 },
  routeArrow: { flexDirection: "row", alignItems: "center", flex: 1, marginHorizontal: 12 },
  routeLine: { flex: 1, height: 2, borderRadius: 1 },
  prefRow: { flexDirection: "row", gap: 8 },
  prefBtn: { flex: 1, flexDirection: "column", alignItems: "center", gap: 6, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5 },
  prefText: { fontSize: 12, fontWeight: "600" },
  // Upgrade Card
  upgradeCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, borderWidth: 1.5, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  upgradeLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  upgradeIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  upgradeTitle: { fontSize: 14, fontWeight: "700" },
  upgradeDesc: { fontSize: 11, marginTop: 2 },
  upgradeRight: { alignItems: "flex-end", gap: 6 },
  upgradePrice: { fontSize: 14, fontWeight: "800" },
  upgradeCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  upgradeBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginBottom: 12, width: "100%" },
  upgradeBadgeText: { fontSize: 13, fontWeight: "700" },
  // Legend
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendBox: { width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: "transparent" },
  legendText: { fontSize: 11 },
  // Seat Map
  seatMapContainer: { marginHorizontal: 16, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: "center" },
  seatRow: { flexDirection: "row", alignItems: "center", marginVertical: 1 },
  rowLabel: { width: 24, alignItems: "center" },
  rowLabelText: { fontSize: 10, fontWeight: "600" },
  aisleGap: { width: 20 },
  exitLabel: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4, marginVertical: 4, alignSelf: "center" },
  exitText: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  selectedInfo: { flexDirection: "row", alignItems: "center", margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, borderWidth: 1 },
  selectedSeatText: { fontSize: 16, fontWeight: "700" },
  selectedSeatType: { fontSize: 12, marginTop: 2 },
  boardingGroupBadge: { fontSize: 12, fontWeight: "700", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: "hidden" },
  noticeBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, margin: 16, marginBottom: 0, padding: 14, borderRadius: 12, borderWidth: 1 },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 16, paddingVertical: 16, borderRadius: 14 },
  primaryBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  doneContainer: { alignItems: "center", paddingHorizontal: 16, paddingTop: 24 },
  doneCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  doneSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  doneBtn: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, marginTop: 16, width: "100%", alignItems: "center" },
  doneBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  // Share
  shareRow: { flexDirection: "row", gap: 12, width: "100%", marginTop: 12 },
  shareBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14 },
  shareBtnText: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  // Reminder
  reminderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 12, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  reminderBtnText: { fontSize: 14, fontWeight: "700" },
  // Boarding Pass
  boardingPass: { width: "100%", borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  bpHeader: { paddingVertical: 12, alignItems: "center" },
  bpHeaderText: { color: "#FFF", fontSize: 14, fontWeight: "800", letterSpacing: 3 },
  bpBody: { padding: 16, gap: 14 },
  bpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bpCol: { gap: 2 },
  bpLabel: { fontSize: 10, fontWeight: "600", letterSpacing: 0.5 },
  bpValue: { fontSize: 13, fontWeight: "700" },
  bpValueLarge: { fontSize: 28, fontWeight: "800" },
  bpSmall: { fontSize: 11 },
  bpSeat: { fontSize: 24, fontWeight: "800" },
  bpDivider: { borderTopWidth: 1, borderStyle: "dashed" },
  bpFooter: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, paddingHorizontal: 16 },
  bpRef: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  bpUpgradeBadge: { alignSelf: "center", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  mealDesc: { fontSize: 13, lineHeight: 20, marginBottom: 12 },
  mealOption: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 8 },
  mealRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  mealRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#FFF" },
  mealLabel: { fontSize: 15, fontWeight: "700" },
  mealSubLabel: { fontSize: 12, marginTop: 2 },
});
