import React, { useState, useRef } from "react";
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
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { validateEmailPassword } from "@/lib/admin-security";
import { recordLoginAttempt } from "@/lib/admin-login-audit";
import { trpc } from "@/lib/trpc";
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
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور");
      shake();
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const validation = await validateEmailPassword(email.trim(), password);
      if (validation.locked) {
        setError(`الحساب مقفل. حاول بعد ${validation.lockoutSeconds} ثانية`);
        recordLoginAttempt({ status: "failed", method: "email", email: email.trim(), detail: "مقفل مؤقتاً" });
        shake();
        return;
      }
      if (!validation.success) {
        const left = validation.attemptsLeft;
        setError(`بيانات الدخول غير صحيحة. ${left > 0 ? `متبقي ${left} محاولات` : "تم قفل الحساب مؤقتاً"}`);
        recordLoginAttempt({ status: "failed", method: "email", email: email.trim(), detail: "كلمة مرور خاطئة" });
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake();
        return;
      }
      const result = await login(email.trim(), password);
      if (result === "admin") {
        recordLoginAttempt({ status: "success", method: "email", email: email.trim() });
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/admin" as any);
      } else {
        recordLoginAttempt({ status: "failed", method: "email", email: email.trim(), detail: "خطأ غير محدد" });
        setError("خطأ في تسجيل الدخول. يرجى المحاولة مجدداً");
        shake();
      }
    } catch {
      setError("حدث خطأ. يرجى المحاولة مجدداً");
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F1C3F" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header */}
        <View style={s.header}>
          {/* Background decoration */}
          <View style={s.headerCircle1} />
          <View style={s.headerCircle2} />

          <View style={s.logoWrapper}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={s.appName}>Royal Voyage</Text>
          <Text style={s.tagline}>لوحة الإدارة</Text>

          <View style={s.securityBadge}>
            <MaterialIcons name="lock" size={13} color="#C9A84C" />
            <Text style={s.securityBadgeText}>وصول مقيد للمدراء فقط</Text>
          </View>
        </View>

        {/* Form Card */}
        <View style={[s.card, { backgroundColor: colors.background }]}>
          <Text style={[s.formTitle, { color: colors.foreground }]}>تسجيل دخول المدير</Text>
          <Text style={[s.formSub, { color: colors.muted }]}>أدخل بيانات حساب الإدارة للمتابعة</Text>

          {/* Error */}
          {error ? (
            <Animated.View
              style={[
                s.errorBox,
                { backgroundColor: "#FEF2F2", borderColor: "#FECACA", transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <MaterialIcons name="error-outline" size={16} color="#DC2626" />
              <Text style={s.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Email Field */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>البريد الإلكتروني</Text>
            <View
              style={[
                s.inputRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: emailFocused ? "#1B2B5E" : colors.border,
                  borderWidth: emailFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                style={[s.inputText, { color: colors.foreground }]}
                placeholder="suporte@royalvoyage.online"
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
              <MaterialIcons name="email" size={18} color={emailFocused ? "#1B2B5E" : colors.muted} />
            </View>
          </View>

          {/* Password Field */}
          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.foreground }]}>كلمة المرور</Text>
            <View
              style={[
                s.inputRow,
                {
                  backgroundColor: colors.surface,
                  borderColor: passwordFocused ? "#1B2B5E" : colors.border,
                  borderWidth: passwordFocused ? 1.5 : 1,
                },
              ]}
            >
              <TextInput
                style={[s.inputText, { color: colors.foreground }]}
                placeholder="••••••••••••"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={s.eyeBtn}
              >
                <MaterialIcons
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color={passwordFocused ? "#1B2B5E" : colors.muted}
                />
              </Pressable>
            </View>
          </View>

          {/* Login Button */}
          <Pressable
            style={({ pressed }) => [
              s.loginBtn,
              { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialIcons name="lock-open" size={18} color="#FFFFFF" />
                <Text style={s.loginBtnText}>دخول لوحة الإدارة</Text>
              </View>
            )}
          </Pressable>

          {/* Divider */}
          <View style={[s.divider, { borderColor: colors.border }]} />

          {/* Back Button */}
          <Pressable
            style={({ pressed }) => [
              s.backBtn,
              { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={16} color={colors.muted} />
            <Text style={[s.backBtnText, { color: colors.muted }]}>العودة للتطبيق</Text>
          </Pressable>

          {/* Security Note */}
          <View style={s.securityNote}>
            <MaterialIcons name="security" size={13} color={colors.muted} />
            <Text style={[s.securityNoteText, { color: colors.muted }]}>
              جميع محاولات الدخول مسجلة ومراقبة
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 72,
    paddingBottom: 48,
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0F1C3F",
    overflow: "hidden",
    position: "relative",
  },
  headerCircle1: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(201,168,76,0.06)",
    top: -80,
    right: -80,
  },
  headerCircle2: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -40,
    left: -40,
  },
  logoWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    marginBottom: 4,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  tagline: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "500",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201,168,76,0.15)",
    borderWidth: 1,
    borderColor: "rgba(201,168,76,0.3)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  securityBadgeText: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    padding: 28,
    paddingTop: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "right",
    marginBottom: 4,
  },
  formSub: {
    fontSize: 14,
    textAlign: "right",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#DC2626",
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputText: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    textAlign: "right",
  },
  eyeBtn: {
    padding: 4,
  },
  loginBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 20,
    backgroundColor: "#1B2B5E",
    shadowColor: "#1B2B5E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  divider: {
    borderTopWidth: 1,
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 20,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  securityNoteText: {
    fontSize: 11,
  },
});
