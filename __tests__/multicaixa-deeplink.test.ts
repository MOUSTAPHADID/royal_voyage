import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Multicaixa Express Deep Link - Direct App Launch", () => {
  const paymentScreen = readSrc("app/booking/payment.tsx");

  it("uses correct Android package name com.sibsint.mcxwallet", () => {
    expect(paymentScreen).toContain('"com.sibsint.mcxwallet"');
  });

  it("uses Android intent URI for direct app launch", () => {
    expect(paymentScreen).toContain("intent://#Intent;package=");
    expect(paymentScreen).toContain("scheme=multicaixaexpress");
  });

  it("includes browser_fallback_url in intent URI", () => {
    expect(paymentScreen).toContain("S.browser_fallback_url=");
  });

  it("has correct Google Play Store URL with real package name", () => {
    expect(paymentScreen).toContain("play.google.com/store/apps/details?id=${packageName}");
  });

  it("has correct Apple App Store URL", () => {
    expect(paymentScreen).toContain("apps.apple.com/app/multicaixa-express/id1433675921");
  });

  it("uses canOpenURL on iOS before attempting to open", () => {
    expect(paymentScreen).toContain('Linking.canOpenURL("multicaixaexpress://")');
  });

  it("handles all three platforms: android, ios, web", () => {
    expect(paymentScreen).toContain('Platform.OS === "android"');
    expect(paymentScreen).toContain('Platform.OS === "ios"');
    // Web is the else branch
    expect(paymentScreen).toContain("// Web:");
  });

  it("falls back to multicaixa.ao website", () => {
    expect(paymentScreen).toContain('"https://multicaixa.ao"');
  });
});
