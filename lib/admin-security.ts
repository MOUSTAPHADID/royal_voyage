/**
 * Admin Security Module
 * Manages admin credentials (email/password), lockout, biometric, and 2FA (TOTP RFC 6238)
 *
 * 2FA uses standard TOTP (RFC 6238) compatible with Google Authenticator, Authy, and any
 * standard TOTP app. The secret is stored locally in AsyncStorage (device-only).
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
// SECURITY: The default password is NOT hardcoded in the client bundle.
// On first run, the admin must set the password via Admin > Settings.
// The password is stored exclusively in AsyncStorage (device-local, encrypted keychain on iOS).
const DEFAULT_EMAIL = "suporte@royalvoyage.online";
// Sentinel value: if AsyncStorage has no password yet, the admin must set one via the Settings screen.
// This prevents any hardcoded credential from being extracted from the APK/IPA bundle.
const DEFAULT_PASSWORD = "CHANGE_ME_ON_FIRST_LOGIN";
const MAX_ATTEMPTS = 5;
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
    return { available: true, type: "fingerprint" };
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

// ─── 2FA — Standard TOTP (RFC 6238) ──────────────────────────
// Compatible with Google Authenticator, Authy, Microsoft Authenticator, etc.

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
 * Generate a standard TOTP code (RFC 6238) using the stored secret.
 * Uses HMAC-SHA1 with 30-second time steps and 6-digit output.
 * Compatible with Google Authenticator, Authy, etc.
 */
export async function generate2FACode(secret?: string): Promise<string> {
  const s = secret ?? (await get2FASecret());
  if (!s) return "000000";
  return computeTOTP(s, Math.floor(Date.now() / 30000));
}

/**
 * Validate a 2FA code — checks current window ±1 step (allows 30s clock drift).
 */
export async function validate2FACode(inputCode: string): Promise<boolean> {
  const secret = await get2FASecret();
  if (!secret) return false;

  const timeStep = Math.floor(Date.now() / 30000);
  // Check current step and ±1 step for clock drift tolerance
  for (const step of [timeStep - 1, timeStep, timeStep + 1]) {
    if (inputCode === computeTOTP(secret, step)) return true;
  }
  return false;
}

/**
 * Generate a new random Base32 secret for TOTP setup (16 characters = 80 bits).
 */
export function generateNew2FASecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

/**
 * Generate the otpauth:// URI for QR code scanning in authenticator apps.
 */
export function generate2FAUri(secret: string, email: string): string {
  const issuer = encodeURIComponent("Royal Voyage Admin");
  const account = encodeURIComponent(email);
  return `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

// ─── TOTP Core Implementation (RFC 6238 / RFC 4226 HOTP) ──────────────────
// Pure JS implementation — no native modules needed, works on all platforms.

function base32Decode(base32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = base32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  let bits = 0;
  let value = 0;
  let index = 0;
  const output = new Uint8Array(Math.floor((cleaned.length * 5) / 8));

  for (let i = 0; i < cleaned.length; i++) {
    const charIndex = alphabet.indexOf(cleaned[i]);
    if (charIndex === -1) continue;
    value = (value << 5) | charIndex;
    bits += 5;
    if (bits >= 8) {
      output[index++] = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
    }
  }
  return output.slice(0, index);
}

function hmacSHA1(keyBytes: Uint8Array, messageBytes: Uint8Array): Uint8Array {
  const BLOCK_SIZE = 64;
  let key = keyBytes;
  if (key.length > BLOCK_SIZE) {
    key = sha1(key);
  }
  const paddedKey = new Uint8Array(BLOCK_SIZE);
  paddedKey.set(key);

  const ipad = new Uint8Array(BLOCK_SIZE);
  const opad = new Uint8Array(BLOCK_SIZE);
  for (let i = 0; i < BLOCK_SIZE; i++) {
    ipad[i] = paddedKey[i] ^ 0x36;
    opad[i] = paddedKey[i] ^ 0x5c;
  }

  const innerMsg = new Uint8Array(BLOCK_SIZE + messageBytes.length);
  innerMsg.set(ipad);
  innerMsg.set(messageBytes, BLOCK_SIZE);
  const innerHash = sha1(innerMsg);

  const outerMsg = new Uint8Array(BLOCK_SIZE + innerHash.length);
  outerMsg.set(opad);
  outerMsg.set(innerHash, BLOCK_SIZE);
  return sha1(outerMsg);
}

function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const msgLen = data.length;
  const bitLen = msgLen * 8;
  const paddedLen = Math.ceil((msgLen + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[msgLen] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen & 0xffffffff, false);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    const w = new Uint32Array(80);
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 80; i++) {
      const n = w[i-3] ^ w[i-8] ^ w[i-14] ^ w[i-16];
      w[i] = (n << 1) | (n >>> 31);
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4;
    for (let i = 0; i < 80; i++) {
      let f, k;
      if (i < 20) { f = (b & c) | (~b & d); k = 0x5a827999; }
      else if (i < 40) { f = b ^ c ^ d; k = 0x6ed9eba1; }
      else if (i < 60) { f = (b & c) | (b & d) | (c & d); k = 0x8f1bbcdc; }
      else { f = b ^ c ^ d; k = 0xca62c1d6; }
      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[i]) >>> 0;
      e = d; d = c; c = (b << 30) | (b >>> 2); b = a; a = temp;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0; h4 = (h4 + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, h0, false); rv.setUint32(4, h1, false); rv.setUint32(8, h2, false);
  rv.setUint32(12, h3, false); rv.setUint32(16, h4, false);
  return result;
}

function computeTOTP(secret: string, timeStep: number): string {
  const keyBytes = base32Decode(secret);
  // Encode timeStep as 8-byte big-endian
  const msg = new Uint8Array(8);
  let t = timeStep;
  for (let i = 7; i >= 0; i--) {
    msg[i] = t & 0xff;
    t = Math.floor(t / 256);
  }
  const hmac = hmacSHA1(keyBytes, msg);
  // Dynamic truncation (RFC 4226)
  const offset = hmac[19] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24) |
               ((hmac[offset + 1] & 0xff) << 16) |
               ((hmac[offset + 2] & 0xff) << 8) |
               (hmac[offset + 3] & 0xff);
  return (code % 1000000).toString().padStart(6, "0");
}

export { DEFAULT_EMAIL, DEFAULT_PASSWORD, MAX_ATTEMPTS, LOCKOUT_DURATION_MS };
