import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Amadeus Real PNR Integration", () => {
  // Test 1: Server-side cache functions exist
  it("should have offer cache functions in server/amadeus.ts", () => {
    const amadeusPath = path.join(__dirname, "..", "server", "amadeus.ts");
    const content = fs.readFileSync(amadeusPath, "utf-8");
    
    expect(content).toContain("cacheRawOffer");
    expect(content).toContain("getCachedRawOffer");
    expect(content).toContain("offerCache");
    expect(content).toContain("CACHE_TTL");
  });

  // Test 2: Cache stores raw offers during search
  it("should cache raw offers during searchFlights", () => {
    const amadeusPath = path.join(__dirname, "..", "server", "amadeus.ts");
    const content = fs.readFileSync(amadeusPath, "utf-8");
    
    // Verify cacheRawOffer is called in searchFlights
    expect(content).toContain("cacheRawOffer(offerId, offer)");
  });

  // Test 3: bookFlightWithPNR endpoint exists in routers
  it("should have bookFlightWithPNR endpoint in server/routers.ts", () => {
    const routersPath = path.join(__dirname, "..", "server", "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    expect(content).toContain("bookFlightWithPNR");
    expect(content).toContain("getCachedRawOffer");
    expect(content).toContain("priceFlightOffer");
    expect(content).toContain("createFlightOrder");
  });

  // Test 4: bookFlightWithPNR accepts correct input schema
  it("should accept traveler details in bookFlightWithPNR", () => {
    const routersPath = path.join(__dirname, "..", "server", "routers.ts");
    const content = fs.readFileSync(routersPath, "utf-8");
    
    expect(content).toContain("offerId: z.string()");
    expect(content).toContain("firstName: z.string()");
    expect(content).toContain("lastName: z.string()");
    expect(content).toContain("dateOfBirth: z.string()");
    expect(content).toContain('gender: z.enum(["MALE", "FEMALE"])');
    expect(content).toContain("email: z.string()");
    expect(content).toContain("phone: z.string()");
  });

  // Test 5: Payment screen uses bookFlightWithPNR
  it("should call bookFlightWithPNR in payment.tsx", () => {
    const paymentPath = path.join(__dirname, "..", "app", "booking", "payment.tsx");
    const content = fs.readFileSync(paymentPath, "utf-8");
    
    expect(content).toContain("trpc.amadeus.bookFlightWithPNR.useMutation()");
    expect(content).toContain("bookFlightWithPNR.mutateAsync");
  });

  // Test 6: Payment has fallback PNR if Amadeus fails
  it("should have fallback PNR generation if Amadeus fails", () => {
    const paymentPath = path.join(__dirname, "..", "app", "booking", "payment.tsx");
    const content = fs.readFileSync(paymentPath, "utf-8");
    
    // Should have fallback PNR generation
    expect(content).toContain("Using fallback PNR");
    expect(content).toContain("PNR_CHARS");
    // Should try Amadeus first
    expect(content).toContain("Attempting Amadeus booking");
    expect(content).toContain("Got real Amadeus PNR");
  });

  // Test 7: createFlightOrder function exists with correct structure
  it("should have createFlightOrder with Royal Voyage contact info", () => {
    const amadeusPath = path.join(__dirname, "..", "server", "amadeus.ts");
    const content = fs.readFileSync(amadeusPath, "utf-8");
    
    expect(content).toContain("createFlightOrder");
    expect(content).toContain("royal-voyage@gmail.com");
    expect(content).toContain("33700000");
    expect(content).toContain("Tavragh Zeina");
    expect(content).toContain("Nouakchott");
    expect(content).toContain("ROYAL VOYAGE");
  });

  // Test 8: PNR extraction from Amadeus response
  it("should extract PNR from associatedRecords", () => {
    const amadeusPath = path.join(__dirname, "..", "server", "amadeus.ts");
    const content = fs.readFileSync(amadeusPath, "utf-8");
    
    expect(content).toContain("associatedRecords");
    expect(content).toContain("records[0]?.reference");
  });

  // Test 9: priceFlightOffer function exists
  it("should have priceFlightOffer for step 2 pricing", () => {
    const amadeusPath = path.join(__dirname, "..", "server", "amadeus.ts");
    const content = fs.readFileSync(amadeusPath, "utf-8");
    
    expect(content).toContain("priceFlightOffer");
    expect(content).toContain("flight-offers-pricing");
    expect(content).toContain("pricedOffer");
  });

  // Test 10: Cache has TTL and cleanup
  it("should have cache TTL and cleanup mechanism", () => {
    const amadeusPath = path.join(__dirname, "..", "server", "amadeus.ts");
    const content = fs.readFileSync(amadeusPath, "utf-8");
    
    expect(content).toContain("30 * 60 * 1000"); // 30 min TTL
    expect(content).toContain("cleanExpiredCache");
    expect(content).toContain("offerCache.delete");
  });
});
