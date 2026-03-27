import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf-8");

describe("Hidden admin access via long press on version text", () => {
  const src = read("app/(tabs)/profile.tsx");

  it("has long press handler on version text", () => {
    expect(src).toContain("onLongPress");
    expect(src).toContain("delayLongPress");
    expect(src).toContain("setShowAdminPinModal(true)");
  });

  it("has admin PIN modal with input field", () => {
    expect(src).toContain("showAdminPinModal");
    expect(src).toContain("adminPinInput");
    expect(src).toContain("secureTextEntry");
    expect(src).toContain('keyboardType="number-pad"');
  });

  it("has correct ADMIN_PIN", () => {
    expect(src).toContain('ADMIN_PIN = "36380112"');
  });

  it("navigates to admin on correct PIN", () => {
    expect(src).toContain('router.push("/admin"');
  });

  it("shows error alert on wrong PIN", () => {
    expect(src).toContain("رمز خاطئ");
    expect(src).toContain("Wrong PIN");
  });

  it("has haptic feedback for success and error", () => {
    expect(src).toContain("NotificationFeedbackType.Success");
    expect(src).toContain("NotificationFeedbackType.Error");
  });

  it("supports Arabic, French and English labels", () => {
    expect(src).toContain("دخول الإدارة");
    expect(src).toContain("Acc");
    expect(src).toContain("Admin Access");
  });

  it("has styled admin PIN modal", () => {
    expect(src).toContain("adminPinSheet");
    expect(src).toContain("adminPinInput");
    expect(src).toContain("adminPinConfirmBtn");
    expect(src).toContain("adminPinCancelBtn");
  });
});
