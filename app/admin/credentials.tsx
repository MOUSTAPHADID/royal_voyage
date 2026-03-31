import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import {
  getAdminEmail,
  setAdminEmail,
  getAdminPassword,
  setAdminPassword,
} from "@/lib/admin-security";

type Section = "email" | "password" | null;

export default function CredentialsScreen() {
  const router = useRouter();
  const colors = useColors();

  const [activeSection, setActiveSection] = useState<Section>(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState("");

  // Email fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  // Password fields
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getAdminEmail().then(setCurrentAdminEmail);
  }, []);

  const resetFields = () => {
    setCurrentPassword(""); setNewEmail("");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setError(""); setSuccess("");
  };

  const toggleSection = (s: Section) => {
    resetFields();
    setActiveSection(activeSection === s ? null : s);
  };

  // ─── Change Email ───
  const handleChangeEmail = async () => {
    setError(""); setSuccess("");
    const storedPwd = await getAdminPassword();
    if (currentPassword !== storedPwd) {
      setError("كلمة المرور غير صحيحة");
      return;
    }
    if (!newEmail.includes("@") || !newEmail.includes(".")) {
      setError("البريد الإلكتروني غير صالح");
      return;
    }
    const ok = await setAdminEmail(newEmail);
    if (ok) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCurrentAdminEmail(newEmail);
      setSuccess("تم تغيير البريد الإلكتروني بنجاح");
      setTimeout(() => { resetFields(); setActiveSection(null); }, 1500);
    } else {
      setError("فشل في حفظ البريد الإلكتروني الجديد");
    }
  };

  // ─── Change Password ───
  const handleChangePassword = async () => {
    setError(""); setSuccess("");
    const storedPwd = await getAdminPassword();
    if (currentPwd !== storedPwd) {
      setError("كلمة المرور الحالية غير صحيحة");
      return;
    }
    if (newPwd.length < 6) {
      setError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPwd !== confirmPwd) {
      setError("كلمة المرور الجديدة غير متطابقة");
      return;
    }
    const ok = await setAdminPassword(newPwd);
    if (ok) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess("تم تغيير كلمة المرور بنجاح");
      setTimeout(() => { resetFields(); setActiveSection(null); }, 1500);
    } else {
      setError("فشل في حفظ كلمة المرور الجديدة");
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    opts?: { secure?: boolean; keyboard?: "default" | "number-pad" | "email-address"; maxLength?: number; placeholder?: string }
  ) => (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.inputLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={opts?.secure}
        keyboardType={opts?.keyboard || "default"}
        maxLength={opts?.maxLength}
        placeholder={opts?.placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.primary }]}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <IconSymbol name="arrow.left" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={s.headerTitle}>بيانات الاعتماد</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Current Info Card */}
        <View style={[s.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.infoTitle, { color: colors.foreground }]}>البيانات الحالية</Text>
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: colors.muted }]}>البريد الإلكتروني</Text>
            <Text style={[s.infoValue, { color: colors.foreground }]}>{currentAdminEmail}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={[s.infoLabel, { color: colors.muted }]}>كلمة المرور</Text>
            <Text style={[s.infoValue, { color: colors.foreground }]}>••••••••</Text>
          </View>
        </View>

        {/* Change Email Section */}
        <Pressable
          style={({ pressed }) => [
            s.sectionHeader,
            {
              backgroundColor: activeSection === "email" ? colors.primary + "15" : colors.surface,
              borderColor: activeSection === "email" ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => toggleSection("email")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[s.iconCircle, { backgroundColor: "#3B82F620" }]}>
              <IconSymbol name="paperplane.fill" size={18} color="#3B82F6" />
            </View>
            <View>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>تغيير البريد الإلكتروني</Text>
              <Text style={[s.sectionSubtitle, { color: colors.muted }]}>تحديث بريد تسجيل الدخول</Text>
            </View>
          </View>
          <IconSymbol name={activeSection === "email" ? "chevron.down" as any : "chevron.right"} size={16} color={colors.muted} />
        </Pressable>

        {activeSection === "email" && (
          <View style={[s.sectionBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderInput("كلمة المرور الحالية", currentPassword, setCurrentPassword, { secure: true })}
            {renderInput("البريد الإلكتروني الجديد", newEmail, setNewEmail, { keyboard: "email-address", placeholder: "example@domain.com" })}
            {error ? <Text style={[s.errorText, { color: colors.error }]}>{error}</Text> : null}
            {success ? <Text style={[s.successText, { color: "#22C55E" }]}>{success}</Text> : null}
            <Pressable
              style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleChangeEmail}
            >
              <Text style={s.submitBtnText}>حفظ التغييرات</Text>
            </Pressable>
          </View>
        )}

        {/* Change Password Section */}
        <Pressable
          style={({ pressed }) => [
            s.sectionHeader,
            {
              backgroundColor: activeSection === "password" ? colors.primary + "15" : colors.surface,
              borderColor: activeSection === "password" ? colors.primary : colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          onPress={() => toggleSection("password")}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={[s.iconCircle, { backgroundColor: "#E67E2220" }]}>
              <IconSymbol name="lock.fill" size={18} color="#E67E22" />
            </View>
            <View>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>تغيير كلمة المرور</Text>
              <Text style={[s.sectionSubtitle, { color: colors.muted }]}>تحديث كلمة مرور الدخول</Text>
            </View>
          </View>
          <IconSymbol name={activeSection === "password" ? "chevron.down" as any : "chevron.right"} size={16} color={colors.muted} />
        </Pressable>

        {activeSection === "password" && (
          <View style={[s.sectionBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {renderInput("كلمة المرور الحالية", currentPwd, setCurrentPwd, { secure: true })}
            {renderInput("كلمة المرور الجديدة", newPwd, setNewPwd, { secure: true, placeholder: "6 أحرف على الأقل" })}
            {renderInput("تأكيد كلمة المرور الجديدة", confirmPwd, setConfirmPwd, { secure: true })}
            {error ? <Text style={[s.errorText, { color: colors.error }]}>{error}</Text> : null}
            {success ? <Text style={[s.successText, { color: "#22C55E" }]}>{success}</Text> : null}
            <Pressable
              style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleChangePassword}
            >
              <Text style={s.submitBtnText}>حفظ التغييرات</Text>
            </Pressable>
          </View>
        )}

        {/* Security Tips */}
        <View style={[s.tipsCard, { backgroundColor: "#FEF3C720", borderColor: "#F59E0B40" }]}>
          <Text style={{ fontSize: 16, marginBottom: 6 }}>💡</Text>
          <Text style={[s.tipsTitle, { color: "#92400E" }]}>نصائح أمنية</Text>
          <Text style={[s.tipsText, { color: "#78350F" }]}>
            • استخدم كلمة مرور قوية تحتوي على أحرف وأرقام ورموز{"\n"}
            • لا تشارك بيانات الاعتماد مع أي شخص{"\n"}
            • قم بتغيير كلمة المرور بشكل دوري{"\n"}
            • فعّل التحقق الثنائي (2FA) لحماية إضافية
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  infoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: { fontSize: 13, fontWeight: "500" },
  infoValue: { fontSize: 13, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 2,
    marginTop: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 14, fontWeight: "700" },
  sectionSubtitle: { fontSize: 11, fontWeight: "500", marginTop: 1 },
  sectionBody: {
    borderRadius: 14,
    borderWidth: 1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    padding: 16,
    marginBottom: 6,
  },
  inputLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  errorText: { fontSize: 13, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  successText: { fontSize: 13, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  tipsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  tipsTitle: { fontSize: 14, fontWeight: "700", marginBottom: 6 },
  tipsText: { fontSize: 12, lineHeight: 20 },
});
