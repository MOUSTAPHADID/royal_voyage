import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readFile(path: string): string {
  return readFileSync(join(ROOT, path), "utf-8");
}

describe("Booking Flow Pricing — Duffel total_amount is used correctly", () => {
  describe("1. flights/results.tsx — shows total price (not per-person)", () => {
    const src = readFile("app/flights/results.tsx");

    it("displays price from item.price directly (no multiplication)", () => {
      // Should use toMRU(item.price, ...) without multiplying
      expect(src).toContain("toMRU(item.price,");
    });

    it("shows 'الإجمالي' label instead of perPerson", () => {
      expect(src).toContain("الإجمالي");
    });

    it("does NOT multiply price by 2 for round trips", () => {
      // No * 2 pattern in price display
      expect(src).not.toMatch(/item\.price\s*\*\s*2/);
    });
  });

  describe("2. flights/detail.tsx — correct total price calculation", () => {
    const src = readFile("app/flights/detail.tsx");

    it("uses flight.price directly as totalPrice (Duffel total_amount)", () => {
      expect(src).toContain("const totalPrice = flight.price");
    });

    it("does NOT multiply by 2 for round trips", () => {
      expect(src).not.toMatch(/totalPrice.*\*\s*2/);
      expect(src).not.toMatch(/\)\s*\*\s*2/);
    });

    it("does NOT multiply by adultCount (Duffel includes all passengers)", () => {
      expect(src).not.toMatch(/adultPrice\s*\*\s*adultCount/);
    });

    it("shows 'شامل الذهاب والإياب' for round trips", () => {
      expect(src).toContain("شامل الذهاب والإياب");
    });

    it("calculates perPersonMRU for badge display", () => {
      expect(src).toContain("perPersonMRU");
    });

    it("passes totalMRU as price to booking", () => {
      expect(src).toContain('price: String(totalMRU)');
    });
  });

  describe("3. booking/payment.tsx — price flows correctly to confirmation", () => {
    const src = readFile("app/booking/payment.tsx");

    it("passes total to confirmation screen", () => {
      expect(src).toContain("total: total.toString()");
    });

    it("passes pnr to confirmation screen", () => {
      expect(src).toContain("pnr,");
    });

    it("sends pnr in flight ticket email", () => {
      expect(src).toContain("pnr,");
    });

    it("stores royalOrderId (Duffel order ID) in booking", () => {
      expect(src).toMatch(/royalOrderId/);
    });
  });

  describe("4. booking/confirmation.tsx — displays booking info", () => {
    const src = readFile("app/booking/confirmation.tsx");

    it("displays PNR", () => {
      expect(src).toContain("pnr");
    });

    it("displays total price", () => {
      expect(src).toContain("total");
    });

    it("displays reference", () => {
      expect(src).toContain("reference");
    });
  });

  describe("5. server/duffel.ts — returns total_amount correctly", () => {
    const src = readFile("server/duffel.ts");

    it("parses offer.total_amount as price", () => {
      expect(src).toContain('parseFloat(offer.total_amount');
    });

    it("returns price in FlightOffer", () => {
      // price is now set from totalAmount variable (which is parseFloat(offer.total_amount))
      expect(src).toContain("price: totalAmount");
    });

    it("creates order with Duffel API", () => {
      expect(src).toContain("duffel.orders.create");
    });

    it("returns PNR from booking_reference", () => {
      expect(src).toContain("booking_reference");
    });

    it("returns ticket numbers from documents", () => {
      expect(src).toContain("unique_identifier");
    });
  });
});
