import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readSrc(rel: string) {
  return readFileSync(join(ROOT, rel), "utf-8");
}

describe("Multicaixa Express Payment Method", () => {
  const paymentScreen = readSrc("app/booking/payment.tsx");
  const confirmPayment = readSrc("app/admin/confirm-payment.tsx");
  const profitReport = readSrc("app/admin/profit-report.tsx");
  const currencyTs = readSrc("lib/currency.ts");

  it("PaymentMethod type includes multicaixa", () => {
    expect(paymentScreen).toContain('"multicaixa"');
  });

  it("PAYMENT_METHODS array includes Multicaixa Express entry", () => {
    expect(paymentScreen).toContain('id: "multicaixa"');
    expect(paymentScreen).toContain('label: "Multicaixa Express"');
    expect(paymentScreen).toContain("Multicaixa Express (بالكوانزا AOA)");
  });

  it("WALLET_NUMBERS includes multicaixa number", () => {
    expect(paymentScreen).toContain('multicaixa: "923 XXX XXX"');
  });

  it("Multicaixa validation is included in transferRef check", () => {
    expect(paymentScreen).toContain('paymentMethod === "multicaixa"');
  });

  it("Multicaixa Express instructions section exists with AOA conversion", () => {
    expect(paymentScreen).toContain('paymentMethod === "multicaixa"');
    expect(paymentScreen).toContain('fromMRU(total, "AOA")');
    expect(paymentScreen).toContain('formatCurrency(total, "AOA")');
    expect(paymentScreen).toContain("الدفع عبر Multicaixa Express");
    expect(paymentScreen).toContain("المبلغ المطلوب بالكوانزا الأنغولية");
  });

  it("Multicaixa uses correct brand color #E31937", () => {
    expect(paymentScreen).toContain("#E31937");
  });

  it("Multicaixa has exchange rate warning", () => {
    expect(paymentScreen).toContain("1 AOA");
    expect(paymentScreen).toContain("0.043 MRU");
  });

  it("confirm-payment.tsx includes Multicaixa Express label", () => {
    expect(confirmPayment).toContain('multicaixa: "Multicaixa Express (AOA)"');
  });

  it("profit-report.tsx includes Multicaixa Express in PAYMENT_METHOD_CONFIG", () => {
    expect(profitReport).toContain("multicaixa");
    expect(profitReport).toContain("Multicaixa Express");
    expect(profitReport).toContain("#E31937");
  });

  it("Currency system supports AOA", () => {
    expect(currencyTs).toContain('"AOA"');
    expect(currencyTs).toContain("كوانزا أنغولي");
    expect(currencyTs).toContain("AOA_TO_MRU_DEFAULT");
  });

  it("fromMRU supports AOA conversion", () => {
    expect(currencyTs).toContain('case "AOA"');
  });

  it("formatCurrency supports AOA formatting with Kz symbol", () => {
    expect(currencyTs).toContain('"Kz"');
    expect(currencyTs).toContain('case "AOA"');
  });
});
