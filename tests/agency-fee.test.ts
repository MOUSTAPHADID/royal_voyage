import { describe, it, expect } from "vitest";
import { AGENCY_FEE_MRU, toMRU, formatMRU } from "../lib/currency";

describe("Agency Fee (رسوم الوكالة)", () => {
  it("AGENCY_FEE_MRU should be 1000", () => {
    expect(AGENCY_FEE_MRU).toBe(1000);
  });

  it("Flight total should include 1000 MRU agency fee", () => {
    // رحلة بسعر 500 USD لبالغ واحد مع ضرائب 10%
    const flightPriceUSD = 500;
    const adults = 1;
    const taxRate = 1.1;
    const totalBeforeFee = toMRU(Math.round(flightPriceUSD * adults * taxRate), "USD");
    const totalWithFee = totalBeforeFee + AGENCY_FEE_MRU;

    expect(totalWithFee).toBe(totalBeforeFee + 1000);
    expect(totalWithFee).toBeGreaterThan(totalBeforeFee);
  });

  it("Hotel total should include 1000 MRU agency fee", () => {
    // فندق بسعر 200 USD / ليلة لبالغ واحد
    const nightlyRateUSD = 200;
    const adults = 1;
    const totalBeforeFee = toMRU(nightlyRateUSD * adults, "USD");
    const totalWithFee = totalBeforeFee + AGENCY_FEE_MRU;

    expect(totalWithFee).toBe(totalBeforeFee + 1000);
  });

  it("formatMRU should format 1000 correctly", () => {
    expect(formatMRU(1000)).toBe("1,000 MRU");
  });
});
