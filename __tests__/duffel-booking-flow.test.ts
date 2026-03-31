/**
 * Duffel Booking Flow — Structure & Function Verification
 * Verifies all exported functions, types, and compatibility layer
 * without making slow API calls (those were already tested via curl)
 */
import { describe, it, expect } from "vitest";
import {
  searchFlights,
  priceFlightOffer,
  createFlightOrder,
  getFlightOrder,
  cancelFlightOrder,
  checkTicketIssuance,
  getDuffelStatus,
  getCachedOffer,
  cacheOffer,
  getConsolidatorConfig,
  setActiveConsolidator,
  addConsolidator,
  removeConsolidator,
  setConsolidatorOfficeId,
  getConsolidatorForBooking,
  queueToConsolidator,
  searchLocations,
  searchHotelsByCity,
  getAmadeusStatus,
  getCachedRawOffer,
  cacheRawOffer,
} from "../server/duffel";

describe("Duffel Module Exports", () => {
  it("exports all flight search/booking functions", () => {
    expect(typeof searchFlights).toBe("function");
    expect(typeof priceFlightOffer).toBe("function");
    expect(typeof createFlightOrder).toBe("function");
    expect(typeof getFlightOrder).toBe("function");
    expect(typeof cancelFlightOrder).toBe("function");
    expect(typeof checkTicketIssuance).toBe("function");
  });

  it("exports location and hotel search functions", () => {
    expect(typeof searchLocations).toBe("function");
    expect(typeof searchHotelsByCity).toBe("function");
  });

  it("exports offer caching functions", () => {
    expect(typeof getCachedOffer).toBe("function");
    expect(typeof cacheOffer).toBe("function");
    expect(typeof getCachedRawOffer).toBe("function");
    expect(typeof cacheRawOffer).toBe("function");
  });

  it("exports consolidator compatibility functions", () => {
    expect(typeof getConsolidatorConfig).toBe("function");
    expect(typeof setActiveConsolidator).toBe("function");
    expect(typeof addConsolidator).toBe("function");
    expect(typeof removeConsolidator).toBe("function");
    expect(typeof setConsolidatorOfficeId).toBe("function");
    expect(typeof getConsolidatorForBooking).toBe("function");
    expect(typeof queueToConsolidator).toBe("function");
  });

  it("exports backward-compatible getAmadeusStatus", () => {
    expect(typeof getAmadeusStatus).toBe("function");
  });
});

describe("Duffel Status", () => {
  it("returns correct status structure", () => {
    const status = getDuffelStatus();
    expect(status.provider).toBe("duffel");
    expect(status.isConnected).toBe(true);
    expect(status.tokenConfigured).toBe(true);
    expect(["live", "test"]).toContain(status.environment);
  });

  it("getAmadeusStatus returns Duffel info for backward compat", () => {
    const status = getAmadeusStatus();
    expect(status.provider).toBe("duffel");
    expect(status.isConnected).toBe(true);
  });
});

describe("Consolidator Compatibility Layer", () => {
  it("getConsolidatorConfig returns INSTANT ticketing mode", () => {
    const config = getConsolidatorConfig();
    expect(config.provider).toBe("duffel");
    expect(config.ticketingMode).toBe("INSTANT");
    expect(config.isConfigured).toBe(false);
    expect(config.consolidators).toEqual([]);
    expect(config.note).toContain("Duffel");
  });

  it("setActiveConsolidator returns same config (no-op)", () => {
    const config = setActiveConsolidator(0);
    expect(config.provider).toBe("duffel");
    expect(config.ticketingMode).toBe("INSTANT");
  });

  it("getConsolidatorForBooking returns null (no consolidator needed)", () => {
    const result = getConsolidatorForBooking();
    expect(result).toBeNull();
  });

  it("queueToConsolidator returns instant success", () => {
    const result = queueToConsolidator("ord_test123");
    expect(result.success).toBe(true);
    expect(result.orderId).toBe("ord_test123");
    expect(result.ticketingOption).toBe("INSTANT");
  });
});

describe("Offer Caching", () => {
  it("can cache and retrieve offers", () => {
    const mockOffer = { id: "test_offer_1", total_amount: "100", total_currency: "USD" };
    cacheOffer("test_offer_1", mockOffer);
    const cached = getCachedOffer("test_offer_1");
    expect(cached).toEqual(mockOffer);
  });

  it("getCachedRawOffer is alias for getCachedOffer", () => {
    cacheRawOffer("test_offer_2", { id: "test_offer_2" });
    const cached = getCachedRawOffer("test_offer_2");
    expect(cached).toBeTruthy();
    expect(cached.id).toBe("test_offer_2");
  });

  it("returns null for non-existent offers", () => {
    const cached = getCachedOffer("non_existent_offer");
    expect(cached).toBeNull();
  });
});
