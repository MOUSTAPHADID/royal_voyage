import { describe, it, expect } from "vitest";

describe("Stripe API Key Validation", () => {
  it("should have STRIPE_RK_KEY or STRIPE_SECRET_KEY configured", () => {
    const sk = process.env.STRIPE_SECRET_KEY;
    const rk = process.env.STRIPE_RK_KEY;
    const key = sk || rk;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
  });

  it("should have STRIPE_PUBLISHABLE_KEY configured", () => {
    const key = process.env.STRIPE_PUBLISHABLE_KEY;
    expect(key).toBeDefined();
    expect(key!.length).toBeGreaterThan(10);
    expect(key!.startsWith("pk_test_") || key!.startsWith("pk_live_")).toBe(true);
  });

  it("should be able to initialize Stripe and retrieve balance", async () => {
    const Stripe = (await import("stripe")).default;
    const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RK_KEY;
    const stripe = new Stripe(key!, {
      apiVersion: "2026-03-25.dahlia",
    });

    // Simple API call to validate the key works
    const balance = await stripe.balance.retrieve();
    expect(balance).toBeDefined();
    expect(balance.object).toBe("balance");
  });
});
