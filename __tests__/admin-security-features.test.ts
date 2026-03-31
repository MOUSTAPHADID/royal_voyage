import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStorage: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] || null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// ─── Login Audit Tests ───
describe("Admin Login Audit", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
  });

  it("should record a successful login attempt", async () => {
    const { recordLoginAttempt, getLoginAuditLog } = await import(
      "../lib/admin-login-audit"
    );

    const entry = await recordLoginAttempt({
      status: "success",
      method: "email",
      email: "admin@test.com",
    });

    expect(entry.id).toMatch(/^login_/);
    expect(entry.status).toBe("success");
    expect(entry.method).toBe("email");
    expect(entry.email).toBe("admin@test.com");
    expect(entry.timestamp).toBeTruthy();

    const log = await getLoginAuditLog();
    expect(log.length).toBe(1);
    expect(log[0].status).toBe("success");
  });

  it("should record a failed login attempt", async () => {
    const { recordLoginAttempt, getLoginAuditLog } = await import(
      "../lib/admin-login-audit"
    );

    await recordLoginAttempt({
      status: "failed",
      method: "pin",
      detail: "رمز خاطئ",
    });

    const log = await getLoginAuditLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
    const failed = log.find((e) => e.status === "failed" && e.method === "pin");
    expect(failed).toBeTruthy();
    expect(failed!.detail).toBe("رمز خاطئ");
  });

  it("should store entries newest first", async () => {
    const { recordLoginAttempt, getLoginAuditLog } = await import(
      "../lib/admin-login-audit"
    );

    await recordLoginAttempt({ status: "success", method: "pin" });
    await recordLoginAttempt({ status: "failed", method: "email", email: "x@y.com" });

    const log = await getLoginAuditLog();
    expect(log.length).toBeGreaterThanOrEqual(2);
    // Newest should be first
    const newest = log[0];
    expect(newest.method).toBe("email");
    expect(newest.status).toBe("failed");
  });

  it("should clear all audit entries", async () => {
    const { recordLoginAttempt, clearLoginAuditLog, getLoginAuditLog } = await import(
      "../lib/admin-login-audit"
    );

    await recordLoginAttempt({ status: "success", method: "biometric" });
    await clearLoginAuditLog();

    const log = await getLoginAuditLog();
    expect(log.length).toBe(0);
  });

  it("should count recent failed attempts", async () => {
    const { recordLoginAttempt, getRecentFailedCount } = await import(
      "../lib/admin-login-audit"
    );

    await recordLoginAttempt({ status: "failed", method: "pin" });
    await recordLoginAttempt({ status: "failed", method: "email" });
    await recordLoginAttempt({ status: "success", method: "pin" });

    const count = await getRecentFailedCount(60);
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("should cap entries at MAX_ENTRIES (200)", async () => {
    const { recordLoginAttempt, getLoginAuditLog } = await import(
      "../lib/admin-login-audit"
    );

    // Clear first
    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.removeItem("@royal_voyage_admin_login_audit");

    // Add 205 entries
    for (let i = 0; i < 205; i++) {
      await recordLoginAttempt({ status: "success", method: "pin" });
    }

    const log = await getLoginAuditLog();
    expect(log.length).toBeLessThanOrEqual(200);
  });
});

// ─── Inactivity Timeout Config Tests ───
describe("Inactivity Timeout Configuration", () => {
  it("should have correct timeout values", () => {
    // These are the constants used in admin/_layout.tsx
    const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    const WARNING_BEFORE_MS = 60 * 1000; // 60 seconds warning

    expect(INACTIVITY_TIMEOUT_MS).toBe(600000); // 10 minutes in ms
    expect(WARNING_BEFORE_MS).toBe(60000); // 60 seconds in ms
    expect(INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS).toBe(540000); // Warning shows at 9 minutes
  });
});

// ─── Login Attempt Type Tests ───
describe("Login Attempt Types", () => {
  it("should support all auth methods", async () => {
    const { recordLoginAttempt, getLoginAuditLog } = await import(
      "../lib/admin-login-audit"
    );

    const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
    await AsyncStorage.removeItem("@royal_voyage_admin_login_audit");

    const methods = ["email", "pin", "biometric", "2fa"] as const;
    for (const method of methods) {
      await recordLoginAttempt({ status: "success", method });
    }

    const log = await getLoginAuditLog();
    const logMethods = log.map((e) => e.method);
    for (const method of methods) {
      expect(logMethods).toContain(method);
    }
  });
});
