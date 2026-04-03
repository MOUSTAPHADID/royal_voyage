/**
 * Admin Security Module
 * Manages admin credentials (email/password), lockout, biometric, password change, and 2FA
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEYS = {
  ADMIN_EMAIL: "@royal_voyage_admin_email",
  ADMIN_PASSWORD: "@royal_voyage_admin_password",
  LOCKOUT_UNTIL: "@royal_voyage_lockout_until",
  FAILED_ATTEMPTS: "@royal_voyage_failed_attempts",
  BIOMETRIC_ENABLED: "@royal_voyage_biometric_admin",
  TWO_FA_ENABLED: "@royal_voyage_2fa_enabled",
  TWO_FA_SECRET: "@royal_voyage_2fa_secret",
};

// Default credentials
// NOTE: Change this password immediately after first login via Admin > Settings > Security
const DEFAULT_EMAIL = "suporte@royalvoyage.online";
// Password stored as-is but only in AsyncStorage on device — never sent to any server
// First-run password: see admin setup guide or contact suporte@royalvoyage.online
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "Didi3307@@@@"; // Set via ADMIN_PASSWORD env var
const MAX_ATTEMPTS = 5; // increased from 3 to reduce false lockouts
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// ─── Email/Password Management ────────────────────────────────

export async function getAdminEmail(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_EMAIL);
    return stored || DEFAULT_EMAIL;
  } catch {
    return DEFAULT_EMAIL;
  }
}

export async function setAdminEmail(email: string): Promise<boolean> {
  try {
    if (!email.includes("@")) return false;
    await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_EMAIL, email);
    return true;
  } catch {
    return false;
  }
}

export async function getAdminPassword(): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
    return stored || DEFAULT_PASSWORD;
  } catch {
    return DEFAULT_PASSWORD;
  }
}

export async function setAdminPassword(newPassword: string): Promise<boolean> {
  try {
    if (newPassword.length < 6) return false;
    await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword);
    return true;
  } catch {
    return false;
  }
}

export async function validateEmailPassword(
  email: string,
  password: string
): Promise<{
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

  const correctEmail = await getAdminEmail();
  const correctPassword = await getAdminPassword();

  if (email.toLowerCase().trim() === correctEmail.toLowerCase().trim() && password === correctPassword) {
    await resetFailedAttempts();
    return { success: true, locked: false, attemptsLeft: MAX_ATTEMPTS, lockoutSeconds: 0 };
  }

  const result = await recordFailedAttempt();
  return { success: false, locked: result.locked, attemptsLeft: result.attemptsLeft, lockoutSeconds: result.lockoutSeconds };
}

// ─── Lockout Managementment ────────────────────────────────────

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

// ─── 2FA (TOTP-like) Management ──────────────────────────────

export async function is2FAEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.TWO_FA_ENABLED);
    return val === "true";
  } catch {
    return false;
  }
}

export async function set2FAEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TWO_FA_ENABLED, enabled ? "true" : "false");
  if (!enabled) {
    await AsyncStorage.removeItem(STORAGE_KEYS.TWO_FA_SECRET);
  }
}

export async function get2FASecret(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.TWO_FA_SECRET);
  } catch {
    return null;
  }
}

export async function set2FASecret(secret: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TWO_FA_SECRET, secret);
}

/**
 * Generate a simple 6-digit code based on the secret and current time window (30s).
 * This is a simplified TOTP for local use.
 */
export function generate2FACode(secret: string): string {
  const timeStep = Math.floor(Date.now() / 30000);
  let hash = 0;
  const combined = secret + timeStep.toString();
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const code = Math.abs(hash % 1000000);
  return code.toString().padStart(6, "0");
}

/**
 * Validate a 2FA code against the current and previous time windows.
 */
export async function validate2FACode(inputCode: string): Promise<boolean> {
  const secret = await get2FASecret();
  if (!secret) return false;

  // Check current and previous time window (allows 30s drift)
  const currentCode = generate2FACode(secret);
  const timeStep = Math.floor(Date.now() / 30000);
  const prevSecret = secret + (timeStep - 1).toString();
  let prevHash = 0;
  for (let i = 0; i < prevSecret.length; i++) {
    const char = prevSecret.charCodeAt(i);
    prevHash = ((prevHash << 5) - prevHash) + char;
    prevHash = prevHash & prevHash;
  }
  const prevCode = Math.abs(prevHash % 1000000).toString().padStart(6, "0");

  return inputCode === currentCode || inputCode === prevCode;
}

/**
 * Generate a random secret for 2FA setup.
 */
export function generateNew2FASecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 16; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

export { DEFAULT_EMAIL, DEFAULT_PASSWORD, MAX_ATTEMPTS, LOCKOUT_DURATION_MS };
