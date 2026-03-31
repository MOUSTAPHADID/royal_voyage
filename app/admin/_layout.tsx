import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

// ─── Inactivity timeout config ───
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const WARNING_BEFORE_MS = 60 * 1000; // Show warning 60s before logout

/**
 * Admin Layout — direct access (no authentication gate).
 * Auto-logout after 10 minutes of inactivity with 60s warning.
 */
export default function AdminLayout() {
  const colors = require("@/hooks/use-colors").useColors();
  const router = useRouter();

  // ─── Inactivity auto-logout state ───
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const [loggedOut, setLoggedOut] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastActivityRef = useRef(Date.now());

  // Reset inactivity timer on any user activity
  const resetInactivityTimer = useCallback(() => {
    if (loggedOut) return;
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
  }, [loggedOut]);

  const handleAutoLogout = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    setShowInactivityWarning(false);
    setLoggedOut(true);
    router.back();
  }, [router]);

  const handleExtendSession = useCallback(() => {
    setShowInactivityWarning(false);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    resetInactivityTimer();
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [resetInactivityTimer]);

  // Start inactivity timer on mount
  useEffect(() => {
    if (!loggedOut) {
      resetInactivityTimer();
    }
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearInterval(warningTimerRef.current);
    };
  }, [loggedOut, resetInactivityTimer]);

  // Render admin screens directly with inactivity tracking
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
