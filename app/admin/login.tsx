import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAdmin } from "@/lib/admin-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { trpc } from "@/lib/trpc";

const t = {
  ar: {
    title: "Royal Voyage",
    subtitle: "لوحة الإدارة",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    login: "تسجيل الدخول",
    logging: "جاري الدخول...",
    emailPlaceholder: "admin@royalvoyage.com",
    passwordPlaceholder: "••••••••",
    error: "خطأ في تسجيل الدخول",
    switchLang: "Français",
  },
  fr: {
    title: "Royal Voyage",
    subtitle: "Panneau d'Administration",
    email: "Adresse e-mail",
    password: "Mot de passe",
    login: "Se connecter",
    logging: "Connexion en cours...",
    emailPlaceholder: "admin@royalvoyage.com",
    passwordPlaceholder: "••••••••",
    error: "Erreur de connexion",
    switchLang: "العربية",
  },
};

export default function LoginScreen() {
  const colors = useColors();
  const router = useRouter();
  const { loginEmployee, language, setLanguage } = useAdmin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const lang = t[language];
  const isRTL = language === "ar";

  const addLogMutation = trpc.loginLogs.add.useMutation();

  const loginMutation = trpc.employees.verifyLogin.useMutation({
    onSuccess: async (data) => {
      if (data.success && data.employee) {
        addLogMutation.mutate({
          identifier: email.trim().toLowerCase(),
          accountType: "employee",
          success: true,
          userAgent: `RoyalVoyageAdmin/1.0 (${Platform.OS})`,
        });
        await loginEmployee({
          id: data.employee.id,
          name: data.employee.fullName,
          email: data.employee.email,
          role: data.employee.role,
          token: `emp_${data.employee.id}_${Date.now()}`,
        });
        router.replace("/(tabs)");
      } else {
        addLogMutation.mutate({
          identifier: email.trim().toLowerCase(),
          accountType: "employee",
          success: false,
          failureReason: (data as any).error || "Invalid credentials",
          userAgent: `RoyalVoyageAdmin/1.0 (${Platform.OS})`,
        });
        setError((data as any).error || lang.error);
      }
    },
    onError: (err) => {
      addLogMutation.mutate({
        identifier: email.trim().toLowerCase(),
        accountType: "employee",
        success: false,
        failureReason: err.message || "Network error",
        userAgent: `RoyalVoyageAdmin/1.0 (${Platform.OS})`,
      });
      setError(lang.error);
    },
  });

  const handleLogin = () => {
    if (!email.trim() || !password.trim()) return;
    setError("");
    loginMutation.mutate({ email: email.trim().toLowerCase(), password });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Language Toggle */}
        <TouchableOpacity
          style={[styles.langBtn, { borderColor: colors.border }]}
          onPress={() => setLanguage(language === "ar" ? "fr" : "ar")}
        >
          <Text style={[styles.langText, { color: colors.primary }]}>{lang.switchLang}</Text>
        </TouchableOpacity>

        {/* Logo Area */}
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>RV</Text>
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>{lang.title}</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>{lang.subtitle}</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {lang.email}
            </Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <IconSymbol name="person.fill" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                placeholder={lang.emailPlaceholder}
                placeholderTextColor={colors.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}>
              {lang.password}
            </Text>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <IconSymbol name="gear" size={18} color={colors.muted} />
              <TextInput
                style={[styles.input, { color: colors.foreground, textAlign: isRTL ? "right" : "left" }]}
                placeholder={lang.passwordPlaceholder}
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <IconSymbol name={showPassword ? "xmark.circle.fill" : "checkmark.circle.fill"} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: loginMutation.isPending ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            activeOpacity={0.85}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>{lang.login}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.muted }]}>
          Royal Voyage Admin © 2025
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  langBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  langText: { fontSize: 13, fontWeight: "600" },
  logoArea: { alignItems: "center", marginBottom: 32 },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { fontSize: 14, marginTop: 4 },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { fontSize: 13, flex: 1 },
  loginBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  footer: { textAlign: "center", fontSize: 12, marginTop: 32 },
});
