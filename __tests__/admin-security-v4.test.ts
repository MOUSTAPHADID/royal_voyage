import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock AsyncStorage
const mockStore: Record<string, string> = {};
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStore[key] ?? null)),
    setItem: vi.fn((key: string, val: string) => {
      mockStore[key] = val;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStore[key];
      return Promise.resolve();
    }),
    multiRemove: vi.fn((keys: string[]) => {
      keys.forEach((k) => delete mockStore[k]);
      return Promise.resolve();
    }),
  },
}));

// Mock expo modules
vi.mock("expo-local-authentication", () => ({
  hasHardwareAsync: vi.fn(() => Promise.resolve(false)),
  isEnrolledAsync: vi.fn(() => Promise.resolve(false)),
  authenticateAsync: vi.fn(() => Promise.resolve({ success: false })),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
  supportedAuthenticationTypesAsync: vi.fn(() => Promise.resolve([])),
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn((key: string) => Promise.resolve(mockStore[`secure_${key}`] ?? null)),
  setItemAsync: vi.fn((key: string, val: string) => {
    mockStore[`secure_${key}`] = val;
    return Promise.resolve();
  }),
  deleteItemAsync: vi.fn((key: string) => {
    delete mockStore[`secure_${key}`];
    return Promise.resolve();
  }),
}));

vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

describe("Admin Security - Email/Password Login", () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  });

  it("should have admin-security module with email/password functions", async () => {
    const mod = await import("../lib/admin-security");
    expect(typeof mod.getAdminEmail).toBe("function");
    expect(typeof mod.setAdminEmail).toBe("function");
    expect(typeof mod.getAdminPassword).toBe("function");
    expect(typeof mod.setAdminPassword).toBe("function");
    expect(typeof mod.validateEmailPassword).toBe("function");
  });

  it("should have default admin email as suporte@royalvoyage.online", async () => {
    const { getAdminEmail } = await import("../lib/admin-security");
    const email = await getAdminEmail();
    expect(email).toBe("suporte@royalvoyage.online");
  });

  it("should validate correct email/password", async () => {
    const { validateEmailPassword, getAdminPassword } = await import("../lib/admin-security");
    const defaultPwd = await getAdminPassword();
    const result = await validateEmailPassword("suporte@royalvoyage.online", defaultPwd);
    expect(result.success).toBe(true);
  });

  it("should reject wrong email", async () => {
    const { validateEmailPassword, getAdminPassword } = await import("../lib/admin-security");
    const defaultPwd = await getAdminPassword();
    const result = await validateEmailPassword("wrong@email.com", defaultPwd);
    expect(result.success).toBe(false);
  });

  it("should reject wrong password", async () => {
    const { validateEmailPassword } = await import("../lib/admin-security");
    const result = await validateEmailPassword("suporte@royalvoyage.online", "wrongpassword");
    expect(result.success).toBe(false);
  });

  it("should allow changing admin password", async () => {
    const { setAdminPassword, getAdminPassword } = await import("../lib/admin-security");
    const ok = await setAdminPassword("newSecurePassword123");
    expect(ok).toBe(true);
    const pwd = await getAdminPassword();
    expect(pwd).toBe("newSecurePassword123");
  });
});

describe("Admin Security - Two-Factor Authentication", () => {
  beforeEach(() => {
    Object.keys(mockStore).forEach((k) => delete mockStore[k]);
  });

  it("should have 2FA functions", async () => {
    const mod = await import("../lib/admin-security");
    expect(typeof mod.is2FAEnabled).toBe("function");
    expect(typeof mod.set2FAEnabled).toBe("function");
    expect(typeof mod.generateNew2FASecret).toBe("function");
    expect(typeof mod.generate2FACode).toBe("function");
    expect(typeof mod.validate2FACode).toBe("function");
  });

  it("should have 2FA disabled by default", async () => {
    const { is2FAEnabled } = await import("../lib/admin-security");
    const enabled = await is2FAEnabled();
    expect(enabled).toBe(false);
  });

  it("should generate a 2FA secret", async () => {
    const { generateNew2FASecret } = await import("../lib/admin-security");
    const secret = generateNew2FASecret();
    expect(typeof secret).toBe("string");
    expect(secret.length).toBeGreaterThanOrEqual(8);
  });

  it("should generate a 6-digit code from secret", async () => {
    const { generateNew2FASecret, generate2FACode } = await import("../lib/admin-security");
    const secret = generateNew2FASecret();
    const code = await generate2FACode(secret);
    expect(typeof code).toBe("string");
    expect(code.length).toBe(6);
    expect(/^\d{6}$/.test(code)).toBe(true);
  });

  it("should enable and disable 2FA", async () => {
    const { is2FAEnabled, set2FAEnabled } = await import("../lib/admin-security");
    await set2FAEnabled(true);
    let enabled = await is2FAEnabled();
    expect(enabled).toBe(true);
    await set2FAEnabled(false);
    enabled = await is2FAEnabled();
    expect(enabled).toBe(false);
  });
});

describe("Financial Reports Export", () => {
  it("should have financial-reports screen file", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("/home/ubuntu/royal_voyage/app/admin/financial-reports.tsx");
    expect(exists).toBe(true);
  });

  it("financial-reports should contain export functionality", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/royal_voyage/app/admin/financial-reports.tsx", "utf-8");
    expect(content).toContain("exportPDF");
    expect(content).toContain("exportCSV");
    expect(content).toContain("PDF");
    expect(content).toContain("CSV");
  });
});

describe("Hold 24h Expiry Notifications", () => {
  it("should have scheduleHoldExpiryReminders function", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/royal_voyage/lib/push-notifications.ts", "utf-8");
    expect(content).toContain("scheduleHoldExpiryReminders");
    expect(content).toContain("24");
  });

  it("payment.tsx should reference hold_24h option", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/royal_voyage/app/booking/payment.tsx", "utf-8");
    expect(content).toContain("hold_24h");
    expect(content).toContain("scheduleHoldExpiryReminders");
  });
});

describe("Admin Login Mode Toggle", () => {
  it("profile.tsx should have email login mode", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/royal_voyage/app/(tabs)/profile.tsx", "utf-8");
    expect(content).toContain("loginMode");
    expect(content).toContain("handleEmailPasswordSubmit");
    expect(content).toContain("handle2FASubmit");
    expect(content).toContain("show2FAInput");
  });

  it("admin/index.tsx should have password change and 2FA settings", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("/home/ubuntu/royal_voyage/app/admin/index.tsx", "utf-8");
    expect(content).toContain("showChangePasswordModal");
    expect(content).toContain("handleChangePasswordSubmit");
    expect(content).toContain("show2FASetupModal");
    expect(content).toContain("handleEnable2FA");
    expect(content).toContain("handleDisable2FA");
    expect(content).toContain("twoFAEnabled");
    expect(content).toContain("suporte@royalvoyage.online");
  });
});
