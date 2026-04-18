import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function AddTravelerScreen() {
  const colors = useColors();
  const router = useRouter();
  const { companyId } = useLocalSearchParams<{ companyId?: string }>();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    nationality: "",
    passportNumber: "",
    passportExpiry: "",
    email: "",
    phone: "",
    gender: "" as "male" | "female" | "",
    notes: "",
  });

  const addTravelerMutation = trpc.companies.addTraveler.useMutation({
    onSuccess: () => {
      Alert.alert("تم", "تم إضافة المسافر بنجاح", [
        { text: "حسناً", onPress: () => router.back() },
      ]);
    },
    onError: (err) => {
      Alert.alert("خطأ", err.message || "حدث خطأ أثناء إضافة المسافر");
    },
  });

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("خطأ", "الاسم الأول والأخير مطلوبان");
      return;
    }
    const cId = companyId ? parseInt(companyId) : 0;
    if (!cId) {
      Alert.alert("خطأ", "معرف الشركة مفقود");
      return;
    }
    addTravelerMutation.mutate({
      companyId: cId,
      firstName: form.firstName,
      lastName: form.lastName,
      dateOfBirth: form.dateOfBirth || undefined,
      nationality: form.nationality || undefined,
      passportNumber: form.passportNumber || undefined,
      passportExpiry: form.passportExpiry || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      gender: (form.gender as "male" | "female") || undefined,
      notes: form.notes || undefined,
    });
  };

  const styles = StyleSheet.create({
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    backBtn: { padding: 4 },
    backText: { fontSize: 24, color: colors.primary },
    title: { fontSize: 20, fontWeight: "700", color: colors.foreground },
    section: {
      marginHorizontal: 16,
      marginTop: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 14,
    },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, textAlign: "right", marginBottom: 4 },
    label: { fontSize: 13, color: colors.muted, textAlign: "right", marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: colors.foreground,
      backgroundColor: colors.background,
      textAlign: "right",
    },
    genderRow: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
    genderBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    genderBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    genderBtnText: { fontSize: 14, color: colors.foreground },
    genderBtnTextActive: { color: "#fff", fontWeight: "600" },
    submitBtn: {
      margin: 20,
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
    },
    submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  });

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>إضافة مسافر</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* المعلومات الأساسية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات الأساسية</Text>
          <View>
            <Text style={styles.label}>الاسم الأول *</Text>
            <TextInput
              style={styles.input}
              value={form.firstName}
              onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
              placeholder="الاسم الأول"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>الاسم الأخير *</Text>
            <TextInput
              style={styles.input}
              value={form.lastName}
              onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
              placeholder="الاسم الأخير"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>الجنس</Text>
            <View style={styles.genderRow}>
              {[{ v: "male", l: "ذكر" }, { v: "female", l: "أنثى" }].map((g) => (
                <TouchableOpacity
                  key={g.v}
                  style={[styles.genderBtn, form.gender === g.v && styles.genderBtnActive]}
                  onPress={() => setForm((f) => ({ ...f, gender: g.v as "male" | "female" }))}
                >
                  <Text style={[styles.genderBtnText, form.gender === g.v && styles.genderBtnTextActive]}>
                    {g.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.label}>تاريخ الميلاد (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.dateOfBirth}
              onChangeText={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
              placeholder="1990-01-15"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>الجنسية</Text>
            <TextInput
              style={styles.input}
              value={form.nationality}
              onChangeText={(v) => setForm((f) => ({ ...f, nationality: v }))}
              placeholder="موريتانية"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* جواز السفر */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>جواز السفر</Text>
          <View>
            <Text style={styles.label}>رقم الجواز</Text>
            <TextInput
              style={styles.input}
              value={form.passportNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, passportNumber: v }))}
              placeholder="A12345678"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
            />
          </View>
          <View>
            <Text style={styles.label}>تاريخ انتهاء الجواز (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={form.passportExpiry}
              onChangeText={(v) => setForm((f) => ({ ...f, passportExpiry: v }))}
              placeholder="2030-12-31"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* معلومات التواصل */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات التواصل</Text>
          <View>
            <Text style={styles.label}>البريد الإلكتروني</Text>
            <TextInput
              style={styles.input}
              value={form.email}
              onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="traveler@example.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput
              style={styles.input}
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+222 XX XX XX XX"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, addTravelerMutation.isPending && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={addTravelerMutation.isPending}
        >
          {addTravelerMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>إضافة المسافر</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
