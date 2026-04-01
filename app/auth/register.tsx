import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
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

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const { register, sendVerificationCode, verifyCode, saveExpoPushToken } = useApp();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Verification step
  const [step, setStep] = useState<"form" | "verify">("form");
  const [code, setCode] = useState("");

  const handleSendCode = async () => {
    if (!name.trim()) {
      setError(t.auth.nameRequired);
      return;
    }
    if (!phone.trim()) {
      setError(t.auth.phoneRequired);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await sendVerificationCode(phone.trim());
      setStep("verify");
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim() || code.length < 4) {
      setError(t.auth.codeInvalid);
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const valid = await verifyCode(phone.trim(), code.trim());
      if (valid) {
        const success = await register(name.trim(), phone.trim(), email.trim() || undefined);
        if (success) {
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

  const handleResend = async () => {
    setError("");
    try {
      await sendVerificationCode(phone.trim());
      setError(t.auth.codeSent);
    } catch {}
  };

  if (step === "verify") {
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
            <Pressable style={styles.backButton} onPress={() => { setStep("form"); setCode(""); setError(""); }}>
              <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>←</Text>
            </Pressable>
            <Text style={styles.headerTitle}>{t.auth.verificationCode}</Text>
            <Text style={styles.headerSubtitle}>{t.auth.codeSent}</Text>
            <Text style={styles.phoneDisplay}>{phone}</Text>
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
                <View key={i} style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: code.length === i ? colors.primary : colors.border }]}>
                  <Text style={[styles.codeDigit, { color: colors.foreground }]}>{code[i] || ""}</Text>
                </View>
              ))}
            </View>
            <TextInput
              style={styles.hiddenInput}
              value={code}
              onChangeText={(t) => { if (t.length <= 4) setCode(t); }}
              keyboardType="number-pad"
              autoFocus
              maxLength={4}
            />

            <Pressable
              style={({ pressed }) => [styles.registerButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleVerify}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.registerButtonText}>{t.auth.verify}</Text>
              )}
            </Pressable>

            <Pressable style={styles.resendBtn} onPress={handleResend}>
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}>← {t.back}</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{t.auth.createAccount}</Text>
          <Text style={styles.headerSubtitle}>Royal Voyage</Text>
        </View>

        {/* Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.background }]}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + "15", borderColor: colors.error + "40" }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>{t.auth.fullName} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder={t.auth.fullName}
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.foreground }]}>{t.auth.phone} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder={t.auth.phonePlaceholder}
              placeholderTextColor={colors.muted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.muted }]}>{t.auth.emailOptional}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>

          <Pressable
            style={({ pressed }) => [styles.registerButton, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSendCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.registerButtonText}>{t.auth.signUp}</Text>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={[styles.loginText, { color: colors.muted }]}>
              {t.auth.hasAccount}{" "}
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>{t.auth.signIn}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 36,
    paddingHorizontal: 24,
    gap: 8,
  },
  backButton: {
    marginBottom: 12,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
  },
  phoneDisplay: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 1,
  },
  formContainer: {
    flex: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    padding: 28,
    paddingTop: 32,
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
  registerButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
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
