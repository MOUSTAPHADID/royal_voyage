import { describe, it, expect, vi } from "vitest";

// Mock the Duffel SDK
vi.mock("@duffel/api", () => ({
  Duffel: vi.fn().mockImplementation(() => ({
    suggestions: {
      list: vi.fn().mockResolvedValue({
        data: [
          {
            type: "airport",
            name: "Nouakchott-Oumtounsy International Airport",
            iata_code: "NKC",
            city_name: "Nouakchott",
            city: { name: "Nouakchott", country: { name: "Mauritania" } },
          },
        ],
      }),
    },
    offerRequests: {
      create: vi.fn().mockResolvedValue({
        data: {
          offers: [
            {
              id: "off_test_001",
              owner: { iata_code: "AT", name: "Royal Air Maroc" },
              total_amount: "450.00",
              total_currency: "USD",
              slices: [
                {
                  segments: [
                    {
                      origin: { iata_code: "NKC", name: "Nouakchott" },
                      destination: { iata_code: "CMN", name: "Casablanca" },
                      departing_at: "2026-04-15T08:30:00",
                      arriving_at: "2026-04-15T12:45:00",
                      marketing_carrier: { iata_code: "AT" },
                      marketing_carrier_flight_number: "525",
                      passengers: [{ cabin_class: "economy" }],
                    },
                  ],
                },
              ],
              passengers: [{ id: "pas_test_001", type: "adult" }],
            },
          ],
        },
      }),
    },
    offers: {
      get: vi.fn().mockResolvedValue({
        data: {
          id: "off_test_001",
          total_amount: "450.00",
          total_currency: "USD",
          expires_at: "2026-04-14T23:59:59Z",
        },
      }),
    },
    orders: {
      create: vi.fn().mockResolvedValue({
        data: {
          id: "ord_test_001",
          booking_reference: "ABC123",
          owner: { iata_code: "AT" },
          documents: [
            { type: "electronic_ticket", unique_identifier: "1234567890123" },
          ],
          passengers: [
            {
              id: "pas_test_001",
              given_name: "AHMED",
              family_name: "MOHAMED",
              email: "test@example.com",
            },
          ],
          slices: [],
          payment_status: {},
          created_at: "2026-04-01T10:00:00Z",
        },
      }),
      get: vi.fn().mockResolvedValue({
        data: {
          id: "ord_test_001",
          booking_reference: "ABC123",
          owner: { iata_code: "AT" },
          passengers: [
            {
              id: "pas_test_001",
              given_name: "AHMED",
              family_name: "MOHAMED",
              born_on: "1990-01-01",
              gender: "m",
            },
          ],
          slices: [
            {
              segments: [
                {
                  origin: { iata_code: "NKC" },
                  destination: { iata_code: "CMN" },
                  departing_at: "2026-04-15T08:30:00",
                  arriving_at: "2026-04-15T12:45:00",
                  marketing_carrier: { iata_code: "AT" },
                  marketing_carrier_flight_number: "525",
                },
              ],
            },
          ],
          documents: [
            { type: "electronic_ticket", unique_identifier: "1234567890123" },
          ],
          total_amount: "450.00",
          total_currency: "USD",
          created_at: "2026-04-01T10:00:00Z",
        },
      }),
    },
    orderCancellations: {
      create: vi.fn().mockResolvedValue({
        data: {
          id: "ore_test_001",
          refund_amount: "400.00",
          refund_currency: "USD",
        },
      }),
      confirm: vi.fn().mockResolvedValue({ data: { id: "ore_test_001" } }),
    },
  })),
}));

