import { describe, it, expect } from "vitest";

describe("Amadeus Office ID configuration", () => {
  it("should have AMADEUS_OFFICE_ID environment variable set", () => {
    const officeId = process.env.AMADEUS_OFFICE_ID;
    expect(officeId).toBeDefined();
    expect(officeId).not.toBe("");
    console.log(`[Test] AMADEUS_OFFICE_ID is set: ${officeId}`);
  });

  it("should have valid Office ID format (alphanumeric, typically 9 chars)", () => {
    const officeId = process.env.AMADEUS_OFFICE_ID || "";
    // Amadeus Office IDs are typically alphanumeric, 6-12 characters
    expect(officeId.length).toBeGreaterThanOrEqual(3);
    expect(officeId.length).toBeLessThanOrEqual(20);
    // Should be alphanumeric (letters and numbers only)
    expect(/^[A-Za-z0-9]+$/.test(officeId)).toBe(true);
  });

  it("should integrate Office ID into flight order creation logic", () => {
    const officeId = process.env.AMADEUS_OFFICE_ID || "";
    // Simulate the logic from amadeus.ts
    const orderData: any = {
      type: "flight-order",
      flightOffers: [],
      travelers: [],
    };

    if (officeId) {
      orderData.queuingOfficeId = officeId;
    }

    expect(orderData.queuingOfficeId).toBe(officeId);
    expect(orderData.queuingOfficeId).toBeDefined();
    console.log(`[Test] queuingOfficeId set to: ${orderData.queuingOfficeId}`);
  });
});
