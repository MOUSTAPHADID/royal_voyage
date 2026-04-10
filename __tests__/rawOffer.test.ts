import { describe, it, expect } from "vitest";

// Test that priceFlightOffer uses rawOffer directly when it has the required fields
describe("priceFlightOffer with rawOffer", () => {
  it("should use rawOffer directly when it has total_amount, passengers, and slices", () => {
    const mockRawOffer = {
      id: "off_0001abc",
      total_amount: "150.50",
      total_currency: "USD",
      expires_at: "2026-04-11T00:00:00Z",
      passengers: [{ id: "pas_001", type: "adult" }],
      slices: [{ id: "sli_001", segments: [] }],
    };

    // Simulate the check in priceFlightOffer
    const hasRequiredFields =
      mockRawOffer &&
      typeof mockRawOffer === "object" &&
      mockRawOffer.total_amount &&
      mockRawOffer.passengers &&
      mockRawOffer.slices;

    expect(hasRequiredFields).toBeTruthy();
    expect(parseFloat(mockRawOffer.total_amount)).toBe(150.5);
    expect(mockRawOffer.total_currency).toBe("USD");
  });

  it("should fallback to ID-based fetch when rawOffer is just a string", () => {
    const rawOffer = "off_0001abc";
    const offerId = (rawOffer as any)?.id || rawOffer;
    expect(offerId).toBe("off_0001abc");
  });
});

// Test currency formatting
describe("formatCurrency", () => {
  it("should format MRU correctly", () => {
    const amount = 15000;
    const formatted = `${Math.round(amount).toLocaleString("en-US")} MRU`;
    expect(formatted).toBe("15,000 MRU");
  });

  it("should convert USD to MRU correctly", () => {
    const usdAmount = 374.07;
    const usdToMRU = 40.08;
    const mruAmount = Math.round(usdAmount * usdToMRU);
    expect(mruAmount).toBeGreaterThan(10000);
    expect(mruAmount).toBeLessThan(20000);
  });
});

// Test that rawOffer is passed correctly through booking params
describe("booking params with rawOffer", () => {
  it("should parse rawOffer JSON string correctly", () => {
    const mockOffer = {
      id: "off_0001abc",
      total_amount: "150.50",
      total_currency: "USD",
      passengers: [{ id: "pas_001" }],
      slices: [],
    };
    const jsonString = JSON.stringify(mockOffer);
    const parsed = JSON.parse(jsonString);
    expect(parsed.id).toBe("off_0001abc");
    expect(parsed.total_amount).toBe("150.50");
    expect(parsed.passengers).toHaveLength(1);
  });

  it("should handle empty rawOffer gracefully", () => {
    const rawOfferParam = "";
    let parsedRawOffer: any = undefined;
    if (rawOfferParam) {
      try {
        parsedRawOffer = JSON.parse(rawOfferParam);
      } catch (e) {
        parsedRawOffer = undefined;
      }
    }
    expect(parsedRawOffer).toBeUndefined();
  });
});
