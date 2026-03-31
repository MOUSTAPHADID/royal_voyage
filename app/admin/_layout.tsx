import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Modal,
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
import { recordLoginAttempt } from "@/lib/admin-login-audit";

// ─── Inactivity timeout config ───
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE_MS = 60 * 1000; // Show warning 60s before logout

/**
 * Admin Layout with mandatory authentication gate.
 * No admin screen can be accessed without passing PIN, email/password, or biometric auth.
 * Auto-logout after 10 minutes of inactivity with 60s warning.
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

  // ─── Inactivity auto-logout state ───
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Reset inactivity timer on any user activity
  const resetInactivityTimer = useCallback(() => {
    if (!isAuthenticated) return;
    lastActivityRef.current = Date.now();

    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    setShowInactivityWarning(false);

    // Set new inactivity timer (fires warning at TIMEOUT - 60s)
    inactivityTimerRef.current = setTimeout(() => {
      // Show warning
      setShowInactivityWarning(true);
      setWarningCountdown(60);

      // Start countdown
      warningTimerRef.current = setInterval(() => {
        setWarningCountdown((prev) => {
          if (prev <= 1) {
            // Time's up — auto logout
            if (warningTimerRef.current) clearInterval(warningTimerRef.current);
            handleAutoLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);
  }, [isAuthenticated]);

  const handleAutoLogout = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    setShowInactivityWarning(false);
    setIsAuthenticated(false);
    // Reset form
    setEmail(""); setPassword(""); setPin("");
    setError(""); setShow2FA(false); setTwoFACode(""); setTwoFAError("");
  }, []);

  const handleExtendSession = useCallback(() => {
    setShowInactivityWarning(false);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    resetInactivityTimer();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [resetInactivityTimer]);

  // Start inactivity timer when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [isAuthenticated, resetInactivityTimer]);

  // Track user activity via a periodic check (touch events are handled by wrapping the Stack)
  // We use a simple approach: any navigation or screen interaction resets the timer
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      // This runs every 30s to keep the timer logic alive
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
            await recordLoginAttempt({ status: "success", method: "biometric" });
            setIsAuthenticated(true);
          } else {
            await recordLoginAttempt({ status: "failed", method: "biometric", detail: "فشل التحقق البيومتري" });
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
      await recordLoginAttempt({ status: "success", method: "pin" });
      setIsAuthenticated(true);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await recordLoginAttempt({
        status: "failed",
        method: "pin",
        detail: result.locked ? "تم القفل بعد 3 محاولات" : `متبقي ${result.attemptsLeft} محاولات`,
      });
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
      await recordLoginAttempt({ status: "success", method: "email", email: email.trim() });
      setIsAuthenticated(true);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await recordLoginAttempt({
        status: "failed",
        method: "email",
        email: email.trim(),
        detail: result.locked ? "تم القفل بعد 3 محاولات" : `متبقي ${result.attemptsLeft} محاولات`,
      });
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
      await recordLoginAttempt({ status: "success", method: "2fa" });
      setIsAuthenticated(true);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await recordLoginAttempt({ status: "failed", method: "2fa", detail: "رمز التحقق خاطئ" });
      setTwoFAError("رمز التحقق خاطئ");
      setTwoFACode("");
    }
  };

  const handleBiometricRetry = async () => {
    const success = await authenticateWithBiometric("تحقق للدخول للوحة الإدارة");
    if (success) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await recordLoginAttempt({ status: "success", method: "biometric" });
      setIsAuthenticated(true);
    } else {
      await recordLoginAttempt({ status: "failed", method: "biometric", detail: "فشل التحقق البيومتري" });
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

  // Authenticated - render admin screens with inactivity tracking
  return (
    <Pressable
      style={s.flex1}
      onPress={resetInactivityTimer}
      onLongPress={resetInactivityTimer}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      />

      {/* Inactivity Warning Modal */}
      <Modal
        visible={showInactivityWarning}
        transparent
        animationType="fade"
        onRequestClose={handleExtendSession}
      >
        <View style={s.modalOverlay}>
          <View style={[s.warningCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>⏰</Text>
            <Text style={[s.warningTitle, { color: colors.foreground }]}>
              تحذير عدم النشاط
            </Text>
            <Text style={[s.warningSubtitle, { color: colors.muted }]}>
              سيتم تسجيل خروجك تلقائياً بعد
            </Text>
            <View style={[s.countdownCircle, { borderColor: warningCountdown <= 10 ? colors.error : colors.primary }]}>
              <Text style={[s.countdownText, { color: warningCountdown <= 10 ? colors.error : colors.primary }]}>
                {warningCountdown}
              </Text>
              <Text style={[s.countdownLabel, { color: colors.muted }]}>ثانية</Text>
            </View>

            <View style={s.warningBtnRow}>
              <Pressable
                style={({ pressed }) => [
                  s.warningBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1, flex: 1 },
                ]}
                onPress={handleExtendSession}
              >
                <Text style={s.warningBtnText}>تمديد الجلسة</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  s.warningBtn,
                  { backgroundColor: colors.error, opacity: pressed ? 0.85 : 1, flex: 1 },
                ]}
                onPress={handleAutoLogout}
              >
                <Text style={s.warningBtnText}>تسجيل خروج</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Pressable>
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
  // Inactivity warning modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  warningCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  warningSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  countdownCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: "900",
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: -2,
  },
  warningBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  warningBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  warningBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
