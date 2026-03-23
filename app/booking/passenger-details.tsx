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
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { FLIGHTS, HOTELS } from "@/lib/mock-data";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function PassengerDetailsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user } = useApp();
  const params = useLocalSearchParams<{ type: string; id: string; roomId: string }>();

  const isFlight = params.type === "flight";
  const flight = isFlight ? FLIGHTS.find((f) => f.id === params.id) ?? FLIGHTS[0] : null;
  const hotel = !isFlight ? HOTELS.find((h) => h.id === params.id) ?? HOTELS[0] : null;

  const [firstName, setFirstName] = useState(user?.name?.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(user?.name?.split(" ").slice(1).join(" ") ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [passport, setPassport] = useState(user?.passportNumber ?? "");
  const [nationality, setNationality] = useState(user?.nationality ?? "");

  const handleContinue = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      return;
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
      },
    });
  };

  const fields = isFlight ? [
    { label: "First Name", value: firstName, setter: setFirstName, placeholder: "John", required: true },
    { label: "Last Name", value: lastName, setter: setLastName, placeholder: "Doe", required: true },
    { label: "Email Address", value: email, setter: setEmail, placeholder: "john@example.com", required: true, keyboardType: "email-address" as const },
    { label: "Phone Number", value: phone, setter: setPhone, placeholder: "+212 6 00 00 00 00", keyboardType: "phone-pad" as const },
    { label: "Passport Number", value: passport, setter: setPassport, placeholder: "AB123456" },
    { label: "Nationality", value: nationality, setter: setNationality, placeholder: "Moroccan" },
  ] : [
    { label: "First Name", value: firstName, setter: setFirstName, placeholder: "John", required: true },
    { label: "Last Name", value: lastName, setter: setLastName, placeholder: "Doe", required: true },
    { label: "Email Address", value: email, setter: setEmail, placeholder: "john@example.com", required: true, keyboardType: "email-address" as const },
    { label: "Phone Number", value: phone, setter: setPhone, placeholder: "+212 6 00 00 00 00", keyboardType: "phone-pad" as const },
  ];

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
            {isFlight && flight ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryMain, { color: colors.foreground }]}>
                  {flight.originCode} → {flight.destinationCode}
                </Text>
                <Text style={[styles.summaryPrice, { color: colors.primary }]}>${flight.price}</Text>
              </View>
            ) : hotel ? (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryMain, { color: colors.foreground }]}>{hotel.name}</Text>
                <Text style={[styles.summaryPrice, { color: colors.primary }]}>${hotel.pricePerNight}/night</Text>
              </View>
            ) : null}
          </View>

          {/* Form */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.formTitle, { color: colors.foreground }]}>
              {isFlight ? "Primary Passenger" : "Primary Guest"}
            </Text>

            {fields.map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {field.label}
                  {field.required && <Text style={{ color: colors.error }}> *</Text>}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border },
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.muted}
                  value={field.value}
                  onChangeText={field.setter}
                  keyboardType={field.keyboardType ?? "default"}
                  autoCapitalize={field.keyboardType === "email-address" ? "none" : "words"}
                  returnKeyType="next"
                />
              </View>
            ))}
          </View>

          {/* Terms */}
          <View style={[styles.termsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <IconSymbol name="shield.fill" size={18} color={colors.success} />
            <Text style={[styles.termsText, { color: colors.muted }]}>
              Your personal data is protected and will only be used to process your booking.
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
  },
  summaryMain: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: "700",
  },
  formCard: {
    margin: 16,
    marginBottom: 0,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  termsCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  continueBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  continueBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
