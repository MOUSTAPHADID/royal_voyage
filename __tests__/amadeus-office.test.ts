import { describe, it, expect } from "vitest";
import "../scripts/load-env.js";

describe("Amadeus Office ID", () => {
  it("should have AMADEUS_OFFICE_ID set", () => {
    const officeId = process.env.AMADEUS_OFFICE_ID;
    expect(officeId).toBeDefined();
    expect(officeId!.length).toBeGreaterThan(4);
    console.log("Office ID prefix:", officeId!.substring(0, 4));
  });
});
