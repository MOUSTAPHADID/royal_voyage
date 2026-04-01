import { describe, it, expect } from "vitest";

describe("Stripe Publishable Key", () => {
  it("should have a valid publishable key format", () => {
    const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
    // Key should start with pk_live_ or pk_test_ and not be the old invalid key
    const isValid = key.startsWith("pk_live_") || key.startsWith("pk_test_");
    expect(isValid).toBe(true);
    // Should not be empty
    expect(key.length).toBeGreaterThan(20);
  });
});
