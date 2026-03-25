import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Multicaixa Express Enhancements", () => {
  const paymentScreen = readSrc("app/booking/payment.tsx");
  const pricingSettings = readSrc("lib/pricing-settings.ts");
  const pricingAdmin = readSrc("app/admin/pricing.tsx");
  const currencyTs = readSrc("lib/currency.ts");

  describe("1. Real account number", () => {
    it("WALLET_NUMBERS contains real IBAN", () => {
      expect(paymentScreen).toContain('multicaixa: "0055 0000 76790864101 08"');
    });

    it("Displays beneficiary name ANGOLAMIR COMERCIO E SERVICOS LDA", () => {
      expect(paymentScreen).toContain("ANGOLAMIR COMERCIO E SERVICOS LDA");
    });

    it("Shows IBAN label", () => {
      expect(paymentScreen).toContain("رقم الحساب (IBAN)");
    });

    it("Shows beneficiary label", () => {
      expect(paymentScreen).toContain("اسم المستفيد");
    });
  });

  describe("2. Configurable AOA exchange rate", () => {
    it("PricingSettings interface has aoaToMRU field", () => {
      expect(pricingSettings).toContain("aoaToMRU: number;");
    });

    it("DEFAULT_PRICING has aoaToMRU value", () => {
      expect(pricingSettings).toContain("aoaToMRU: 0.043");
    });

    it("toMRUWithSettings handles AOA case", () => {
      expect(pricingSettings).toContain('case "AOA": return Math.round(amount * s.aoaToMRU)');
    });

    it("fetchLiveExchangeRates includes AOA", () => {
      expect(pricingSettings).toContain("aoaToMRU: parseFloat");
      expect(pricingSettings).toContain('rates["AOA"]');
    });

    it("Admin pricing screen has AOA field", () => {
      expect(pricingAdmin).toContain('"aoaToMRU"');
      expect(pricingAdmin).toContain("الكوانزا (AOA)");
      expect(pricingAdmin).toContain("1 AOA = ؟ MRU (Multicaixa Express)");
    });

    it("Live rate update includes aoaToMRU key", () => {
      expect(pricingAdmin).toContain('"aoaToMRU"');
    });

    it("currency.ts fromMRU uses dynamic aoaToMRU rate", () => {
      expect(currencyTs).toContain("rates?.aoaToMRU ?? AOA_TO_MRU_DEFAULT");
    });

    it("currency.ts toMRU uses dynamic aoaRate", () => {
      expect(currencyTs).toContain("aoaRate");
      expect(currencyTs).toContain("(rates as any)?.aoaToMRU ?? AOA_TO_MRU_DEFAULT");
    });
  });

  describe("3. Open Multicaixa Express app button", () => {
    it("Has open app button with Linking", () => {
      expect(paymentScreen).toContain("فتح Multicaixa Express");
      expect(paymentScreen).toContain('Linking.openURL("multicaixaexpress://")');
    });

    it("Falls back to Play Store if app not installed", () => {
      expect(paymentScreen).toContain("play.google.com/store/apps/details?id=ao.multicaixa.express");
    });

    it("Falls back to website as last resort", () => {
      expect(paymentScreen).toContain("multicaixa.co.ao");
    });

    it("Has helper text about Transaction ID", () => {
      expect(paymentScreen).toContain("سيتم فتح التطبيق مباشرة");
      expect(paymentScreen).toContain("Transaction ID");
    });
  });
});
