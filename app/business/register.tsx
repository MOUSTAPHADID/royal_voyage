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
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

type CompanyType = "travel_agency" | "corporate" | "tour_operator" | "other";

export default function BusinessRegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { user } = useAuth();

  const [form, setForm] = useState({
    companyName: "",
    tradingName: "",
    businessEmail: "",
    phoneNumber: "",
    country: "MR",
    city: "",
    businessAddress: "",
    website: "",
    companyType: "travel_agency" as CompanyType,
    registrationNumber: "",
    taxId: "",
    iataNumber: "",
    contactPersonFullName: "",
    jobTitle: "",
    contactEmail: "",
    contactPhone: "",
  });

  const registerMutation = trpc.companies.register.useMutation({
    onSuccess: () => {
      Alert.alert(
        "تم التسجيل",
        "تم إرسال طلب تسجيل شركتك بنجاح. سيتم مراجعته خلال 24-48 ساعة.",
        [{ text: "حسناً", onPress: () => router.replace("/business/dashboard") }]
      );
    },
    onError: (err) => {
      Alert.alert("خطأ", err.message || "حدث خطأ أثناء التسجيل");
    },
  });

  const handleSubmit = () => {
    if (!form.companyName.trim()) {
      Alert.alert("خطأ", "اسم الشركة مطلوب");
      return;
    }
    if (!form.businessEmail.trim()) {
      Alert.alert("خطأ", "البريد الإلكتروني مطلوب");
      return;
    }
    if (!form.contactPersonFullName.trim()) {
      Alert.alert("خطأ", "اسم المسؤول مطلوب");
      return;
    }
    if (!user?.id) {
      Alert.alert("خطأ", "يجب تسجيل الدخول أولاً");
      return;
    }

    registerMutation.mutate({
      ownerUserId: user.id,
      companyName: form.companyName,
      tradingName: form.tradingName || undefined,
      businessEmail: form.businessEmail,
      phoneNumber: form.phoneNumber || undefined,
      country: form.country,
      city: form.city || undefined,
      businessAddress: form.businessAddress || undefined,
      website: form.website || undefined,
      companyType: form.companyType,
      registrationNumber: form.registrationNumber || undefined,
      taxId: form.taxId || undefined,
      iataNumber: form.iataNumber || undefined,
      contactPersonFullName: form.contactPersonFullName,
      jobTitle: form.jobTitle || undefined,
      contactEmail: form.contactEmail || undefined,
      contactPhone: form.contactPhone || undefined,
    });
  };

  const companyTypes: { v: CompanyType; l: string }[] = [
    { v: "travel_agency", l: "وكالة سفر" },
    { v: "corporate", l: "شركة" },
    { v: "tour_operator", l: "منظم رحلات" },
    { v: "other", l: "أخرى" },
  ];

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
    intro: {
      margin: 16,
      backgroundColor: colors.primary + "15",
      borderRadius: 12,
      padding: 14,
    },
    introText: { fontSize: 14, color: colors.foreground, textAlign: "right", lineHeight: 22 },
    section: {
      marginHorizontal: 16,
      marginTop: 16,
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
    typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
    typeBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    typeBtnText: { fontSize: 13, color: colors.foreground },
    typeBtnTextActive: { color: "#fff", fontWeight: "600" },
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
        <Text style={styles.title}>تسجيل حساب تجاري</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.introText}>
            سجّل شركتك للاستفادة من الأسعار التجارية، وإدارة حجوزات فريقك، وإصدار الفواتير. سيتم مراجعة طلبك خلال 24-48 ساعة.
          </Text>
        </View>

        {/* معلومات الشركة */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الشركة</Text>
          <View>
            <Text style={styles.label}>اسم الشركة الرسمي *</Text>
            <TextInput
              style={styles.input}
              value={form.companyName}
              onChangeText={(v) => setForm((f) => ({ ...f, companyName: v }))}
              placeholder="شركة الرحلات الملكية"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>الاسم التجاري (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={form.tradingName}
              onChangeText={(v) => setForm((f) => ({ ...f, tradingName: v }))}
              placeholder="Royal Voyage"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>نوع الشركة</Text>
            <View style={styles.typeRow}>
              {companyTypes.map((t) => (
                <TouchableOpacity
                  key={t.v}
                  style={[styles.typeBtn, form.companyType === t.v && styles.typeBtnActive]}
                  onPress={() => setForm((f) => ({ ...f, companyType: t.v }))}
                >
                  <Text style={[styles.typeBtnText, form.companyType === t.v && styles.typeBtnTextActive]}>
                    {t.l}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View>
            <Text style={styles.label}>البريد الإلكتروني للشركة *</Text>
            <TextInput
              style={styles.input}
              value={form.businessEmail}
              onChangeText={(v) => setForm((f) => ({ ...f, businessEmail: v }))}
              placeholder="info@company.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View>
            <Text style={styles.label}>رقم الهاتف</Text>
            <TextInput
              style={styles.input}
              value={form.phoneNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, phoneNumber: v }))}
              placeholder="+222 XX XX XX XX"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />
          </View>
          <View>
            <Text style={styles.label}>المدينة</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
              placeholder="نواكشوط"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>العنوان التجاري</Text>
            <TextInput
              style={styles.input}
              value={form.businessAddress}
              onChangeText={(v) => setForm((f) => ({ ...f, businessAddress: v }))}
              placeholder="شارع..."
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* المعلومات القانونية */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المعلومات القانونية</Text>
          <View>
            <Text style={styles.label}>رقم السجل التجاري</Text>
            <TextInput
              style={styles.input}
              value={form.registrationNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, registrationNumber: v }))}
              placeholder="RC-XXXXX"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>الرقم الضريبي</Text>
            <TextInput
              style={styles.input}
              value={form.taxId}
              onChangeText={(v) => setForm((f) => ({ ...f, taxId: v }))}
              placeholder="NIF-XXXXX"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>رقم IATA (إن وجد)</Text>
            <TextInput
              style={styles.input}
              value={form.iataNumber}
              onChangeText={(v) => setForm((f) => ({ ...f, iataNumber: v }))}
              placeholder="IATA-XXXXX"
              placeholderTextColor={colors.muted}
            />
          </View>
        </View>

        {/* معلومات المسؤول */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات المسؤول</Text>
          <View>
            <Text style={styles.label}>الاسم الكامل *</Text>
            <TextInput
              style={styles.input}
              value={form.contactPersonFullName}
              onChangeText={(v) => setForm((f) => ({ ...f, contactPersonFullName: v }))}
              placeholder="محمد أحمد"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>المسمى الوظيفي</Text>
            <TextInput
              style={styles.input}
              value={form.jobTitle}
              onChangeText={(v) => setForm((f) => ({ ...f, jobTitle: v }))}
              placeholder="مدير عام"
              placeholderTextColor={colors.muted}
            />
          </View>
          <View>
            <Text style={styles.label}>البريد الإلكتروني للتواصل</Text>
            <TextInput
              style={styles.input}
              value={form.contactEmail}
              onChangeText={(v) => setForm((f) => ({ ...f, contactEmail: v }))}
              placeholder="manager@company.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <View>
            <Text style={styles.label}>هاتف التواصل</Text>
            <TextInput
              style={styles.input}
              value={form.contactPhone}
              onChangeText={(v) => setForm((f) => ({ ...f, contactPhone: v }))}
              placeholder="+222 XX XX XX XX"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, registerMutation.isPending && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>إرسال طلب التسجيل</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
