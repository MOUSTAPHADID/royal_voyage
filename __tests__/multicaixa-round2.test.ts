import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Multicaixa Express Enhancements - Round 2", () => {
  const paymentScreen = readSrc("app/booking/payment.tsx");
  const pricingAdmin = readSrc("app/admin/pricing.tsx");

  describe("1. Copy IBAN button", () => {
    it("imports expo-clipboard", () => {
      expect(paymentScreen).toContain('import * as Clipboard from "expo-clipboard"');
    });

    it("imports expo-haptics", () => {
      expect(paymentScreen).toContain('import * as Haptics from "expo-haptics"');
    });

    it("has ibanCopied state", () => {
      expect(paymentScreen).toContain("const [ibanCopied, setIbanCopied] = useState(false)");
    });

    it("calls Clipboard.setStringAsync with IBAN", () => {
      expect(paymentScreen).toContain("Clipboard.setStringAsync(WALLET_NUMBERS.multicaixa)");
    });

    it("shows copy button text", () => {
      expect(paymentScreen).toContain("📋 نسخ");
      expect(paymentScreen).toContain("✅ تم النسخ");
    });

    it("triggers haptic feedback on copy", () => {
      expect(paymentScreen).toContain("Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)");
    });
  });

  describe("2. Multicaixa Express notification for admin", () => {
    it("sends special notification for multicaixa payment", () => {
      expect(paymentScreen).toContain('paymentMethod === "multicaixa"');
      expect(paymentScreen).toContain("دفعة Multicaixa Express جديدة!");
    });

    it("includes AOA formatted amount in notification", () => {
      expect(paymentScreen).toContain('formatCurrency(total, "AOA")');
    });

    it("sends push notification with multicaixa_payment type", () => {
      expect(paymentScreen).toContain('"multicaixa_payment"');
    });

    it("saves local admin notification", () => {
      expect(paymentScreen).toContain("addAdminNotification");
    });
  });

  describe("3. Exchange rate display in payment screen", () => {
    it("imports getPricingSettings", () => {
      expect(paymentScreen).toContain('import { getPricingSettings } from "@/lib/pricing-settings"');
    });

    it("displays current exchange rate", () => {
      expect(paymentScreen).toContain("سعر الصرف الحالي");
      expect(paymentScreen).toContain("1 AOA = {aoaRate} MRU");
    });

    it("shows last updated date", () => {
      expect(paymentScreen).toContain("آخر تحديث:");
    });

    it("admin pricing screen includes aoaToMRU in live rate keys", () => {
      expect(pricingAdmin).toContain('"aoaToMRU"');
    });
  });
});
