import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  validatePin,
  validateEmailPassword,
  isLockedOut,
  checkBiometricAvailability,
  isBiometricEnabled,
  authenticateWithBiometric,
  is2FAEnabled,
  validate2FACode,
} from "@/lib/admin-security";

/**
 * Admin Layout with mandatory authentication gate.
 * No admin screen can be accessed without passing PIN, email/password, or biometric auth.
 */
export default function AdminLayout() {
  const colors = useColors();
  const router = useRouter();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Login form state
  const [loginMode, setLoginMode] = useState<"email" | "pin">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 2FA state
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFAError, setTwoFAError] = useState("");

  // Biometric state
  const [biometricType, setBiometricType] = useState<"face" | "fingerprint" | "none">("none");
  const [biometricReady, setBiometricReady] = useState(false);

  // Check biometric on mount and try auto-auth
  useEffect(() => {
    (async () => {
      const { available, type } = await checkBiometricAvailability();
      setBiometricType(type);
      if (available) {
        const enabled = await isBiometricEnabled();
        setBiometricReady(enabled);
        if (enabled) {
          const success = await authenticateWithBiometric("تحقق للدخول للوحة الإدارة");
          if (success) {
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsAuthenticated(true);
          }
        }
      }
      setIsChecking(false);
    })();
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (lockoutTimer > 0) {
      lockoutRef.current = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            if (lockoutRef.current) clearInterval(lockoutRef.current);
            setError("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (lockoutRef.current) clearInterval(lockoutRef.current);
      };
    }
  }, [lockoutTimer]);

  // Check lockout on mount
  useEffect(() => {
    isLockedOut().then(({ locked, remainingSeconds }) => {
      if (locked) {
        setLockoutTimer(remainingSeconds);
        setError(`تم القفل. انتظر ${Math.ceil(remainingSeconds / 60)} دقيقة`);
      }
    });
  }, []);

  const handlePinSubmit = async () => {
    if (lockoutTimer > 0 || !pin.trim()) return;
    const result = await validatePin(pin);
    if (result.success) {
      // Check 2FA
      const has2FA = await is2FAEnabled();
      if (has2FA) {
        setShow2FA(true);
        setTwoFACode("");
        setTwoFAError("");
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPin("");
      if (result.locked) {
        setLockoutTimer(result.lockoutSeconds);
        setError(`3 محاولات خاطئة. تم القفل لمدة ${Math.ceil(result.lockoutSeconds / 60)} دقائق`);
      } else {
        setError(`رمز خاطئ. متبقي ${result.attemptsLeft} محاولات`);
      }
    }
  };

  const handleEmailSubmit = async () => {
    if (lockoutTimer > 0 || !email.trim() || !password.trim()) return;
    const result = await validateEmailPassword(email, password);
    if (result.success) {
      // Check 2FA
      const has2FA = await is2FAEnabled();
      if (has2FA) {
        setShow2FA(true);
        setTwoFACode("");
        setTwoFAError("");
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPassword("");
      if (result.locked) {
        setLockoutTimer(result.lockoutSeconds);
        setError(`3 محاولات خاطئة. تم القفل لمدة ${Math.ceil(result.lockoutSeconds / 60)} دقائق`);
      } else {
        setError(`بيانات خاطئة. متبقي ${result.attemptsLeft} محاولات`);
      }
    }
  };

  const handle2FASubmit = async () => {
    if (!twoFACode.trim()) return;
    const valid = await validate2FACode(twoFACode);
    if (valid) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTwoFAError("رمز التحقق خاطئ");
      setTwoFACode("");
    }
  };

  const handleBiometricRetry = async () => {
    const success = await authenticateWithBiometric("تحقق للدخول للوحة الإدارة");
    if (success) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsAuthenticated(true);
    }
  };

  // Loading state
  if (isChecking) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  // Auth gate - show login screen
  if (!isAuthenticated) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]}>
        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={s.center}>
            {/* Header */}
            <View style={s.headerBox}>
              <Text style={[s.lockIcon]}>🔒</Text>
              <Text style={[s.title, { color: colors.foreground }]}>لوحة الإدارة</Text>
              <Text style={[s.subtitle, { color: colors.muted }]}>
                أدخل بيانات الاعتماد للمتابعة
              </Text>
            </View>

            {/* 2FA Screen */}
            {show2FA ? (
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.label, { color: colors.foreground }]}>رمز التحقق (2FA)</Text>
                <TextInput
                  style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                  placeholderTextColor={colors.muted}
                  value={twoFACode}
                  onChangeText={setTwoFACode}
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                  returnKeyType="done"
                  onSubmitEditing={handle2FASubmit}
                />
                {twoFAError ? <Text style={[s.error, { color: colors.error }]}>{twoFAError}</Text> : null}
                <Pressable
                  style={({ pressed }) => [s.btn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
                  onPress={handle2FASubmit}
                >
                  <Text style={s.btnText}>تحقق</Text>
                </Pressable>
              </View>
            ) : (
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Mode toggle */}
                <View style={s.modeRow}>
                  <Pressable
                    style={[s.modeBtn, loginMode === "email" && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
                    onPress={() => { setLoginMode("email"); setError(""); }}
                  >
                    <Text style={[s.modeBtnText, { color: loginMode === "email" ? colors.primary : colors.muted }]}>
                      البريد وكلمة المرور
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[s.modeBtn, loginMode === "pin" && { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}
                    onPress={() => { setLoginMode("pin"); setError(""); }}
                  >
                    <Text style={[s.modeBtnText, { color: loginMode === "pin" ? colors.primary : colors.muted }]}>
                      رمز PIN
                    </Text>
                  </Pressable>
                </View>

                {loginMode === "email" ? (
                  <>
                    <Text style={[s.label, { color: colors.foreground }]}>البريد الإلكتروني</Text>
                    <TextInput
                      style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="admin@example.com"
                      placeholderTextColor={colors.muted}
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={[s.label, { color: colors.foreground, marginTop: 12 }]}>كلمة المرور</Text>
                    <TextInput
                      style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.muted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={handleEmailSubmit}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        s.btn,
                        { backgroundColor: lockoutTimer > 0 ? colors.muted : colors.primary, opacity: pressed ? 0.85 : 1 },
                      ]}
                      onPress={handleEmailSubmit}
                      disabled={lockoutTimer > 0}
                    >
                      <Text style={s.btnText}>
                        {lockoutTimer > 0 ? `مقفل (${lockoutTimer}ث)` : "دخول"}
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={[s.label, { color: colors.foreground }]}>رمز PIN</Text>
                    <TextInput
                      style={[s.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background, letterSpacing: 8, fontSize: 24, textAlign: "center" }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.muted}
                      value={pin}
                      onChangeText={setPin}
                      keyboardType="number-pad"
                      maxLength={8}
                      secureTextEntry
                      returnKeyType="done"
                      onSubmitEditing={handlePinSubmit}
                    />
                    <Pressable
                      style={({ pressed }) => [
                        s.btn,
                        { backgroundColor: lockoutTimer > 0 ? colors.muted : colors.primary, opacity: pressed ? 0.85 : 1 },
                      ]}
                      onPress={handlePinSubmit}
                      disabled={lockoutTimer > 0}
                    >
                      <Text style={s.btnText}>
                        {lockoutTimer > 0 ? `مقفل (${lockoutTimer}ث)` : "دخول"}
                      </Text>
                    </Pressable>
                  </>
                )}

                {/* Error message */}
                {error ? <Text style={[s.error, { color: colors.error }]}>{error}</Text> : null}

                {/* Biometric button */}
                {biometricReady && biometricType !== "none" && (
                  <Pressable
                    style={({ pressed }) => [s.bioBtn, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
                    onPress={handleBiometricRetry}
                  >
                    <Text style={{ fontSize: 24 }}>
                      {biometricType === "face" ? "🪪" : "👆"}
                    </Text>
                    <Text style={[s.bioBtnText, { color: colors.primary }]}>
                      {biometricType === "face" ? "الدخول بالوجه" : "الدخول بالبصمة"}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Back button */}
            <Pressable
              style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.6 : 1 }]}
              onPress={() => router.back()}
            >
              <Text style={[s.backBtnText, { color: colors.muted }]}>← رجوع</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  // Authenticated - render admin screens
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    />
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  headerBox: {
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  lockIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 4,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
  },
  modeBtnText: {
    fontSize: 13,
    fontWeight: "700",
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
  btn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  bioBtn: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  bioBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  backBtn: {
    marginTop: 24,
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
