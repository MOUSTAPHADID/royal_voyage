/**
 * Admin Login Audit — Local storage for admin login attempt history.
 * Records every login attempt (success/failure) with timestamp and auth method.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export type LoginAttemptStatus = "success" | "failed";
export type LoginAuthMethod = "email" | "pin" | "biometric" | "2fa";

export type LoginAttempt = {
  id: string;
  status: LoginAttemptStatus;
  method: LoginAuthMethod;
  email?: string;
  timestamp: string;
  /** Human-readable detail, e.g. "locked out", "wrong password" */
  detail?: string;
};

const STORAGE_KEY = "@royal_voyage_admin_login_audit";
const MAX_ENTRIES = 200;

/**
 * Get all login attempts from storage (newest first).
 */
export async function getLoginAuditLog(): Promise<LoginAttempt[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as LoginAttempt[];
  } catch {
    return [];
  }
}

/**
 * Record a login attempt.
 */
export async function recordLoginAttempt(
  attempt: Omit<LoginAttempt, "id" | "timestamp">
): Promise<LoginAttempt> {
  const existing = await getLoginAuditLog();
  const entry: LoginAttempt = {
    ...attempt,
    id: `login_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return entry;
}

/**
 * Clear all login audit entries.
 */
export async function clearLoginAuditLog(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Get count of failed attempts in the last N minutes.
 */
export async function getRecentFailedCount(minutes: number = 60): Promise<number> {
  const log = await getLoginAuditLog();
  const cutoff = Date.now() - minutes * 60 * 1000;
  return log.filter(
    (e) => e.status === "failed" && new Date(e.timestamp).getTime() > cutoff
  ).length;
}
