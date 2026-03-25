import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useTranslation, useI18n } from "@/lib/i18n";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function EditProfileScreen() {
  const router = useRouter();
  const colors = useColors();
  const { user, updateUser } = useApp();
  const { t } = useTranslation();
  const { language } = useI18n();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [nationality, setNationality] = useState(user?.nationality ?? "");
  const [passportNumber, setPassportNumber] = useState(user?.passportNumber ?? "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        language === "ar" ? "خطأ" : "Error",
        language === "ar" ? "الاسم مطلوب" : "Name is required"
      );
      return;
    }
    setIsSaving(true);
    try {
      updateUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nationality: nationality.trim(),
        passportNumber: passportNumber.trim(),
      });
      Alert.alert(
        language === "ar" ? "تم الحفظ" : "Saved",
        language === "ar" ? "تم تحديث بياناتك بنجاح" : "Your profile has been updated",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      Alert.alert(
        language === "ar" ? "خطأ" : "Error",
        language === "ar" ? "حدث خطأ أثناء الحفظ" : "An error occurred while saving"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const fields = [
    {
      label: language === "ar" ? "الاسم الكامل" : "Full Name",
      value: name,
      onChange: setName,
      placeholder: language === "ar" ? "أدخل اسمك الكامل" : "Enter your full name",
      icon: "person.fill",
      required: true,
      keyboardType: "default" as const,
    },
    {
      label: language === "ar" ? "رقم الهاتف" : "Phone Number",
      value: phone,
      onChange: setPhone,
      placeholder: "+222 XX XX XX XX",
      icon: "phone.fill",
      required: false,
      keyboardType: "phone-pad" as const,
    },
    {
      label: language === "ar" ? "البريد الإلكتروني" : "Email",
      value: email,
      onChange: setEmail,
      placeholder: "you@example.com",
      icon: "envelope.fill",
      required: false,
      keyboardType: "email-address" as const,
    },
    {
      label: language === "ar" ? "الجنسية" : "Nationality",
      value: nationality,
      onChange: setNationality,
      placeholder: language === "ar" ? "مثال: موريتانية" : "e.g. Mauritanian",
      icon: "globe",
      required: false,
      keyboardType: "default" as const,
    },
    {
      label: language === "ar" ? "رقم جواز السفر" : "Passport Number",
      value: passportNumber,
      onChange: setPassportNumber,
      placeholder: language === "ar" ? "رقم الجواز" : "Passport number",
      icon: "doc.text.fill",
      required: false,
      keyboardType: "default" as const,
    },
  ];

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <IconSymbol name="chevron.left.forwardslash.chevron.right" size={20} color="#FFF" />
            <Text style={styles.backText}>
              {language === "ar" ? "رجوع" : "Back"}
            </Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {language === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}
          </Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {name?.charAt(0)?.toUpperCase() ?? "?"}
              </Text>
            </View>
          </View>

          {/* Fields */}
          {fields.map((field) => (
            <View key={field.label} style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {field.label} {field.required ? "*" : ""}
              </Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <IconSymbol name={field.icon as any} size={18} color={colors.muted} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.muted}
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.keyboardType === "email-address" ? "none" : "words"}
                  autoCorrect={false}
                />
              </View>
            </View>
          ))}

          {/* Save Button */}
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveBtnText}>
              {isSaving
                ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
                : (language === "ar" ? "حفظ التعديلات" : "Save Changes")}
            </Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "column",
    gap: 8,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
  },
  saveBtn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
