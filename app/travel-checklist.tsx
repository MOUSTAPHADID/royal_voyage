import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useI18n } from "@/lib/i18n";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";

// ─── Checklist Items ─────────────────────────────────────────────
interface ChecklistItem {
  key: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  category: "documents" | "packing" | "airport" | "health";
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  // Documents
  { key: "passport", icon: "doc.text.fill", titleEn: "Passport", titleAr: "\u062C\u0648\u0627\u0632 \u0627\u0644\u0633\u0641\u0631", descEn: "Valid for at least 6 months", descAr: "\u0635\u0627\u0644\u062D \u0644\u0645\u062F\u0629 6 \u0623\u0634\u0647\u0631 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644", category: "documents" },
  { key: "visa", icon: "doc.badge.plus", titleEn: "Visa / Entry Permit", titleAr: "\u0627\u0644\u062A\u0623\u0634\u064A\u0631\u0629 / \u0625\u0630\u0646 \u0627\u0644\u062F\u062E\u0648\u0644", descEn: "Check destination visa requirements", descAr: "\u062A\u062D\u0642\u0642 \u0645\u0646 \u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062A\u0623\u0634\u064A\u0631\u0629", category: "documents" },
  { key: "ticket", icon: "ticket.fill", titleEn: "Flight Ticket / Booking", titleAr: "\u062A\u0630\u0643\u0631\u0629 \u0627\u0644\u0637\u064A\u0631\u0627\u0646 / \u0627\u0644\u062D\u062C\u0632", descEn: "Print or save digital copy", descAr: "\u0627\u0637\u0628\u0639 \u0623\u0648 \u0627\u062D\u0641\u0638 \u0646\u0633\u062E\u0629 \u0631\u0642\u0645\u064A\u0629", category: "documents" },
  { key: "insurance", icon: "heart.text.square.fill", titleEn: "Travel Insurance", titleAr: "\u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0633\u0641\u0631", descEn: "Medical and trip coverage", descAr: "\u062A\u063A\u0637\u064A\u0629 \u0637\u0628\u064A\u0629 \u0648\u0631\u062D\u0644\u0629", category: "documents" },
  { key: "id_copy", icon: "person.text.rectangle.fill", titleEn: "ID Card Copy", titleAr: "\u0646\u0633\u062E\u0629 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0647\u0648\u064A\u0629", descEn: "Keep a backup copy", descAr: "\u0627\u062D\u062A\u0641\u0638 \u0628\u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629", category: "documents" },
  // Packing
  { key: "luggage", icon: "bag.fill", titleEn: "Luggage Packed", titleAr: "\u062A\u062C\u0647\u064A\u0632 \u0627\u0644\u0623\u0645\u062A\u0639\u0629", descEn: "Check weight limits", descAr: "\u062A\u062D\u0642\u0642 \u0645\u0646 \u062D\u062F\u0648\u062F \u0627\u0644\u0648\u0632\u0646", category: "packing" },
  { key: "carry_on", icon: "bag.fill", titleEn: "Carry-on Bag", titleAr: "\u062D\u0642\u064A\u0628\u0629 \u0627\u0644\u064A\u062F", descEn: "Essentials and valuables", descAr: "\u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0627\u062A \u0648\u0627\u0644\u0623\u0634\u064A\u0627\u0621 \u0627\u0644\u062B\u0645\u064A\u0646\u0629", category: "packing" },
  { key: "charger", icon: "bolt.fill", titleEn: "Phone Charger & Power Bank", titleAr: "\u0634\u0627\u062D\u0646 \u0627\u0644\u0647\u0627\u062A\u0641 \u0648\u0628\u0627\u0648\u0631 \u0628\u0627\u0646\u0643", descEn: "Don't forget adapters", descAr: "\u0644\u0627 \u062A\u0646\u0633 \u0627\u0644\u0645\u062D\u0648\u0644\u0627\u062A", category: "packing" },
  { key: "toiletries", icon: "drop.fill", titleEn: "Toiletries (100ml max)", titleAr: "\u0623\u062F\u0648\u0627\u062A \u0627\u0644\u0646\u0638\u0627\u0641\u0629 (100\u0645\u0644 \u0643\u062D\u062F \u0623\u0642\u0635\u0649)", descEn: "Liquids in clear bag", descAr: "\u0627\u0644\u0633\u0648\u0627\u0626\u0644 \u0641\u064A \u0643\u064A\u0633 \u0634\u0641\u0627\u0641", category: "packing" },
  { key: "clothes", icon: "tshirt.fill", titleEn: "Appropriate Clothing", titleAr: "\u0645\u0644\u0627\u0628\u0633 \u0645\u0646\u0627\u0633\u0628\u0629", descEn: "Check destination weather", descAr: "\u062A\u062D\u0642\u0642 \u0645\u0646 \u0637\u0642\u0633 \u0627\u0644\u0648\u062C\u0647\u0629", category: "packing" },
  // Airport
  { key: "checkin", icon: "person.badge.clock", titleEn: "Online Check-in Done", titleAr: "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0627\u064B", descEn: "Complete before airport", descAr: "\u0623\u0643\u0645\u0644\u0647 \u0642\u0628\u0644 \u0627\u0644\u0645\u0637\u0627\u0631", category: "airport" },
  { key: "boarding_pass", icon: "qrcode", titleEn: "Boarding Pass Saved", titleAr: "\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0635\u0639\u0648\u062F \u0645\u062D\u0641\u0648\u0638\u0629", descEn: "Screenshot or print", descAr: "\u0644\u0642\u0637\u0629 \u0634\u0627\u0634\u0629 \u0623\u0648 \u0637\u0628\u0627\u0639\u0629", category: "airport" },
  { key: "arrive_early", icon: "clock.fill", titleEn: "Arrive 3 Hours Early", titleAr: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0642\u0628\u0644 3 \u0633\u0627\u0639\u0627\u062A", descEn: "International flights", descAr: "\u0627\u0644\u0631\u062D\u0644\u0627\u062A \u0627\u0644\u062F\u0648\u0644\u064A\u0629", category: "airport" },
  { key: "currency", icon: "banknote.fill", titleEn: "Local Currency / Cards", titleAr: "\u0639\u0645\u0644\u0629 \u0645\u062D\u0644\u064A\u0629 / \u0628\u0637\u0627\u0642\u0627\u062A", descEn: "Exchange or ATM plan", descAr: "\u062E\u0637\u0629 \u0627\u0644\u0635\u0631\u0641 \u0623\u0648 \u0627\u0644\u0635\u0631\u0627\u0641", category: "airport" },
  // Health
  { key: "medications", icon: "pills.fill", titleEn: "Medications", titleAr: "\u0627\u0644\u0623\u062F\u0648\u064A\u0629", descEn: "Prescription meds in carry-on", descAr: "\u0627\u0644\u0623\u062F\u0648\u064A\u0629 \u0627\u0644\u0645\u0648\u0635\u0648\u0641\u0629 \u0641\u064A \u062D\u0642\u064A\u0628\u0629 \u0627\u0644\u064A\u062F", category: "health" },
  { key: "vaccination", icon: "cross.case.fill", titleEn: "Vaccination Records", titleAr: "\u0633\u062C\u0644\u0627\u062A \u0627\u0644\u062A\u0637\u0639\u064A\u0645", descEn: "Required vaccines for destination", descAr: "\u0627\u0644\u0644\u0642\u0627\u062D\u0627\u062A \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u0644\u0644\u0648\u062C\u0647\u0629", category: "health" },
];

const CATEGORIES = [
  { key: "documents", titleEn: "Documents", titleAr: "\u0627\u0644\u0648\u062B\u0627\u0626\u0642", icon: "doc.text.fill" },
  { key: "packing", titleEn: "Packing", titleAr: "\u0627\u0644\u062A\u0639\u0628\u0626\u0629", icon: "bag.fill" },
  { key: "airport", titleEn: "Airport", titleAr: "\u0627\u0644\u0645\u0637\u0627\u0631", icon: "airplane" },
  { key: "health", titleEn: "Health", titleAr: "\u0627\u0644\u0635\u062D\u0629", icon: "heart.fill" },
];

// ─── Main Screen ─────────────────────────────────────────────────
export default function TravelChecklistScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { bookings, updateBookingChecklist } = useApp();
  const { isRTL } = useI18n();

