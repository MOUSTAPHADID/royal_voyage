import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useTranslation } from "@/lib/i18n";
import { useApp } from "@/lib/app-context";
import DateTimePicker from "@react-native-community/datetimepicker";

type Participant = {
  id: string;
  fullName: string;
  nationality: string;
  dateOfBirth: string;
  passportNumber: string;
};

export default function ActivityBookingScreen() {
  const colors = useColors();
  const { t, isRTL } = useTranslation();
  const { addBooking } = useApp();
  const params = useLocalSearchParams<{
    activityCode: string;
    activityName: string;
    price: string;
    currency: string;
    date: string;
  }>();

  const activityCode = params.activityCode || "";
  const activityName = params.activityName || "";
  const pricePerPerson = parseFloat(params.price || "0");
  const currency = params.currency || "EUR";
  const activityDate = params.date || new Date().toISOString().split("T")[0];

  const [participantCount, setParticipantCount] = useState(1);
  const [participants, setParticipants] = useState<Participant[]>([
    { id: "1", fullName: "", nationality: "", dateOfBirth: "", passportNumber: "" },
  ]);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [showDatePicker, setShowDatePicker] = useState<{ index: number; visible: boolean }>({ index: -1, visible: false });

  const handleAddParticipant = () => {
    if (participantCount >= 10) {
      Alert.alert(
        isRTL ? "الحد الأقصى" : "Maximum Reached",
        isRTL ? "الحد الأقصى 10 مشاركين" : "Maximum 10 participants allowed"
      );
      return;
    }
    const newId = (participantCount + 1).toString();
    setParticipants([...participants, { id: newId, fullName: "", nationality: "", dateOfBirth: "", passportNumber: "" }]);
    setParticipantCount(participantCount + 1);
  };

  const handleRemoveParticipant = (id: string) => {
    if (participants.length === 1) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يجب أن يكون هناك مشارك واحد على الأقل" : "At least one participant is required"
      );
      return;
    }
    setParticipants(participants.filter((p) => p.id !== id));
    setParticipantCount(participantCount - 1);
  };

  const updateParticipant = (id: string, field: keyof Participant, value: string) => {
    setParticipants(participants.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleDateChange = (index: number, event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker({ index: -1, visible: false });
    }
    if (selectedDate && event.type !== "dismissed") {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      updateParticipant(participants[index].id, "dateOfBirth", formattedDate);
      if (Platform.OS === "ios") {
        setShowDatePicker({ index: -1, visible: false });
      }
    }
  };

  const validateForm = (): boolean => {
    if (!contactEmail.trim() || !contactPhone.trim()) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يرجى إدخال البريد الإلكتروني ورقم الهاتف" : "Please enter email and phone number"
      );
      return false;
    }

    for (const p of participants) {
      if (!p.fullName.trim() || !p.nationality.trim() || !p.dateOfBirth || !p.passportNumber.trim()) {
        Alert.alert(
          isRTL ? "خطأ" : "Error",
          isRTL ? "يرجى إكمال جميع بيانات المشاركين" : "Please complete all participant details"
        );
        return false;
      }
    }
    return true;
  };

  const handleConfirmBooking = () => {
    if (!validateForm()) return;

    const totalPrice = pricePerPerson * participants.length;
    const reference = `ACT${Date.now().toString().slice(-8)}`;

    // Create booking object (simplified - full implementation would call HBX API)
    addBooking({
      id: reference,
      type: "activity" as any, // Will extend Booking type later
      status: "pending",
      reference,
      date: activityDate,
      totalPrice,
      currency,
      passengerName: participants[0].fullName,
      passengerEmail: contactEmail,
      // Store activity details in a custom field (will extend Booking type)
      activity: {
        code: activityCode,
        name: activityName,
        participants: participants.length,
        participantDetails: participants,
      } as any,
    } as any);

    Alert.alert(
      isRTL ? "تم الحجز" : "Booking Confirmed",
      isRTL
        ? `تم حجز النشاط بنجاح!\n\nرقم المرجع: ${reference}\n\nسيتم إرسال تفاصيل الحجز إلى ${contactEmail}`
        : `Activity booked successfully!\n\nReference: ${reference}\n\nBooking details will be sent to ${contactEmail}`,
      [
        {
          text: isRTL ? "عرض الحجوزات" : "View Bookings",
          onPress: () => router.push("/bookings" as any),
        },
        {
          text: isRTL ? "العودة للرئيسية" : "Go Home",
          onPress: () => router.push("/" as any),
        },
      ]
    );
  };

  const totalPrice = pricePerPerson * participants.length;

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isRTL ? "حجز النشاط" : "Book Activity"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Activity Summary */}
        <View style={[styles.section, { backgroundColor: "#10B981" + "10", borderColor: "#10B981" + "30" }]}>
          <Text style={[styles.activityName, { color: colors.foreground }]}>{activityName}</Text>
          <View style={styles.summaryRow}>
            <IconSymbol name="calendar" size={16} color="#10B981" />
            <Text style={[styles.summaryText, { color: colors.muted }]}>{activityDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <IconSymbol name="person.fill" size={16} color="#10B981" />
            <Text style={[styles.summaryText, { color: colors.muted }]}>
              {participants.length} {isRTL ? "مشارك" : "participant(s)"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <IconSymbol name="dollarsign.circle.fill" size={16} color="#10B981" />
            <Text style={[styles.summaryText, { color: colors.muted }]}>
              {pricePerPerson} {currency} {isRTL ? "للشخص" : "per person"}
            </Text>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{isRTL ? "معلومات الاتصال" : "Contact Information"}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder={isRTL ? "البريد الإلكتروني" : "Email"}
            placeholderTextColor={colors.muted}
            value={contactEmail}
            onChangeText={setContactEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder={isRTL ? "رقم الهاتف" : "Phone Number"}
            placeholderTextColor={colors.muted}
            value={contactPhone}
            onChangeText={setContactPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Participants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {isRTL ? "بيانات المشاركين" : "Participant Details"}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.addBtn, { backgroundColor: "#10B981", opacity: pressed ? 0.8 : 1 }]}
              onPress={handleAddParticipant}
            >
              <IconSymbol name="plus" size={16} color="#fff" />
              <Text style={styles.addBtnText}>{isRTL ? "إضافة" : "Add"}</Text>
            </Pressable>
          </View>

          {participants.map((participant, index) => (
            <View key={participant.id} style={[styles.participantCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.participantHeader}>
                <Text style={[styles.participantNumber, { color: colors.foreground }]}>
                  {isRTL ? `المشارك ${index + 1}` : `Participant ${index + 1}`}
                </Text>
                {participants.length > 1 && (
                  <Pressable onPress={() => handleRemoveParticipant(participant.id)}>
                    <IconSymbol name="trash" size={18} color={colors.error} />
                  </Pressable>
                )}
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder={isRTL ? "الاسم الكامل" : "Full Name"}
                placeholderTextColor={colors.muted}
                value={participant.fullName}
                onChangeText={(val) => updateParticipant(participant.id, "fullName", val)}
              />

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder={isRTL ? "الجنسية" : "Nationality"}
                placeholderTextColor={colors.muted}
                value={participant.nationality}
                onChangeText={(val) => updateParticipant(participant.id, "nationality", val)}
              />

              <Pressable
                style={[styles.input, styles.dateInput, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => setShowDatePicker({ index, visible: true })}
              >
                <Text style={[styles.dateText, { color: participant.dateOfBirth ? colors.foreground : colors.muted }]}>
                  {participant.dateOfBirth || (isRTL ? "تاريخ الميلاد" : "Date of Birth")}
                </Text>
                <IconSymbol name="calendar" size={18} color={colors.muted} />
              </Pressable>

              {showDatePicker.visible && showDatePicker.index === index && (
                <DateTimePicker
                  value={participant.dateOfBirth ? new Date(participant.dateOfBirth) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => handleDateChange(index, event, date)}
                  maximumDate={new Date()}
                />
              )}

              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
                placeholder={isRTL ? "رقم الجواز" : "Passport Number"}
                placeholderTextColor={colors.muted}
                value={participant.passportNumber}
                onChangeText={(val) => updateParticipant(participant.id, "passportNumber", val)}
                autoCapitalize="characters"
              />
            </View>
          ))}
        </View>

        {/* Total Price */}
        <View style={[styles.totalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>{isRTL ? "المجموع الكلي" : "Total Price"}</Text>
          <Text style={[styles.totalPrice, { color: "#10B981" }]}>
            {totalPrice} {currency}
          </Text>
        </View>

        {/* Terms */}
        <View style={[styles.termsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.termsTitle, { color: colors.foreground }]}>{isRTL ? "شروط الإلغاء" : "Cancellation Policy"}</Text>
          <Text style={[styles.termsText, { color: colors.muted }]}>
            {isRTL
              ? "• إلغاء مجاني حتى 24 ساعة قبل موعد النشاط\n• استرداد كامل للمبلغ في حالة الإلغاء المبكر\n• لا يمكن استرداد المبلغ بعد 24 ساعة من الموعد"
              : "• Free cancellation up to 24 hours before activity\n• Full refund for early cancellations\n• No refund after 24 hours before activity"}
          </Text>
        </View>

        {/* Confirm Button */}
        <Pressable
          style={({ pressed }) => [styles.confirmBtn, { backgroundColor: "#10B981", opacity: pressed ? 0.85 : 1 }]}
          onPress={handleConfirmBooking}
        >
          <Text style={styles.confirmBtnText}>{isRTL ? "تأكيد الحجز" : "Confirm Booking"}</Text>
          <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 20 },
  section: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  activityName: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryText: { fontSize: 14 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  dateInput: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dateText: { fontSize: 15 },
  participantCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10, marginBottom: 12 },
  participantHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  participantNumber: { fontSize: 15, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  totalCard: { borderRadius: 14, borderWidth: 1, padding: 18, alignItems: "center" },
  totalLabel: { fontSize: 14, marginBottom: 6 },
  totalPrice: { fontSize: 28, fontWeight: "800" },
  termsCard: { borderRadius: 14, borderWidth: 1, padding: 16 },
  termsTitle: { fontSize: 15, fontWeight: "700", marginBottom: 8 },
  termsText: { fontSize: 13, lineHeight: 20 },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, borderRadius: 14, gap: 8 },
  confirmBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