describe("Duffel Integration - Flights Only", () => {
  it("should export all required functions", async () => {
    const m = await import("../server/duffel");
    expect(m.searchFlights).toBeDefined();
    expect(m.searchLocations).toBeDefined();
    expect(m.priceFlightOffer).toBeDefined();
    expect(m.createFlightOrder).toBeDefined();
    expect(m.getFlightOrder).toBeDefined();
    expect(m.cancelFlightOrder).toBeDefined();
    expect(m.checkTicketIssuance).toBeDefined();
    expect(m.getConsolidatorConfig).toBeDefined();
    expect(m.getDuffelStatus).toBeDefined();
    expect(m.cacheOffer).toBeDefined();
    expect(m.getCachedOffer).toBeDefined();
  });

  it("should search locations", async () => {
    const { searchLocations } = await import("../server/duffel");
    const results = await searchLocations("Nouakchott");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].iataCode).toBe("NKC");
    expect(results[0].type).toBe("AIRPORT");
  });

  it("should search flights and return formatted offers", async () => {
    const { searchFlights } = await import("../server/duffel");
    const results = await searchFlights({
      originCode: "NKC",
      destinationCode: "CMN",
      departureDate: "2026-04-15",
      adults: 1,
    });
    expect(results.length).toBeGreaterThan(0);
    const offer = results[0];
    expect(offer.id).toBe("off_test_001");
    expect(offer.airline).toBe("Royal Air Maroc");
    expect(offer.airlineCode).toBe("AT");
    expect(offer.originCode).toBe("NKC");
    expect(offer.destinationCode).toBe("CMN");
    expect(offer.price).toBe(450);
    expect(offer.currency).toBe("USD");
    expect(typeof offer.rawOffer).toBe("object");
  });

  it("should price a flight offer", async () => {
    const { priceFlightOffer } = await import("../server/duffel");
    const result = await priceFlightOffer({ id: "off_test_001" });
    expect(result.totalPrice).toBe(450);
    expect(result.currency).toBe("USD");
    expect(result.pricedOffer).toBeDefined();
  });

  it("should create a flight order with instant confirmation", async () => {
    const { createFlightOrder, cacheOffer } = await import("../server/duffel");
    cacheOffer("off_test_001", {
      id: "off_test_001",
      total_amount: "450.00",
      total_currency: "USD",
      passengers: [{ id: "pas_test_001", type: "adult" }],
    });
    const result = await createFlightOrder(
      { id: "off_test_001" },
      [{
        id: "1",
        dateOfBirth: "1990-01-01",
        firstName: "AHMED",
        lastName: "MOHAMED",
        gender: "MALE",
        email: "test@example.com",
        phone: "33700000",
        countryCallingCode: "222",
      }]
    );
    expect(result.orderId).toBe("ord_test_001");
    expect(result.pnr).toBe("ABC123");
    expect(result.documents.length).toBeGreaterThan(0);
    expect(result.documents[0].unique_identifier).toBe("1234567890123");
  });

  it("should get flight order status", async () => {
    const { getFlightOrder } = await import("../server/duffel");
    const result = await getFlightOrder("ord_test_001");
    expect(result.orderId).toBe("ord_test_001");
    expect(result.pnr).toBe("ABC123");
    expect(result.travelers.length).toBe(1);
    expect(result.travelers[0].firstName).toBe("AHMED");
    expect(result.segments.length).toBe(1);
    expect(result.ticketing.length).toBe(1);
  });

  it("should cancel a flight order", async () => {
    const { cancelFlightOrder } = await import("../server/duffel");
    const result = await cancelFlightOrder("ord_test_001");
    expect(result.success).toBe(true);
    expect(result.orderId).toBe("ord_test_001");
    expect(result.refundAmount).toBe("400.00");
  });

  it("should return Duffel-specific consolidator config (instant ticketing)", async () => {
    const { getConsolidatorConfig } = await import("../server/duffel");
    const config = getConsolidatorConfig();
    expect(config.provider).toBe("duffel");
    expect(config.ticketingMode).toBe("INSTANT");
    expect(config.isConfigured).toBe(false);
  });

  it("should cache and retrieve offers correctly", async () => {
    const { cacheOffer, getCachedOffer } = await import("../server/duffel");
    cacheOffer("cache_test", { id: "cache_test", price: 100 });
    expect(getCachedOffer("cache_test")).toEqual({ id: "cache_test", price: 100 });
    expect(getCachedOffer("non_existent")).toBeNull();
  });
});