  const booking = useMemo(() => bookings.find((b) => b.id === id), [bookings, id]);

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    CHECKLIST_ITEMS.forEach((item) => { initial[item.key] = false; });
    return initial;
  });

  // Load saved checklist
  useEffect(() => {
    if (booking?.travelChecklist) {
      setChecklist((prev) => ({ ...prev, ...booking.travelChecklist }));
    }
  }, [booking?.travelChecklist]);

  // Auto-check if already checked in
  useEffect(() => {
    if (booking?.checkedIn) {
      setChecklist((prev) => ({
        ...prev,
        checkin: true,
        boarding_pass: true,
      }));
    }
  }, [booking?.checkedIn]);

  const toggleItem = useCallback(async (key: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);
    if (booking) {
      await updateBookingChecklist(booking.id, updated);
    }
  }, [checklist, booking, updateBookingChecklist]);

  const totalItems = CHECKLIST_ITEMS.length;
  const checkedItems = Object.values(checklist).filter(Boolean).length;
  const progress = totalItems > 0 ? checkedItems / totalItems : 0;

  // ─── Not Available ────────────────────────────────────────────
  if (!booking) {
    return (
      <ScreenContainer edges={["top", "left", "right", "bottom"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{isRTL ? "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u062D\u0642\u0642" : "Travel Checklist"}</Text>
          <View style={{ width: 30 }} />
        </View>
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={48} color={colors.warning} />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            {isRTL ? "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062D\u062C\u0632" : "Booking not found"}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}>
          <IconSymbol name={isRTL ? "chevron.right" : "arrow.left"} size={22} color="#FFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{isRTL ? "\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062A\u062D\u0642\u0642 \u0642\u0628\u0644 \u0627\u0644\u0633\u0641\u0631" : "Pre-Travel Checklist"}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
        {/* Progress Card */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={[styles.progressTitle, { color: colors.foreground }]}>
                  {isRTL ? "\u062A\u0642\u062F\u0645 \u0627\u0644\u062A\u062D\u0636\u064A\u0631" : "Preparation Progress"}
                </Text>
                <Text style={[styles.progressSubtitle, { color: colors.muted }]}>
                  {booking.flight?.origin} {"\u2192"} {booking.flight?.destination || booking.hotel?.name || ""}
                </Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: progress >= 1 ? colors.success : colors.primary }]}>
                <Text style={styles.progressBadgeText}>{checkedItems}/{totalItems}</Text>
              </View>
            </View>
            {/* Progress Bar */}
            <View style={[styles.progressBarBg, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: progress >= 1 ? colors.success : progress >= 0.5 ? colors.warning : colors.primary,
                    width: `${Math.round(progress * 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPercent, { color: progress >= 1 ? colors.success : colors.muted }]}>
              {progress >= 1
                ? (isRTL ? "\u0645\u0633\u062A\u0639\u062F \u0644\u0644\u0633\u0641\u0631! \u2705" : "Ready to travel! \u2705")
                : `${Math.round(progress * 100)}% ${isRTL ? "\u0645\u0643\u062A\u0645\u0644" : "complete"}`}
            </Text>
          </View>
        </Animated.View>

        {/* Flight Info */}
        {booking.type === "flight" && booking.flight && (
          <View style={[styles.flightInfoCard, { backgroundColor: colors.primary + "10", borderColor: colors.primary }]}>
            <IconSymbol name="airplane" size={16} color={colors.primary} />
            <Text style={[styles.flightInfoText, { color: colors.foreground }]}>
              {booking.flight.flightNumber} {"\u2022"} {booking.flight.departureTime} {"\u2022"} {booking.flight.originCode} {"\u2192"} {booking.flight.destinationCode}
            </Text>
          </View>
        )}

        {/* Checklist Categories */}
        {CATEGORIES.map((category, catIdx) => {
          const items = CHECKLIST_ITEMS.filter((i) => i.category === category.key);
          const catChecked = items.filter((i) => checklist[i.key]).length;
          return (
            <Animated.View key={category.key} entering={FadeInDown.duration(300).delay(catIdx * 80)}>
              <View style={[styles.categoryHeader, { marginTop: catIdx === 0 ? 8 : 16 }]}>
                <View style={styles.categoryLeft}>
                  <IconSymbol name={category.icon as any} size={16} color={colors.primary} />
                  <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                    {isRTL ? category.titleAr : category.titleEn}
                  </Text>
                </View>
                <Text style={[styles.categoryCount, { color: catChecked === items.length ? colors.success : colors.muted }]}>
                  {catChecked}/{items.length}
                </Text>
              </View>

              {items.map((item, idx) => (
                <Pressable
                  key={item.key}
                  onPress={() => toggleItem(item.key)}
                  style={({ pressed }) => [
                    styles.checkItem,
                    {
                      backgroundColor: checklist[item.key] ? colors.success + "08" : colors.surface,
                      borderColor: checklist[item.key] ? colors.success : colors.border,
                      opacity: pressed ? 0.7 : 1,
                      borderBottomLeftRadius: idx === items.length - 1 ? 14 : 0,
                      borderBottomRightRadius: idx === items.length - 1 ? 14 : 0,
                      borderTopLeftRadius: idx === 0 ? 14 : 0,
                      borderTopRightRadius: idx === 0 ? 14 : 0,
                    },
                  ]}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: checklist[item.key] ? colors.success : "transparent",
                      borderColor: checklist[item.key] ? colors.success : colors.border,
                    },
                  ]}>
                    {checklist[item.key] && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[
                      styles.checkTitle,
                      {
                        color: checklist[item.key] ? colors.success : colors.foreground,
                        textDecorationLine: checklist[item.key] ? "line-through" : "none",
                      },
                    ]}>
                      {isRTL ? item.titleAr : item.titleEn}
                    </Text>
                    <Text style={[styles.checkDesc, { color: colors.muted }]}>
                      {isRTL ? item.descAr : item.descEn}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          );
        })}

        {/* Quick Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.primary + "08", borderColor: colors.primary }]}>
          <View style={styles.tipsHeader}>
            <IconSymbol name="lightbulb.fill" size={18} color={colors.primary} />
            <Text style={[styles.tipsTitle, { color: colors.foreground }]}>
              {isRTL ? "\u0646\u0635\u0627\u0626\u062D \u0633\u0631\u064A\u0639\u0629" : "Quick Tips"}
            </Text>
          </View>
          <Text style={[styles.tipText, { color: colors.muted }]}>
            {isRTL
              ? "\u2022 \u0627\u0644\u062A\u0642\u0637 \u0635\u0648\u0631\u0629 \u0644\u062C\u0648\u0627\u0632 \u0633\u0641\u0631\u0643 \u0648\u0627\u062D\u0641\u0638\u0647\u0627 \u0639\u0644\u0649 \u0647\u0627\u062A\u0641\u0643"
              : "\u2022 Take a photo of your passport and save it on your phone"}
          </Text>
          <Text style={[styles.tipText, { color: colors.muted }]}>
            {isRTL
              ? "\u2022 \u0627\u0634\u062D\u0646 \u0647\u0627\u062A\u0641\u0643 \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0642\u0628\u0644 \u0627\u0644\u0645\u063A\u0627\u062F\u0631\u0629"
              : "\u2022 Fully charge your phone before departure"}
          </Text>
          <Text style={[styles.tipText, { color: colors.muted }]}>
            {isRTL
              ? "\u2022 \u0627\u062D\u062A\u0641\u0638 \u0628\u0646\u0633\u062E\u0629 \u0645\u0646 \u062D\u062C\u0632\u0643 \u0648\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0635\u0639\u0648\u062F \u0641\u064A \u0628\u0631\u064A\u062F\u0643"
              : "\u2022 Keep a copy of your booking and boarding pass in your email"}
          </Text>
          <Text style={[styles.tipText, { color: colors.muted }]}>
            {isRTL
              ? "\u2022 \u062A\u0623\u0643\u062F \u0645\u0646 \u0648\u0632\u0646 \u0627\u0644\u0623\u0645\u062A\u0639\u0629 \u0642\u0628\u0644 \u0627\u0644\u0630\u0647\u0627\u0628 \u0644\u0644\u0645\u0637\u0627\u0631"
              : "\u2022 Weigh your luggage before heading to the airport"}
          </Text>
        </View>

        {/* Back Button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.backButtonText}>{isRTL ? "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u062A\u0641\u0627\u0635\u064A\u0644 \u0627\u0644\u062D\u062C\u0632" : "Back to Booking"}</Text>
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
  progressCard: { margin: 16, marginBottom: 0, borderRadius: 16, borderWidth: 1, padding: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  progressTitle: { fontSize: 17, fontWeight: "700" },
  progressSubtitle: { fontSize: 13, marginTop: 2 },
  progressBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  progressBadgeText: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  progressBarBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: 8, borderRadius: 4 },
  progressPercent: { fontSize: 13, fontWeight: "600", marginTop: 8, textAlign: "center" },
  flightInfoCard: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  flightInfoText: { fontSize: 13, fontWeight: "600", flex: 1 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 16, marginBottom: 4, paddingVertical: 8 },
  categoryLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoryTitle: { fontSize: 15, fontWeight: "700" },
  categoryCount: { fontSize: 13, fontWeight: "600" },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1, borderTopWidth: 0.5, borderBottomWidth: 0.5 },
  checkbox: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, justifyContent: "center", alignItems: "center" },
  checkTitle: { fontSize: 14, fontWeight: "600" },
  checkDesc: { fontSize: 11, marginTop: 2 },
  tipsCard: { margin: 16, borderRadius: 16, borderWidth: 1, padding: 16 },
  tipsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  tipsTitle: { fontSize: 15, fontWeight: "700" },
  tipText: { fontSize: 13, lineHeight: 20, marginBottom: 4 },
  backButton: { marginHorizontal: 16, marginTop: 16, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  backButtonText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
