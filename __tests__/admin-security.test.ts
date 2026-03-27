import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

describe("Admin Security Module (lib/admin-security.ts)", () => {
  const src = readFile("lib/admin-security.ts");

  it("exports getAdminPin and setAdminPin for PIN management", () => {
    expect(src).toContain("export async function getAdminPin");
    expect(src).toContain("export async function setAdminPin");
  });

  it("stores PIN in AsyncStorage with correct key", () => {
    expect(src).toContain("@royal_voyage_admin_pin");
  });

  it("validates PIN length (4-8 chars)", () => {
    expect(src).toContain("newPin.length < 4");
    expect(src).toContain("newPin.length > 8");
  });

  it("exports lockout functions with MAX_ATTEMPTS = 3", () => {
    expect(src).toContain("export async function isLockedOut");
    expect(src).toContain("export async function recordFailedAttempt");
    expect(src).toContain("export async function resetFailedAttempts");
    expect(src).toContain("MAX_ATTEMPTS = 3");
  });

  it("has 5-minute lockout duration", () => {
    expect(src).toContain("5 * 60 * 1000");
  });

  it("exports validatePin that combines PIN check with lockout", () => {
    expect(src).toContain("export async function validatePin");
    expect(src).toContain("isLockedOut");
    expect(src).toContain("recordFailedAttempt");
    expect(src).toContain("resetFailedAttempts");
  });

  it("exports biometric functions", () => {
    expect(src).toContain("export async function checkBiometricAvailability");
    expect(src).toContain("export async function authenticateWithBiometric");
    expect(src).toContain("export async function isBiometricEnabled");
    expect(src).toContain("export async function setBiometricEnabled");
  });

  it("uses expo-local-authentication for biometrics", () => {
    expect(src).toContain("expo-local-authentication");
    expect(src).toContain("hasHardwareAsync");
    expect(src).toContain("isEnrolledAsync");
    expect(src).toContain("authenticateAsync");
  });

  it("handles web platform gracefully for biometrics", () => {
    expect(src).toContain('Platform.OS === "web"');
  });

  it("stores biometric preference in AsyncStorage", () => {
    expect(src).toContain("@royal_voyage_biometric_admin");
  });
});

describe("Profile Screen - Admin Access with Security", () => {
  const src = readFile("app/(tabs)/profile.tsx");

  it("imports admin-security module", () => {
    expect(src).toContain("from \"@/lib/admin-security\"");
    expect(src).toContain("validatePin");
    expect(src).toContain("isLockedOut");
    expect(src).toContain("checkBiometricAvailability");
    expect(src).toContain("authenticateWithBiometric");
  });

  it("has lockout timer state and countdown", () => {
    expect(src).toContain("lockoutTimer");
    expect(src).toContain("setLockoutTimer");
    expect(src).toContain("lockoutIntervalRef");
  });

  it("shows lockout countdown in PIN modal", () => {
    expect(src).toContain("lockoutTimer > 0");
    expect(src).toContain("padStart(2,");
  });

  it("disables input and confirm button during lockout", () => {
    expect(src).toContain("editable={lockoutTimer === 0}");
    expect(src).toContain("disabled={lockoutTimer > 0}");
  });

  it("shows remaining attempts on wrong PIN", () => {
    expect(src).toContain("attemptsLeft");
    expect(src).toContain("محاولات");
  });

  it("tries biometric authentication before showing PIN modal", () => {
    expect(src).toContain("handleAdminAccess");
    expect(src).toContain("biometricReady");
    expect(src).toContain("authenticateWithBiometric");
  });

  it("has biometric button in PIN modal as fallback", () => {
    expect(src).toContain("biometricType === \"face\"");
    expect(src).toContain("Face ID");
    expect(src).toContain("البصمة");
  });

  it("uses handlePinSubmit for PIN validation", () => {
    expect(src).toContain("handlePinSubmit");
    expect(src).toContain("validatePin(adminPinInput)");
  });
});

describe("Admin Panel - Change PIN & Biometric Toggle", () => {
  const src = readFile("app/admin/index.tsx");

  it("imports admin-security module", () => {
    expect(src).toContain("from \"@/lib/admin-security\"");
    expect(src).toContain("getAdminPin");
    expect(src).toContain("setAdminPin");
    expect(src).toContain("setBiometricEnabled");
  });

  it("has Change PIN modal with 3 input fields", () => {
    expect(src).toContain("showChangePinModal");
    expect(src).toContain("currentPinInput");
    expect(src).toContain("newPinInput");
    expect(src).toContain("confirmPinInput");
  });

  it("validates current PIN before allowing change", () => {
    expect(src).toContain("handleChangePinSubmit");
    expect(src).toContain("getAdminPin()");
    expect(src).toContain("الرمز الحالي غير صحيح");
  });

  it("validates new PIN length and match", () => {
    expect(src).toContain("newPinInput.length < 4");
    expect(src).toContain("الرمز الجديد غير متطابق");
  });

  it("shows success message after PIN change", () => {
    expect(src).toContain("pinChangeSuccess");
    expect(src).toContain("تم تغيير الرمز بنجاح");
  });

  it("has biometric toggle switch", () => {
    expect(src).toContain("handleBiometricToggle");
    expect(src).toContain("biometricOn");
    expect(src).toContain("setBiometricEnabled");
    expect(src).toContain("<Switch");
  });

  it("verifies biometric before enabling", () => {
    expect(src).toContain("authenticateWithBiometric");
    expect(src).toContain("تحقق لتفعيل الدخول بالبصمة");
  });

  it("has security settings card in overview", () => {
    expect(src).toContain("إعدادات الأمان");
    expect(src).toContain("تغيير رمز PIN");
    expect(src).toContain("shield.fill");
  });
});

describe("App Config - Local Authentication Plugin", () => {
  const src = readFile("app.config.ts");

  it("includes expo-local-authentication plugin", () => {
    expect(src).toContain("expo-local-authentication");
  });

  it("has Face ID permission string", () => {
    expect(src).toContain("faceIDPermission");
    expect(src).toContain("Face ID");
  });
});
