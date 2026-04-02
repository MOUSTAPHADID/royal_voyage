import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import { useApp } from "@/lib/app-context";
import { useTranslation } from "@/lib/i18n";
import { registerForPushNotifications } from "@/lib/push-notifications";

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const { login, loginWithPhone, loginAsGuest, sendVerificationCode, verifyCode, saveExpoPushToken, saveAdminPushToken } = useApp();
  const { t } = useTranslation();

  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"phone" | "email">("phone");
  // Verification code flow
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");

  const isPhoneInput = (text: string) => /^[+\d]/.test(text) && !text.includes("@");

  const handlePhoneLogin = async () => {
    const phone = phoneOrEmail.trim();
    if (!phone) {
      setError(t.auth.phoneRequired);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await sendVerificationCode(phone);
      setPendingPhone(phone);
      setShowVerification(true);
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim() || verificationCode.length < 4) {
      setError(t.auth.codeInvalid);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const valid = await verifyCode(pendingPhone, verificationCode.trim());
      if (valid) {
        const result = await loginWithPhone(pendingPhone);
        if (result === "user") {
          registerForPushNotifications()
            .then((token) => { if (token) saveExpoPushToken(token); })
            .catch(() => {});
          router.replace("/(tabs)" as any);
        }
      } else {
        setError(t.auth.codeInvalid);
      }
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    try {
      await sendVerificationCode(pendingPhone);
      setError(t.auth.codeSent);
    } catch {}
  };

  const handleEmailLogin = async () => {
    if (!phoneOrEmail.trim() || !password.trim()) {
      setError(t.auth.enterPhoneOrEmail);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const result = await login(phoneOrEmail.trim(), password);
      if (result === "admin") {
        registerForPushNotifications()
          .then((token) => { if (token) saveAdminPushToken(token); })
          .catch(() => {});
        router.replace("/admin" as any);
      } else if (result === "user") {
        registerForPushNotifications()
          .then((token) => { if (token) saveExpoPushToken(token); })
          .catch(() => {});
        router.replace("/(tabs)" as any);
      } else {
        setError(t.auth.codeInvalid);
      }
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginAsGuest();
      router.replace("/(tabs)" as any);
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  // Verification code screen
  if (showVerification) {
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
          <View style={[styles.header, { backgroundColor: colors.primary }]}>
            <Pressable
              style={styles.backBtn}
              onPress={() => { setShowVerification(false); setVerificationCode(""); setError(""); }}
            >
              <Text style={styles.backBtnText}>←</Text>
            </Pressable>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logoSmall}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>{t.auth.verificationCode}</Text>
            <Text style={styles.headerSub}>{t.auth.codeSent}</Text>
            <Text style={styles.headerPhone}>{pendingPhone}</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
            {error ? (
              <View style={[styles.errorBox, { backgroundColor: error === t.auth.codeSent ? colors.success + "15" : colors.error + "15", borderColor: error === t.auth.codeSent ? colors.success + "40" : colors.error + "40" }]}>
                <Text style={[styles.errorText, { color: error === t.auth.codeSent ? colors.success : colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Text style={[styles.codeLabel, { color: colors.foreground }]}>{t.auth.enterCode}</Text>
            <View style={styles.codeInputRow}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: verificationCode.length === i ? colors.primary : colors.border }]}>
                  <Text style={[styles.codeDigit, { color: colors.foreground }]}>{verificationCode[i] || ""}</Text>
                </View>
              ))}
            </View>
            <TextInput
              style={styles.hiddenInput}
              value={verificationCode}
              onChangeText={(t) => { if (t.length <= 4) setVerificationCode(t); }}
              keyboardType="number-pad"
              autoFocus
              maxLength={4}
            />

            <Pressable
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleVerifyCode}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryBtnText}>{t.auth.verify}</Text>
              )}
            </Pressable>

            <Pressable style={styles.resendBtn} onPress={handleResendCode}>
              <Text style={[styles.resendText, { color: colors.primary }]}>{t.auth.resendCode}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Royal Voyage</Text>
          <Text style={styles.tagline}>{t.auth.welcomeBack}</Text>
        </View>

        {/* Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
          {/* Mode Tabs */}
          <View style={[styles.modeTabs, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              style={[styles.modeTab, mode === "phone" && { backgroundColor: colors.primary }]}
              onPress={() => { setMode("phone"); setError(""); }}
            >
              <Text style={[styles.modeTabText, { color: mode === "phone" ? "#FFF" : colors.muted }]}>
                {t.auth.phone}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === "email" && { backgroundColor: colors.primary }]}
              onPress={() => { setMode("email"); setError(""); }}
            >
              <Text style={[styles.modeTabText, { color: mode === "email" ? "#FFF" : colors.muted }]}>
                {t.auth.email}
              </Text>
            </Pressable>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          {mode === "phone" ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>{t.auth.phone}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder={t.auth.phonePlaceholder}
                  placeholderTextColor={colors.muted}
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                  keyboardType="phone-pad"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handlePhoneLogin}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                onPress={handlePhoneLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t.auth.signIn}</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>{t.auth.email}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  value={phoneOrEmail}
                  onChangeText={setPhoneOrEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>{t.auth.password}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={handleEmailLogin}
                />
              </View>

              <Pressable
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                onPress={handleEmailLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>{t.auth.signIn}</Text>
                )}
              </Pressable>
            </>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.muted }]}>{t.auth.orContinueWith}</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Guest Button */}
          <Pressable
            style={({ pressed }) => [styles.guestBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
            onPress={handleGuestLogin}
          >
            <Text style={[styles.guestBtnText, { color: colors.foreground }]}>{t.auth.continueAsGuest}</Text>
          </Pressable>
          <Text style={[styles.guestNote, { color: colors.muted }]}>{t.auth.guestNote}</Text>

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.muted }]}>
              {t.auth.noAccount}{" "}
            </Text>
            <Pressable onPress={() => router.push("/auth/register" as any)}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>{t.auth.signUp}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 70,
    paddingBottom: 40,
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  logoSmall: {
    width: 56,
    height: 56,
    borderRadius: 14,
    marginBottom: 4,
  },
  appName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tagline: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
  },
  headerPhone: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  backBtnText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    padding: 28,
    paddingTop: 28,
  },
  modeTabs: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  errorBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  primaryBtn: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  guestBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 8,
  },
  guestBtnText: {
    fontSize: 16,
    fontWeight: "600",
  },
  guestNote: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 24,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 15,
  },
  registerLink: {
    fontSize: 15,
    fontWeight: "700",
  },
  // Verification code styles
  codeLabel: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
  codeInputRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 8,
  },
  codeBox: {
    width: 56,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  codeDigit: {
    fontSize: 28,
    fontWeight: "700",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 0,
    width: 0,
  },
  resendBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
