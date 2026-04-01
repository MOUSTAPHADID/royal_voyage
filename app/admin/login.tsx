import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { validateEmailPassword } from "@/lib/admin-security";
import * as Haptics from "expo-haptics";

export default function AdminLoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // Validate using admin-security module
      const validation = await validateEmailPassword(email.trim(), password);
      if (validation.locked) {
        setError(`الحساب مقفل. حاول بعد ${validation.lockoutSeconds} ثانية`);
        return;
      }
      if (!validation.success) {
        const left = validation.attemptsLeft;
        setError(`بيانات الدخول غير صحيحة. ${left > 0 ? `متبقي ${left} محاولات` : "تم قفل الحساب مؤقتاً"}`);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      // Login via app context to set admin user
      const result = await login(email.trim(), password);
      if (result === "admin") {
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/admin" as any);
      } else {
        setError("خطأ في تسجيل الدخول. يرجى المحاولة مجدداً");
      }
    } catch {
      setError("حدث خطأ. يرجى المحاولة مجدداً");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[s.header, { backgroundColor: "#1B2B5E" }]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={s.logo}
            resizeMode="contain"
          />
          <Text style={s.appName}>Royal Service</Text>
          <Text style={s.tagline}>لوحة الإدارة</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>🔐 وصول مقيد</Text>
          </View>
        </View>

        {/* Form */}
        <View style={[s.form, { backgroundColor: colors.background }]}>
          <Text style={[s.formTitle, { color: colors.foreground }]}>تسجيل دخول المدير</Text>
          <Text style={[s.formSub, { color: colors.muted }]}>أدخل بيانات حساب الإدارة للمتابعة</Text>

          {error ? (
            <View style={[s.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
              <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>البريد الإلكتروني</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="suporte@royalvoyage.online"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>كلمة المرور</Text>
            <View style={[s.passwordRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[s.passwordInput, { color: colors.foreground }]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [s.loginBtn, { backgroundColor: "#1B2B5E", opacity: pressed ? 0.85 : 1 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={s.loginBtnText}>🔐 دخول لوحة الإدارة</Text>
            )}
          </Pressable>

          {/* Back */}
          <Pressable
            style={({ pressed }) => [s.backBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={[s.backBtnText, { color: colors.muted }]}>← العودة للتطبيق</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 15,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  form: {
    flex: 1,
    padding: 24,
    paddingTop: 32,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 6,
  },
  formSub: {
    fontSize: 14,
    textAlign: "right",
    marginBottom: 24,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    textAlign: "right",
    fontWeight: "500",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "right",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    textAlign: "right",
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    textAlign: "right",
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: "500",
  },
});
