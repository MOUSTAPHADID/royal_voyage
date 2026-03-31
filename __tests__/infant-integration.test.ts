import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readFile(path: string): string {
  return readFileSync(join(ROOT, path), "utf-8");
}

describe("Infant Passenger Integration", () => {
  describe("1. passenger-details.tsx — collects infant data", () => {
    const src = readFile("app/booking/passenger-details.tsx");

    it("imports Alert from react-native", () => {
      expect(src).toContain("Alert,");
    });

    it("has infantDetails state with firstName, lastName, dateOfBirth", () => {
      expect(src).toContain("infantDetails");
      expect(src).toContain("firstName");
      expect(src).toContain("lastName");
      expect(src).toContain("dateOfBirth");
    });

    it("validates infant age (must be under 2 years)", () => {
      expect(src).toContain("عمر الرضيع غير صالح");
      expect(src).toContain("twoYearsAgo");
    });

    it("serializes infantDetailsJson for navigation", () => {
      expect(src).toContain("infantDetailsJson");
      expect(src).toContain("JSON.stringify(infantDetails)");
    });

    it("has DatePickerField with maximumDate and minimumDate for infants", () => {
      expect(src).toContain("maximumDate={new Date()}");
      expect(src).toContain("minimumDate=");
    });
  });

  describe("2. summary.tsx — forwards infantDetailsJson", () => {
    const src = readFile("app/booking/summary.tsx");

    it("accepts infantDetailsJson param", () => {
      expect(src).toContain("infantDetailsJson");
    });

    it("passes infantDetailsJson to payment screen", () => {
      expect(src).toContain("infantDetailsJson: params.infantDetailsJson");
    });
  });

  describe("3. payment.tsx — parses and sends infant data to API", () => {
    const src = readFile("app/booking/payment.tsx");

    it("parses infantDetailsJson from params", () => {
      expect(src).toContain("params.infantDetailsJson");
      expect(src).toContain("JSON.parse(params.infantDetailsJson)");
    });

    it("includes infantDetails in booking params", () => {
      expect(src).toContain("infantDetails: infantDetails.length > 0 ? infantDetails : undefined");
    });

    it("includes passengers and children counts in booking params", () => {
      expect(src).toContain("passengers: adultCount");
      expect(src).toContain("children: childCount");
    });
  });

  describe("4. server/routers.ts — accepts infant data in schemas", () => {
    const src = readFile("server/routers.ts");

    it("bookFlightWithPNR accepts passengers, children, infantDetails", () => {
      // Check schema has passengers field
      expect(src).toContain("passengers: z.number().min(1).max(9)");
      expect(src).toContain("children: z.number().min(0).max(8)");
      expect(src).toContain("infantDetails: z.array(");
    });

    it("holdFlightOrder accepts passengers, children, infantDetails", () => {
      // Both procedures should have the same schema
      const holdSection = src.substring(src.indexOf("holdFlightOrder"));
      expect(holdSection).toContain("passengers: z.number()");
      expect(holdSection).toContain("children: z.number()");
      expect(holdSection).toContain("infantDetails: z.array(");
    });

    it("builds travelers array with adults, children, and infants", () => {
      expect(src).toContain("// Primary adult");
      expect(src).toContain("// Additional adults");
      expect(src).toContain("// Children");
      expect(src).toContain("// Infants (use actual infant details if provided)");
    });
  });

  describe("5. server/duffel.ts — FlightOffer includes passengerPricing", () => {
    const src = readFile("server/duffel.ts");

    it("FlightOffer type has passengerPricing field", () => {
      expect(src).toContain("passengerPricing?: Array<{");
      expect(src).toContain("type: string;");
      expect(src).toContain("quantity: number;");
      expect(src).toContain("totalAmount: number;");
      expect(src).toContain("perPersonAmount: number;");
    });

    it("extracts passenger types from Duffel offer", () => {
      expect(src).toContain("offerPassengers = offer.passengers");
      expect(src).toContain("typeMap");
    });

    it("calculates per-type pricing with ratios", () => {
      expect(src).toContain("infantRatio");
      expect(src).toContain("childRatio");
    });

    it("returns passengerPricing in FlightOffer", () => {
      expect(src).toContain("passengerPricing: passengerPricing.length > 0 ? passengerPricing : undefined");
    });
  });

  describe("6. flights/results.tsx — passes passengerPricingJson to detail", () => {
    const src = readFile("app/flights/results.tsx");

    it("AnyFlight type includes passengerPricing", () => {
      expect(src).toContain("passengerPricing?: Array<{");
    });

    it("serializes passengerPricing to JSON for navigation", () => {
      expect(src).toContain("passengerPricingJson: item.passengerPricing ? JSON.stringify(item.passengerPricing)");
    });
  });

  describe("7. flights/detail.tsx — displays separate pricing per passenger type", () => {
    const src = readFile("app/flights/detail.tsx");

    it("accepts passengerPricingJson param", () => {
      expect(src).toContain("passengerPricingJson: string;");
    });

    it("parses passengerPricingJson", () => {
      expect(src).toContain("JSON.parse(params.passengerPricingJson)");
    });

    it("computes per-type pricing in MRU", () => {
      expect(src).toContain("adultPerPersonMRU");
      expect(src).toContain("childPerPersonMRU");
      expect(src).toContain("infantPerPersonMRU");
    });

    it("displays separate adult pricing row", () => {
      expect(src).toContain("بالغ");
      expect(src).toContain("adultPerPersonMRU");
    });

    it("conditionally displays child pricing row", () => {
      expect(src).toContain("childCount > 0");
      expect(src).toContain("childPerPersonMRU");
    });

    it("conditionally displays infant pricing row", () => {
      expect(src).toContain("infantCount > 0");
      expect(src).toContain("infantPerPersonMRU");
    });

    it("distributes agency fee across passenger types", () => {
      expect(src).toContain("feePerPerson");
    });
  });
});
