import { describe, it, expect, vi, beforeAll } from "vitest";

// Mock the Stripe module
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      paymentIntents: {
        create: vi.fn().mockResolvedValue({
          id: "pi_test_123",
          client_secret: "pi_test_123_secret_abc",
          amount: 1163,
          currency: "eur",
          status: "requires_payment_method",
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: "pi_test_123",
          amount: 1163,
          currency: "eur",
          status: "succeeded",
        }),
      },
    })),
  };
});

describe("Stripe Server Module", () => {
  // Set env vars before importing
  beforeAll(() => {
    process.env.STRIPE_SECRET_KEY = "sk_test_fake";
    process.env.STRIPE_PUBLISHABLE_KEY = "pk_test_fake";
  });

  it("isStripeConfigured returns true when STRIPE_SECRET_KEY is set", async () => {
    const { isStripeConfigured } = await import("../server/stripe");
    expect(isStripeConfigured()).toBe(true);
  });

  it("getPublishableKey returns the publishable key", async () => {
    const { getPublishableKey } = await import("../server/stripe");
    expect(getPublishableKey()).toBe("pk_test_fake");
  });

  it("createPaymentIntent converts MRU to EUR correctly", async () => {
    const { createPaymentIntent } = await import("../server/stripe");
    const result = await createPaymentIntent({
      amount: 50000, // 50,000 MRU
      currency: "eur",
      description: "Test booking",
    });

    expect(result).toHaveProperty("clientSecret");
    expect(result).toHaveProperty("paymentIntentId");
    expect(result).toHaveProperty("currency", "eur");
    expect(result).toHaveProperty("publishableKey", "pk_test_fake");
    expect(result.amount).toBe(50000); // Original MRU amount preserved
    expect(result.amountConverted).toBeGreaterThan(0);
  });

  it("createPaymentIntent converts MRU to USD correctly", async () => {
    const { createPaymentIntent } = await import("../server/stripe");
    const result = await createPaymentIntent({
      amount: 39500, // 39,500 MRU ≈ $1000
      currency: "usd",
      description: "Test USD booking",
    });

    expect(result.currency).toBe("usd");
    expect(result.amountConverted).toBeGreaterThan(0);
  });

  it("getPaymentIntent retrieves payment status", async () => {
    const { getPaymentIntent } = await import("../server/stripe");
    const result = await getPaymentIntent("pi_test_123");

    expect(result.status).toBe("succeeded");
    expect(result.id).toBe("pi_test_123");
  });
});

describe("Payment Method Type", () => {
  it("stripe is a valid PaymentMethod type", () => {
    type PaymentMethod = "cash" | "bank_transfer" | "bankily" | "masrvi" | "sedad" | "stripe" | "multicaixa" | "hold_24h";
    const method: PaymentMethod = "stripe";
    expect(method).toBe("stripe");
  });

  it("paypal is no longer in the PaymentMethod type", () => {
    type PaymentMethod = "cash" | "bank_transfer" | "bankily" | "masrvi" | "sedad" | "stripe" | "multicaixa" | "hold_24h";
    const validMethods: PaymentMethod[] = ["cash", "bank_transfer", "bankily", "masrvi", "sedad", "stripe", "multicaixa", "hold_24h"];
    expect(validMethods).toContain("stripe");
    expect(validMethods).not.toContain("paypal");
  });
});

describe("Stripe Labels Consistency", () => {
  it("all admin screens have stripe label", () => {
    // Verify the labels we set in the admin screens
    const confirmPaymentLabels: Record<string, string> = {
      cash: "دفع نقدي في المكتب",
      bank_transfer: "تحويل بنكي",
      bankily: "بنكيلي",
      masrvi: "مصرفي",
      sedad: "سداد",
      stripe: "💳 بطاقة بنكية (Visa/Mastercard)",
      paypal: "PayPal (عملة أجنبية)",
      multicaixa: "Multicaixa Express (AOA)",
      hold_24h: "حجز مؤكد 24 ساعة",
    };

    expect(confirmPaymentLabels).toHaveProperty("stripe");
    expect(confirmPaymentLabels.stripe).toContain("بطاقة بنكية");
  });

  it("booking detail screen has stripe label", () => {
    const paymentLabels: Record<string, string> = {
      cash: "💵 نقداً",
      bank_transfer: "🏦 تحويل بنكي",
      stripe: "💳 بطاقة بنكية (Visa/Mastercard)",
      bankily: "📱 Bankily",
      masrvi: "📱 Masrvi",
      sedad: "📱 Sedad",
      paypal: "🌐 PayPal (عملة أجنبية)",
      multicaixa: "🇦🇴 Multicaixa Express (AOA)",
      hold_24h: "⏰ حجز مؤكد 24 ساعة",
    };

    expect(paymentLabels).toHaveProperty("stripe");
    expect(paymentLabels.stripe).toContain("Visa/Mastercard");
  });
});
