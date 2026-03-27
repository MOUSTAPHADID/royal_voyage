/**
 * Admin Security Module
 * Manages admin PIN, lockout, and biometric authentication
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEYS = {
  ADMIN_PIN: "@royal_voyage_admin_pin",
  LOCKOUT_UNTIL: "@royal_voyage_lockout_until",
  FAILED_ATTEMPTS: "@royal_voyage_failed_attempts",
  BIOMETRIC_ENABLED: "@royal_voyage_biometric_admin",
};

const DEFAULT_PIN = "36380112";
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// ─── PIN Management ────────────────────────────────────────

export async function getAdminPin(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    return stored || DEFAULT_PIN;
  } catch {
    return DEFAULT_PIN;
  }
}

export async function setAdminPin(newPin: string): Promise<boolean> {
  try {
    if (newPin.length < 4 || newPin.length > 8) return false;
    await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin);
    return true;
  } catch {
    return false;
  }
}

// ─── Lockout Management ────────────────────────────────────

export async function getFailedAttempts(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function getLockoutUntil(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function isLockedOut(): Promise<{ locked: boolean; remainingSeconds: number }> {
  const lockoutUntil = await getLockoutUntil();
  if (lockoutUntil === 0) return { locked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (now < lockoutUntil) {
    return { locked: true, remainingSeconds: Math.ceil((lockoutUntil - now) / 1000) };
  }

  // Lockout expired — reset
  await AsyncStorage.multiRemove([STORAGE_KEYS.LOCKOUT_UNTIL, STORAGE_KEYS.FAILED_ATTEMPTS]);
  return { locked: false, remainingSeconds: 0 };
}

export async function recordFailedAttempt(): Promise<{ locked: boolean; attemptsLeft: number; lockoutSeconds: number }> {
  const attempts = (await getFailedAttempts()) + 1;
  await AsyncStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, attempts.toString());

  if (attempts >= MAX_ATTEMPTS) {
    const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
    await AsyncStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
    return { locked: true, attemptsLeft: 0, lockoutSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  return { locked: false, attemptsLeft: MAX_ATTEMPTS - attempts, lockoutSeconds: 0 };
}

export async function resetFailedAttempts(): Promise<void> {
  await AsyncStorage.multiRemove([STORAGE_KEYS.FAILED_ATTEMPTS, STORAGE_KEYS.LOCKOUT_UNTIL]);
}

// ─── Biometric Management ──────────────────────────────────

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
    return val === "true";
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, enabled ? "true" : "false");
}

export async function checkBiometricAvailability(): Promise<{
  available: boolean;
  type: "face" | "fingerprint" | "none";
}> {
  if (Platform.OS === "web") return { available: false, type: "none" };

  try {
    const LocalAuth = await import("expo-local-authentication");
    const hasHardware = await LocalAuth.hasHardwareAsync();
    if (!hasHardware) return { available: false, type: "none" };

    const isEnrolled = await LocalAuth.isEnrolledAsync();
    if (!isEnrolled) return { available: false, type: "none" };

    const types = await LocalAuth.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) {
      return { available: true, type: "face" };
    }
    if (types.includes(LocalAuth.AuthenticationType.FINGERPRINT)) {
      return { available: true, type: "fingerprint" };
    }
    return { available: true, type: "fingerprint" }; // fallback
  } catch {
    return { available: false, type: "none" };
  }
}

export async function authenticateWithBiometric(promptMessage: string): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const LocalAuth = await import("expo-local-authentication");
    const result = await LocalAuth.authenticateAsync({
      promptMessage,
      disableDeviceFallback: true,
      cancelLabel: "Cancel",
    });
    return result.success;
  } catch {
    return false;
  }
}

// ─── Validate PIN ──────────────────────────────────────────

export async function validatePin(input: string): Promise<{
  success: boolean;
  locked: boolean;
  attemptsLeft: number;
  lockoutSeconds: number;
}> {
  // Check lockout first
  const lockStatus = await isLockedOut();
  if (lockStatus.locked) {
    return { success: false, locked: true, attemptsLeft: 0, lockoutSeconds: lockStatus.remainingSeconds };
  }

  const correctPin = await getAdminPin();
  if (input === correctPin) {
    await resetFailedAttempts();
    return { success: true, locked: false, attemptsLeft: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  const result = await recordFailedAttempt();
  return { success: false, locked: result.locked, attemptsLeft: result.attemptsLeft, lockoutSeconds: result.lockoutSeconds };
}

export { DEFAULT_PIN, MAX_ATTEMPTS, LOCKOUT_DURATION_MS };
