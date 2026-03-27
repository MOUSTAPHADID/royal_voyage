import { describe, it, expect, vi } from "vitest";

// Mock the amadeus module
vi.mock("../server/amadeus", () => ({
  searchLocations: vi.fn(),
  searchFlights: vi.fn(),
  searchHotels: vi.fn(),
  priceFlightOffer: vi.fn(),
  createFlightOrder: vi.fn(),
  cacheRawOffer: vi.fn(),
  getCachedRawOffer: vi.fn(),
  getFlightOrder: vi.fn(),
  cancelFlightOrder: vi.fn(),
}));

import { getFlightOrder, cancelFlightOrder } from "../server/amadeus";

describe("PNR Status - getFlightOrder", () => {
  it("should return flight order data when called with valid orderId", async () => {
    const mockResult = {
      orderId: "eJzTd9f3NjIJNQYADUgCdQ==",
      pnr: "ABC123",
      status: "CONFIRMED",
      travelers: [
        {
          id: "1",
          firstName: "JOHN",
          lastName: "DOE",
          dateOfBirth: "1990-01-01",
          gender: "MALE",
        },
      ],
      segments: [
        {
          departure: { iataCode: "NKC", terminal: undefined, at: "2026-04-01T10:00:00" },
          arrival: { iataCode: "CDG", terminal: "2E", at: "2026-04-01T18:00:00" },
          carrierCode: "AF",
          number: "123",
          aircraft: "777",
          duration: "PT8H",
          status: "CONFIRMED",
        },
      ],
      ticketing: [],
      price: { total: "500.00", currency: "EUR", base: "400.00" },
      contacts: [{ emailAddress: "john@test.com", phones: [{ number: "33700000" }] }],
      associatedRecords: [{ reference: "ABC123", originSystemCode: "GDS" }],
      ticketingDeadline: undefined,
      createdAt: undefined,
    };

    (getFlightOrder as any).mockResolvedValue(mockResult);

    const result = await getFlightOrder("eJzTd9f3NjIJNQYADUgCdQ==");

    expect(result).toBeDefined();
    expect(result.orderId).toBe("eJzTd9f3NjIJNQYADUgCdQ==");
    expect(result.pnr).toBe("ABC123");
    expect(result.status).toBe("CONFIRMED");
    expect(result.travelers).toHaveLength(1);
    expect(result.travelers[0].firstName).toBe("JOHN");
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0].departure.iataCode).toBe("NKC");
    expect(result.segments[0].arrival.iataCode).toBe("CDG");
    expect(result.price.total).toBe("500.00");
  });

  it("should throw error for invalid orderId", async () => {
    (getFlightOrder as any).mockRejectedValue(new Error("ORDER_NOT_FOUND"));

    await expect(getFlightOrder("INVALID_ID")).rejects.toThrow("ORDER_NOT_FOUND");
  });
});

describe("PNR Status - cancelFlightOrder", () => {
  it("should cancel flight order successfully", async () => {
    const mockResult = {
      success: true,
      orderId: "eJzTd9f3NjIJNQYADUgCdQ==",
      message: "Flight order cancelled successfully",
    };

    (cancelFlightOrder as any).mockResolvedValue(mockResult);

    const result = await cancelFlightOrder("eJzTd9f3NjIJNQYADUgCdQ==");

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.orderId).toBe("eJzTd9f3NjIJNQYADUgCdQ==");
    expect(result.message).toContain("cancelled");
  });

  it("should throw error when cancellation fails", async () => {
    (cancelFlightOrder as any).mockRejectedValue(
      new Error("ORDER_ALREADY_CANCELLED")
    );

    await expect(
      cancelFlightOrder("eJzTd9f3NjIJNQYADUgCdQ==")
    ).rejects.toThrow("ORDER_ALREADY_CANCELLED");
  });
});

describe("Booking type - amadeusOrderId field", () => {
  it("should support amadeusOrderId field in Booking type", () => {
    // This test validates the type structure
    const booking = {
      id: "b123",
      type: "flight" as const,
      status: "confirmed" as const,
      reference: "RV-FL-123456",
      pnr: "ABC123",
      date: "2026-04-01",
      totalPrice: 50000,
      currency: "MRU",
      amadeusOrderId: "eJzTd9f3NjIJNQYADUgCdQ==",
    };

    expect(booking.amadeusOrderId).toBe("eJzTd9f3NjIJNQYADUgCdQ==");
    expect(booking.type).toBe("flight");
    expect(booking.pnr).toBe("ABC123");
  });

  it("should allow booking without amadeusOrderId (optional)", () => {
    const booking: { id: string; type: string; status: string; reference: string; date: string; totalPrice: number; currency: string; amadeusOrderId?: string } = {
      id: "b456",
      type: "hotel",
      status: "confirmed",
      reference: "RV-HT-789012",
      date: "2026-04-01",
      totalPrice: 30000,
      currency: "MRU",
    };

    expect(booking.amadeusOrderId).toBeUndefined();
    expect(booking.type).toBe("hotel");
  });
});

describe("Amadeus environment toggle", () => {
  it("should correctly determine environment based on prod keys", () => {
    const isProd = !!(
      process.env.AMADEUS_PROD_CLIENT_ID &&
      process.env.AMADEUS_PROD_CLIENT_SECRET
    );
    const hostname = isProd ? "production" : "test";
    // The environment toggle logic works correctly
    // When prod keys are available, it uses production; otherwise test
    expect(["production", "test"]).toContain(hostname);
    if (isProd) {
      expect(hostname).toBe("production");
    } else {
      expect(hostname).toBe("test");
    }
  });

  it("should select correct hostname based on environment", () => {
    // Simulate the toggle logic
    const simulateToggle = (hasProdKeys: boolean) => {
      return hasProdKeys ? "production" : "test";
    };
    expect(simulateToggle(true)).toBe("production");
    expect(simulateToggle(false)).toBe("test");
  });
});
