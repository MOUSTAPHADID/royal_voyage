import { useState, useEffect, useMemo, useCallback } from "react";
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
import { useCurrency } from "@/lib/currency-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/lib/i18n";
import { DEFAULT_PRICING, getPricingSettings } from "@/lib/pricing-settings";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

// ─── Types ────────────────────────────────────────────────────────
type SeatPreference = "window" | "middle" | "aisle";

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
  A: "window", B: "middle", C: "aisle", D: "aisle", E: "middle", F: "window",
};
const EXIT_ROWS = [12, 25];
const EXTRA_ROWS = [1, 12, 25];

function generateSeatMap(rows: number = 30, currentSeat?: string): SeatInfo[] {
  const seats: SeatInfo[] = [];
  for (let row = 1; row <= rows; row++) {
    for (const col of COLS) {
      const hash = (row * 7 + col.charCodeAt(0) * 13) % 100;
      const seatId = `${row}${col}`;
      seats.push({
        id: seatId,
        row,
        col,
        type: COL_TYPES[col],
        available: hash > 25 || seatId === currentSeat,
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

// ─── Seat Button ─────────────────────────────────────────────────
function SeatButton({ seat, isSelected, isCurrent, colors, onPress }: {
  seat: SeatInfo; isSelected: boolean; isCurrent: boolean; colors: any; onPress: () => void;
}) {
  const bgColor = !seat.available
    ? colors.border
    : isCurrent
      ? colors.warning
      : isSelected
        ? colors.primary
        : seat.isExtra
          ? "#E8F5E9"
          : colors.surface;

  const textColor = !seat.available
    ? colors.muted
    : (isCurrent || isSelected)
      ? "#FFF"
      : colors.foreground;

  return (
    <Pressable
      onPress={seat.available && !isCurrent ? onPress : undefined}
      style={({ pressed }) => [
        seatBtnStyles.seat,
        {
          backgroundColor: bgColor,
          borderColor: isCurrent ? colors.warning : isSelected ? colors.primary : seat.isExtra ? "#4CAF50" : colors.border,
          opacity: !seat.available ? 0.4 : pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[seatBtnStyles.seatText, { color: textColor }]}>{seat.col}</Text>
    </Pressable>
  );
}

const seatBtnStyles = StyleSheet.create({
  seat: { width: 36, height: 36, borderRadius: 6, borderWidth: 1.5, justifyContent: "center", alignItems: "center", margin: 2 },
  seatText: { fontSize: 12, fontWeight: "700" },
});

// ─── Main Screen ─────────────────────────────────────────────────
export default function ChangeSeatScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { bookings, updateBookingSeatChange } = useApp();
  const { fmt } = useCurrency();
  const { t, isRTL } = useI18n();

  const booking = useMemo(() => bookings.find((b) => b.id === id), [bookings, id]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [changeFee, setChangeFee] = useState(DEFAULT_PRICING.seatChangeFeeMRU);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const ps = getPricingSettings();
    if (ps) setChangeFee(ps.seatChangeFeeMRU);
  }, []);

  const seatMap = useMemo(
    () => generateSeatMap(30, booking?.seatNumber),
    [booking?.seatNumber]
  );

  const selectedSeatInfo = useMemo(
    () => seatMap.find((s) => s.id === selectedSeat),
    [seatMap, selectedSeat]
  );

  const handleConfirm = useCallback(async () => {
    if (!booking || !selectedSeat || !selectedSeatInfo) return;
    const newGroup = getBoardingGroup(selectedSeatInfo.row);
    await updateBookingSeatChange(booking.id, selectedSeat, selectedSeatInfo.type, newGroup, changeFee);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmed(true);
  }, [booking, selectedSeat, selectedSeatInfo, updateBookingSeatChange, changeFee]);

  // ─── Not Available ────────────────────────────────────────────
  if (!booking || !booking.checkedIn || booking.type !== "flight") {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{isRTL ? "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F" : "Change Seat"}</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.warning} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            {isRTL ? "\u064A\u062C\u0628 \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0623\u0648\u0644\u0627\u064B" : "Check-in required first"}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // ─── Success State ────────────────────────────────────────────
  if (confirmed) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={{ width: 30 }} />
          <Text style={styles.headerTitle}>{isRTL ? "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F" : "Change Seat"}</Text>
          <View style={{ width: 30 }} />
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.doneContainer}>
            <View style={[styles.doneCircle, { backgroundColor: colors.success + "20" }]}>
              <IconSymbol name="checkmark.circle.fill" size={64} color={colors.success} />
            </View>
            <Text style={[styles.doneTitle, { color: colors.foreground }]}>
              {isRTL ? "\u062A\u0645 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F!" : "Seat Changed!"}
            </Text>
            <Text style={[styles.doneSubtitle, { color: colors.muted }]}>
              {isRTL
                ? `\u0645\u0642\u0639\u062F\u0643 \u0627\u0644\u062C\u062F\u064A\u062F: ${selectedSeat} | \u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0635\u0639\u0648\u062F: ${selectedSeatInfo ? getBoardingGroup(selectedSeatInfo.row) : ""}`
                : `New seat: ${selectedSeat} | Boarding Group: ${selectedSeatInfo ? getBoardingGroup(selectedSeatInfo.row) : ""}`}
            </Text>
            <View style={[styles.feeCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
              <IconSymbol name="creditcard.fill" size={18} color={colors.warning} />
              <Text style={[styles.feeText, { color: colors.foreground }]}>
                {isRTL ? `\u0631\u0633\u0648\u0645 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F: ${fmt(changeFee)}` : `Seat change fee: ${fmt(changeFee)}`}
              </Text>
            </View>
            {(booking.seatChangeCount || 0) > 0 && (
              <Text style={[styles.changeCount, { color: colors.muted }]}>
                {isRTL
                  ? `\u0639\u062F\u062F \u0645\u0631\u0627\u062A \u0627\u0644\u062A\u063A\u064A\u064A\u0631: ${(booking.seatChangeCount || 0) + 1}`
                  : `Total changes: ${(booking.seatChangeCount || 0) + 1}`}
              </Text>
            )}
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.doneBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            >
              <Text style={styles.doneBtnText}>{isRTL ? "\u0627\u0644\u0639\u0648\u062F\u0629" : "Go Back"}</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  // ─── Main Seat Change Flow ────────────────────────────────────
  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{isRTL ? "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F" : "Change Seat"}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {/* Current Seat Info */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={[styles.currentSeatCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
            <View style={styles.currentSeatRow}>
              <View style={[styles.currentSeatBadge, { backgroundColor: colors.warning }]}>
                <Text style={styles.currentSeatBadgeText}>{booking.seatNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currentSeatLabel, { color: colors.muted }]}>
                  {isRTL ? "\u0627\u0644\u0645\u0642\u0639\u062F \u0627\u0644\u062D\u0627\u0644\u064A" : "Current Seat"}
                </Text>
                <Text style={[styles.currentSeatValue, { color: colors.foreground }]}>
                  {booking.seatNumber} - {booking.seatPreference === "window" ? (isRTL ? "\u0646\u0627\u0641\u0630\u0629" : "Window") : booking.seatPreference === "aisle" ? (isRTL ? "\u0645\u0645\u0631" : "Aisle") : (isRTL ? "\u0648\u0633\u0637" : "Middle")}
                </Text>
              </View>
              <View>
                <Text style={[styles.currentGroupLabel, { color: colors.muted }]}>
                  {isRTL ? "\u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629" : "Group"}
                </Text>
                <Text style={[styles.currentGroupValue, { color: colors.warning }]}>{booking.boardingGroup}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Fee Notice */}
        <View style={[styles.feeNotice, { backgroundColor: colors.error + "10", borderColor: colors.error }]}>
          <IconSymbol name="creditcard.fill" size={16} color={colors.error} />
          <Text style={[styles.feeNoticeText, { color: colors.foreground }]}>
            {isRTL
              ? `\u0631\u0633\u0648\u0645 \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F: ${fmt(changeFee)} \u0644\u0643\u0644 \u062A\u063A\u064A\u064A\u0631`
              : `Seat change fee: ${fmt(changeFee)} per change`}
          </Text>
        </View>

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
            <View style={[styles.legendBox, { backgroundColor: colors.warning }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>{isRTL ? "\u062D\u0627\u0644\u064A" : "Current"}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: colors.border, opacity: 0.4 }]} />
            <Text style={[styles.legendText, { color: colors.muted }]}>{isRTL ? "\u0645\u062D\u062C\u0648\u0632" : "Taken"}</Text>
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
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeat === seat.id}
                      isCurrent={seat.id === booking.seatNumber}
                      colors={colors}
                      onPress={() => { setSelectedSeat(seat.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    />
                  ))}
                  <View style={styles.aisleGap} />
                  {rowSeats.slice(3).map((seat) => (
                    <SeatButton
                      key={seat.id}
                      seat={seat}
                      isSelected={selectedSeat === seat.id}
                      isCurrent={seat.id === booking.seatNumber}
                      colors={colors}
                      onPress={() => { setSelectedSeat(seat.id); if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        {/* Selected Seat Info */}
        {selectedSeat && selectedSeatInfo && (
          <Animated.View entering={FadeInUp.duration(200)}>
            <View style={[styles.selectedInfo, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
              <IconSymbol name="chair.fill" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.selectedSeatText, { color: colors.primary }]}>
                  {isRTL ? `\u0627\u0644\u0645\u0642\u0639\u062F \u0627\u0644\u062C\u062F\u064A\u062F: ${selectedSeat}` : `New Seat: ${selectedSeat}`}
                </Text>
                <Text style={[styles.selectedSeatType, { color: colors.muted }]}>
                  {selectedSeatInfo.type === "window" ? (isRTL ? "\u0646\u0627\u0641\u0630\u0629" : "Window") : selectedSeatInfo.type === "aisle" ? (isRTL ? "\u0645\u0645\u0631" : "Aisle") : (isRTL ? "\u0648\u0633\u0637" : "Middle")}
                  {" \u2022 "}{isRTL ? "\u0645\u062C\u0645\u0648\u0639\u0629 " : "Group "}{getBoardingGroup(selectedSeatInfo.row)}
                </Text>
              </View>
              <Text style={[styles.changeFeeLabel, { color: colors.error }]}>+{fmt(changeFee)}</Text>
            </View>
          </Animated.View>
        )}

        {/* Confirm Button */}
        <Pressable
          onPress={() => {
            if (!selectedSeat) {
              Alert.alert(isRTL ? "\u062A\u0646\u0628\u064A\u0647" : "Notice", isRTL ? "\u064A\u0631\u062C\u0649 \u0627\u062E\u062A\u064A\u0627\u0631 \u0645\u0642\u0639\u062F \u062C\u062F\u064A\u062F" : "Please select a new seat");
              return;
            }
            Alert.alert(
              isRTL ? "\u062A\u0623\u0643\u064A\u062F \u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F" : "Confirm Seat Change",
              isRTL
                ? `\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F \u0645\u0646 ${booking.seatNumber} \u0625\u0644\u0649 ${selectedSeat}\n\u0631\u0633\u0648\u0645 \u0627\u0644\u062A\u063A\u064A\u064A\u0631: ${fmt(changeFee)}`
                : `Change seat from ${booking.seatNumber} to ${selectedSeat}\nChange fee: ${fmt(changeFee)}`,
              [
                { text: isRTL ? "\u0625\u0644\u063A\u0627\u0621" : "Cancel", style: "cancel" },
                { text: isRTL ? "\u062A\u0623\u0643\u064A\u062F" : "Confirm", onPress: handleConfirm },
              ]
            );
          }}
          style={({ pressed }) => [
            styles.confirmBtn,
            { backgroundColor: selectedSeat ? colors.primary : colors.muted, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <IconSymbol name="repeat" size={18} color="#FFF" />
          <Text style={styles.confirmBtnText}>
            {isRTL ? `\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0642\u0639\u062F (${fmt(changeFee)})` : `Change Seat (${fmt(changeFee)})`}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 16 },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyText: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  currentSeatCard: { margin: 16, marginBottom: 0, borderRadius: 16, borderWidth: 1, padding: 16 },
  currentSeatRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  currentSeatBadge: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  currentSeatBadgeText: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  currentSeatLabel: { fontSize: 12 },
  currentSeatValue: { fontSize: 15, fontWeight: "700", marginTop: 2 },
  currentGroupLabel: { fontSize: 11, textAlign: "center" },
  currentGroupValue: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  feeNotice: { flexDirection: "row", alignItems: "center", gap: 8, margin: 16, marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  feeNoticeText: { flex: 1, fontSize: 13, fontWeight: "600" },
  legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendBox: { width: 16, height: 16, borderRadius: 3, borderWidth: 1, borderColor: "transparent" },
  legendText: { fontSize: 11 },
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
  changeFeeLabel: { fontSize: 16, fontWeight: "800" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, marginTop: 16, paddingVertical: 16, borderRadius: 14 },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  doneContainer: { alignItems: "center", paddingHorizontal: 16, paddingTop: 24 },
  doneCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  doneTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  doneSubtitle: { fontSize: 14, textAlign: "center", marginBottom: 16, lineHeight: 20 },
  feeCard: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, width: "100%", marginBottom: 8 },
  feeText: { fontSize: 14, fontWeight: "700" },
  changeCount: { fontSize: 12, marginTop: 4 },
  doneBtn: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, marginTop: 16, width: "100%", alignItems: "center" },
  doneBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
