import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { FLIGHTS, HOTELS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatDuffelPriceMRU, formatMRU, toMRU } from "@/lib/currency";
import { useCurrency } from "@/lib/currency-context";
import { DatePickerField } from "@/components/ui/date-picker-field";

export default function PassengerDetailsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useApp();
  const { fmt } = useCurrency();
  const params = useLocalSearchParams<{
    type: string;
    id: string;
    roomId: string;
    price?: string;
    currency?: string;
    priceCurrency?: string;
    airline?: string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    originCode?: string;
    destinationCode?: string;
    departureTime?: string;
    arrivalTime?: string;
    duration?: string;
    cabinClass?: string;
    passengers?: string;
    children?: string;
    infants?: string;
    childDobs?: string;
    tripType?: string;
    returnDate?: string;
    hotelName?: string;
    hotelCity?: string;
    hotelCountry?: string;
    hotelStars?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    roomType?: string;
    roomPrice?: string;
    rawOffer?: string; // JSON string of Duffel raw offer
  }>();

  const isFlight = params.type === "flight";
  const flight = isFlight ? FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0] : null;
  const hotel = !isFlight ? HOTELS.find((h) => h.id === params.id) ?? HOTELS[0] : null;

  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [passport, setPassport] = useState(user?.passportNumber ?? "");
  const [nationality, setNationality] = useState(user?.nationality ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [dobError, setDobError] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const childrenCount = parseInt(params.children ?? "0", 10);
  const infantCount = parseInt(params.infants ?? "0", 10);

  // Parse child DOBs from search screen
  const parsedChildDobs: string[] = React.useMemo(() => {
    try {
      return params.childDobs ? JSON.parse(params.childDobs) : [];
    } catch { return []; }
  }, [params.childDobs]);

  // Child details: name and date of birth for each child
  const [childDetails, setChildDetails] = useState<Array<{ firstName: string; lastName: string; dateOfBirth: string }>>(
    Array.from({ length: childrenCount }, (_, i) => ({
      firstName: "",
      lastName: "",
      dateOfBirth: parsedChildDobs[i] || "",
    }))
  );

  const updateChildDetail = (index: number, field: "firstName" | "lastName" | "dateOfBirth", value: string) => {
    setChildDetails((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Infant details: name and date of birth for each infant
  const [infantDetails, setInfantDetails] = useState<Array<{ firstName: string; lastName: string; dateOfBirth: string }>>(
    Array.from({ length: infantCount }, () => ({ firstName: "", lastName: "", dateOfBirth: "" }))
  );

  const updateInfantDetail = (index: number, field: "firstName" | "lastName" | "dateOfBirth", value: string) => {
    setInfantDetails((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const validateDOB = (val: string) => {
    setDateOfBirth(val);
    if (!val) { setDobError(""); return; }
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(val)) {
      setDobError("Format: YYYY-MM-DD");
      return;
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) { setDobError("Invalid date"); return; }
    if (d > new Date()) { setDobError("Date cannot be in the future"); return; }
    setDobError("");
  };

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    if (dobError) return;
    // Validate child details if any
    if (childrenCount > 0) {
      for (let i = 0; i < childrenCount; i++) {
        const child = childDetails[i];
        if (!child?.firstName?.trim() || !child?.lastName?.trim() || !child?.dateOfBirth) {
          Alert.alert(
            "بيانات الطفل ناقصة",
            `يرجى إكمال بيانات الطفل ${i + 1} (الاسم وتاريخ الميلاد).`,
            [{ text: "حسناً" }]
          );
          return;
        }
      }
    }
    // Validate infant details if any
    if (infantCount > 0) {
      for (let i = 0; i < infantCount; i++) {
        const inf = infantDetails[i];
        if (!inf?.firstName?.trim() || !inf?.lastName?.trim() || !inf?.dateOfBirth) return;
        // Validate infant age: must be under 2 years old at time of travel
        const infantDob = new Date(inf.dateOfBirth);
        const now = new Date();
        const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        if (infantDob < twoYearsAgo) {
          // Infant is 2 or older — not valid as infant
          Alert.alert(
            "عمر الرضيع غير صالح",
            `الرضيع ${i + 1} يجب أن يكون عمره أقل من سنتين. يرجى التحقق من تاريخ الميلاد.`,
            [{ text: "حسناً" }]
          );
          return;
        }
      }
    }
    router.push({
      pathname: "/booking/payment" as any,
      params: {
        type: params.type,
        id: params.id,
        roomId: params.roomId,
        firstName,
        lastName,
        email,
        phone,
        passport,
        nationality,
        dateOfBirth,
        price: params.price,
        currency: params.currency,
        priceCurrency: params.priceCurrency,
        airline: params.airline,
        flightNumber: params.flightNumber,
        origin: params.origin,
        destination: params.destination,
        originCode: params.originCode,
        destinationCode: params.destinationCode,
        departureTime: params.departureTime,
        arrivalTime: params.arrivalTime,
        duration: params.duration,
        cabinClass: params.cabinClass,
        passengers: params.passengers,
        children: params.children,
        infants: params.infants,
        childDetailsJson: childrenCount > 0 ? JSON.stringify(childDetails) : undefined,
        infantDetailsJson: infantCount > 0 ? JSON.stringify(infantDetails) : undefined,
        tripType: params.tripType,
        returnDate: params.returnDate,
        hotelName: params.hotelName,
        hotelCity: params.hotelCity,
        hotelCountry: params.hotelCountry,
        hotelStars: params.hotelStars,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        guests: params.guests,
        roomType: params.roomType,
        roomPrice: params.roomPrice,
        rawOffer: params.rawOffer || "",
        specialRequests: specialRequests.trim() || "",
      },
    });
  };

  const displayPrice = params.price
    ? fmt(params.priceCurrency === "MRU"
        ? parseFloat(params.price)
        : toMRU(parseFloat(params.price), params.currency ?? "EUR"))
    : isFlight && flight
    ? fmt(toMRU(flight.price, "USD"))
    : hotel
    ? fmt(toMRU(hotel.pricePerNight, "USD")) + "/night"
    : "";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScreenContainer edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>
            {isFlight ? "Passenger Details" : "Guest Details"}
          </Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ backgroundColor: colors.background }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Booking summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.muted }]}>
              {isFlight ? "Flight Summary" : "Hotel Summary"}
            </Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryMain, { color: colors.foreground }]}>
                {isFlight
                  ? `${params.originCode ?? flight?.originCode ?? ""} → ${params.destinationCode ?? flight?.destinationCode ?? ""}`
                  : params.hotelName ?? hotel?.name ?? ""}
              </Text>
              <Text style={[styles.summaryPrice, { color: colors.primary }]}>{displayPrice}</Text>
            </View>
            {/* Passengers & children badge */}
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: colors.primary + "18" }]}>
                <IconSymbol name="person.2.fill" size={13} color={colors.primary} />
                <Text style={[styles.badgeText, { color: colors.primary }]}>
                  {params.passengers ?? "1"} Adult{parseInt(params.passengers ?? "1") > 1 ? "s" : ""}
                </Text>
              </View>
              {childrenCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.success + "18" }]}>
                  <IconSymbol name="figure.and.child.holdinghands" size={13} color={colors.success} />
                  <Text style={[styles.badgeText, { color: colors.success }]}>
                    {childrenCount} Child{childrenCount > 1 ? "ren" : ""}
                  </Text>
                </View>
              )}
              {infantCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error + "18" }]}>
                  <IconSymbol name="heart.fill" size={13} color={colors.error} />
                  <Text style={[styles.badgeText, { color: colors.error }]}>
                    {infantCount} Infant{infantCount > 1 ? "s" : ""}
                  </Text>
                </View>
              )}
              {params.tripType === "roundtrip" && (
                <View style={[styles.badge, { backgroundColor: colors.warning + "18" }]}>
                  <IconSymbol name="arrow.2.squarepath" size={13} color={colors.warning} />
                  <Text style={[styles.badgeText, { color: colors.warning }]}>Round Trip</Text>
                </View>
              )}
            </View>
          </View>

          {/* Primary Passenger Form */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              {isFlight ? "Primary Passenger" : "Primary Guest"}
            </Text>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                First Name <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="John"
                placeholderTextColor={colors.muted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Last Name <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="Doe"
                placeholderTextColor={colors.muted}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                تاريخ الميلاد <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <DatePickerField
                value={dateOfBirth}
                onChange={(d) => {
                  setDateOfBirth(d);
                  setDobError("");
                }}
                placeholder="اختر تاريخ الميلاد"
                maximumDate={new Date()}
                backgroundColor={colors.background}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>
                Email Address <Text style={{ color: colors.error }}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="john@example.com"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                placeholder="+222 XX XX XX XX"
                placeholderTextColor={colors.muted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            {isFlight && (
              <>
                {/* Passport */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Passport Number</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                    placeholder="AB123456"
                    placeholderTextColor={colors.muted}
                    value={passport}
                    onChangeText={setPassport}
                    autoCapitalize="characters"
                    returnKeyType="next"
                  />
                </View>

                {/* Nationality */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: colors.foreground }]}>Nationality</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                    placeholder="Mauritanian"
                    placeholderTextColor={colors.muted}
                    value={nationality}
                    onChangeText={setNationality}
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                </View>
              </>
            )}
          </View>

          {/* Child Details Forms */}
          {childrenCount > 0 && (
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>
                بيانات الأطفال (Child Details)
              </Text>
              <Text style={[{ color: colors.muted, fontSize: 13, marginBottom: 12 }]}>
                عمر الطفل يجب أن يكون بين 2 و 11 سنة عند السفر.
              </Text>
              {childDetails.map((child, idx) => (
                <View key={`child-${idx}`} style={{ marginBottom: 16 }}>
                  {childrenCount > 1 && (
                    <Text style={[{ color: colors.primary, fontSize: 14, fontWeight: "700", marginBottom: 8 }]}>
                      الطفل {idx + 1}
                    </Text>
                  )}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      First Name <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Child"
                      placeholderTextColor={colors.muted}
                      value={child.firstName}
                      onChangeText={(v) => updateChildDetail(idx, "firstName", v)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      Last Name <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Doe"
                      placeholderTextColor={colors.muted}
                      value={child.lastName}
                      onChangeText={(v) => updateChildDetail(idx, "lastName", v)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      تاريخ الميلاد <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <DatePickerField
                      value={child.dateOfBirth}
                      onChange={(d) => updateChildDetail(idx, "dateOfBirth", d)}
                      placeholder="اختر تاريخ الميلاد"
                      maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 2))}
                      minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 12))}
                      backgroundColor={colors.background}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Infant Details Forms */}
          {infantCount > 0 && (
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.foreground }]}>
                بيانات الرضع (Infant Details)
              </Text>
              <Text style={[{ color: colors.muted, fontSize: 13, marginBottom: 12 }]}>
                يجب أن يكون عمر الرضيع أقل من سنتين عند السفر. الرضيع يجلس في حضن البالغ.
              </Text>
              {infantDetails.map((infant, idx) => (
                <View key={`infant-${idx}`} style={{ marginBottom: 16 }}>
                  {infantCount > 1 && (
                    <Text style={[{ color: colors.primary, fontSize: 14, fontWeight: "700", marginBottom: 8 }]}>
                      الرضيع {idx + 1}
                    </Text>
                  )}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      First Name <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Baby"
                      placeholderTextColor={colors.muted}
                      value={infant.firstName}
                      onChangeText={(v) => updateInfantDetail(idx, "firstName", v)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      Last Name <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                      placeholder="Doe"
                      placeholderTextColor={colors.muted}
                      value={infant.lastName}
                      onChangeText={(v) => updateInfantDetail(idx, "lastName", v)}
                      autoCapitalize="words"
                      returnKeyType="next"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.foreground }]}>
                      تاريخ الميلاد <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <DatePickerField
                      value={infant.dateOfBirth}
                      onChange={(d) => updateInfantDetail(idx, "dateOfBirth", d)}
                      placeholder="اختر تاريخ الميلاد"
                      maximumDate={new Date()}
                      minimumDate={new Date(new Date().setFullYear(new Date().getFullYear() - 2))}
                      backgroundColor={colors.background}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Special Requests */}
          <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>طلبات خاصة (اختياري)</Text>
            <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 10, lineHeight: 18 }}>
              يمكنك إضافة طلبات خاصة مثل: وجبة خاصة، مساعدة للتنقل، مقعد محدد، أو أي تعليمات أخرى لشركة الطيران.
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  height: 90,
                  textAlignVertical: "top",
                  paddingTop: 10,
                }
              ]}
              placeholder="مثال: وجبة نباتية، مساعدة كرسي متحرك، مقعد نافذة..."
              placeholderTextColor={colors.muted}
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
              maxLength={300}
              returnKeyType="default"
            />
            {specialRequests.length > 0 && (
              <Text style={{ fontSize: 10, color: colors.muted, textAlign: "right", marginTop: 4 }}>
                {specialRequests.length}/300
              </Text>
            )}
          </View>

          {/* Security note */}
          <View style={[styles.termsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="shield.fill" size={18} color={colors.success} />
            <Text style={[styles.termsText, { color: colors.muted }]}>
              Your personal data is protected and will only be used to process your booking. A ticket will be sent to your email after confirmation.
            </Text>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.continueBtnText}>Continue to Payment</Text>
            <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  backBtn: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  summaryCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryMain: { fontSize: 16, fontWeight: "700" },
  summaryPrice: { fontSize: 18, fontWeight: "700" },
  badgeRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: "600" },
  formCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: { fontSize: 12, marginTop: 4 },
  termsCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  termsText: { flex: 1, fontSize: 13, lineHeight: 20 },
  bottomBar: {
    padding: 16,
    borderTopWidth: 1,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  continueBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
