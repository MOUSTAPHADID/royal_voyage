import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DatePickerField } from "@/components/ui/date-picker-field";

type ChangeType = "date" | "passengers" | "class" | "other";

export default function ChangeBookingScreen() {
  const router = useRouter();
  const colors = useColors();
  const { bookings } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();

  const booking = bookings.find((b) => b.id === id);

  const [changeType, setChangeType] = useState<ChangeType>("date");
  const [newDate, setNewDate] = useState("");
  const [newPassengers, setNewPassengers] = useState("");
  const [newClass, setNewClass] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!booking) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: colors.muted }}>الحجز غير موجود</Text>
        </View>
      </ScreenContainer>
    );
  }

  type IconName = "calendar" | "person.2.fill" | "star.fill" | "pencil";
  const changeOptions: { key: ChangeType; label: string; iconName: IconName }[] = [
    { key: "date", label: "تغيير التاريخ", iconName: "calendar" },
    { key: "passengers", label: "تغيير المقاعد", iconName: "person.2.fill" },
    { key: "class", label: "ترقية الدرجة", iconName: "star.fill" },
    { key: "other", label: "طلب آخر", iconName: "pencil" },
  ];

  const handleSubmit = () => {
    if (changeType === "date" && !newDate.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال التاريخ الجديد المطلوب");
      return;
    }
    if (changeType === "passengers" && !newPassengers.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال عدد المقاعد الجديد");
      return;
    }
    if (changeType === "class" && !newClass.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال الدرجة المطلوبة");
      return;
    }
    if (changeType === "other" && !notes.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال تفاصيل طلبك");
      return;
    }

    // Simulate submission
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>تغيير الحجز</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={[styles.successContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
            <IconSymbol name="checkmark.circle.fill" size={48} color="#22C55E" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            تم إرسال طلب التعديل
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.muted }]}>
            سيتواصل معك فريق Royal Voyage خلال 24 ساعة لتأكيد التعديل
          </Text>
          <View style={[styles.refCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.refLabel, { color: colors.muted }]}>رقم الحجز</Text>
            <Text style={[styles.refValue, { color: colors.primary }]}>{booking.reference}</Text>
            <Text style={[styles.refLabel, { color: colors.muted, marginTop: 8 }]}>نوع التعديل</Text>
            <Text style={[styles.refValue, { color: colors.foreground }]}>
              {changeOptions.find((o) => o.key === changeType)?.label}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>العودة للحجز</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>تغيير الحجز</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.background }}>
        {/* Booking Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <IconSymbol name={booking.type === "flight" ? "airplane" : "building.2.fill"} size={22} color={colors.primary} style={{ marginBottom: 8 }} />
          <View>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>
              {booking.type === "flight"
                ? `${booking.flight?.originCode} → ${booking.flight?.destinationCode}`
                : booking.hotel?.name ?? "فندق"}
            </Text>
            <Text style={[styles.summaryRef, { color: colors.muted }]}>{booking.reference}</Text>
          </View>
        </View>

        {/* Change Type Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>نوع التعديل</Text>
          <View style={styles.optionsGrid}>
            {changeOptions.map((opt) => (
              <Pressable
                key={opt.key}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: changeType === opt.key ? colors.primary + "15" : colors.surface,
                    borderColor: changeType === opt.key ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setChangeType(opt.key)}
              >
                <IconSymbol name={opt.iconName} size={24} color={changeType === opt.key ? colors.primary : colors.muted} />
                <Text
                  style={[
                    styles.optionLabel,
                    { color: changeType === opt.key ? colors.primary : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Dynamic Fields */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>تفاصيل الطلب</Text>

          {changeType === "date" && (
            <View style={styles.fieldGroup}>
              <DatePickerField
                label="التاريخ الجديد المطلوب"
                value={newDate}
                onChange={(d) => setNewDate(d)}
                placeholder="اختر تاريخاً"
                minimumDate={new Date()}
                backgroundColor={colors.background}
              />
            </View>
          )}

          {changeType === "passengers" && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>عدد المقاعد الجديد</Text>
              <TextInput
                style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                placeholder="مثال: 3"
                placeholderTextColor={colors.muted}
                value={newPassengers}
                onChangeText={setNewPassengers}
                keyboardType="number-pad"
                returnKeyType="done"
              />
            </View>
          )}

          {changeType === "class" && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>الدرجة المطلوبة</Text>
              <View style={styles.classRow}>
                {["اقتصادية", "ممتازة", "أعمال", "أولى"].map((cls) => (
                  <Pressable
                    key={cls}
                    style={[
                      styles.classBtn,
                      {
                        backgroundColor: newClass === cls ? colors.primary : colors.surface,
                        borderColor: newClass === cls ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setNewClass(cls)}
                  >
                    <Text style={[styles.classBtnText, { color: newClass === cls ? "#fff" : colors.foreground }]}>
                      {cls}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Notes - always shown */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              {changeType === "other" ? "تفاصيل الطلب *" : "ملاحظات إضافية (اختياري)"}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              placeholder="أضف أي تفاصيل أو ملاحظات هنا..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Notice */}
        <View style={[styles.noticeCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning + "40" }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={16} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.foreground }]}>
            قد تترتب على التعديل رسوم إضافية حسب سياسة شركة الطيران أو الفندق. سيتم إبلاغك بالتكاليف قبل التأكيد.
          </Text>
        </View>

        {/* Submit Button */}
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={handleSubmit}
        >
          <IconSymbol name="paperplane.fill" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>إرسال طلب التعديل</Text>
        </Pressable>

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
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryRef: {
    fontSize: 13,
    marginTop: 2,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionCard: {
    width: "47%",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  classRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  classBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  classBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  noticeCard: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  refCard: {
    width: "100%",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
  },
  refLabel: {
    fontSize: 13,
  },
  refValue: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
