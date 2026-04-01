import { describe, it, expect } from "vitest";
import { FLIGHTS, HOTELS, DESTINATIONS, MOCK_BOOKINGS } from "../lib/mock-data";

describe("Royal Service - Mock Data", () => {
  it("should have 6 flights", () => {
    expect(FLIGHTS.length).toBe(6);
  });

  it("should have 6 hotels", () => {
    expect(HOTELS.length).toBe(6);
  });

  it("should have 6 destinations", () => {
    expect(DESTINATIONS.length).toBe(6);
  });

  it("should have 3 mock bookings", () => {
    expect(MOCK_BOOKINGS.length).toBe(3);
  });

  it("each flight should have required fields", () => {
    FLIGHTS.forEach((f) => {
      expect(f.id).toBeTruthy();
      expect(f.airline).toBeTruthy();
      expect(f.originCode).toHaveLength(3);
      expect(f.destinationCode).toHaveLength(3);
      expect(f.price).toBeGreaterThan(0);
    });
  });

  it("each hotel should have required fields", () => {
    HOTELS.forEach((h) => {
      expect(h.id).toBeTruthy();
      expect(h.name).toBeTruthy();
      expect(h.pricePerNight).toBeGreaterThan(0);
      expect(h.stars).toBeGreaterThanOrEqual(1);
      expect(h.stars).toBeLessThanOrEqual(5);
      expect(h.amenities.length).toBeGreaterThan(0);
    });
  });

  it("each booking should have a reference number", () => {
    MOCK_BOOKINGS.forEach((b) => {
      expect(b.reference).toMatch(/^RV-/);
      expect(b.totalPrice).toBeGreaterThan(0);
    });
  });

  it("destinations should have flight and hotel prices", () => {
    DESTINATIONS.forEach((d) => {
      expect(d.flightPrice).toBeGreaterThan(0);
      expect(d.hotelPrice).toBeGreaterThan(0);
      expect(d.city).toBeTruthy();
      expect(d.country).toBeTruthy();
    });
  });
});

describe("Royal Service - Theme Colors", () => {
  it("should have valid theme config", async () => {
    const themeConfig = await import("../theme.config.js");
    const { themeColors } = themeConfig;
    expect(themeColors.primary).toBeDefined();
    expect(themeColors.secondary).toBeDefined();
    expect(themeColors.background).toBeDefined();
    expect(themeColors.primary.light).toMatch(/^#/);
    expect(themeColors.secondary.light).toMatch(/^#/);
  });
});
