import { describe, it, expect, vi, beforeAll } from "vitest";
import crypto from "crypto";

// Mock environment variables before importing hbx module
beforeAll(() => {
  process.env.HBX_API_KEY = "3c39f4bcc6d899c85a5a911534ce5542";
  process.env.HBX_API_SECRET = "6d78849409";
  process.env.HBX_USE_PRODUCTION = "false";
});

// Mock fetch to avoid real API calls in unit tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  searchHotelsByCityCode,
  checkRate,
  getHBXStatus,
} from "../server/hbx";

describe("HBX API Service", () => {
  it("should generate a valid SHA256 signature", () => {
    const key = "3c39f4bcc6d899c85a5a911534ce5542";
    const secret = "6d78849409";
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = crypto.createHash("sha256").update(key + secret + ts).digest("hex");

    expect(sig).toHaveLength(64);
    expect(sig).toMatch(/^[a-f0-9]+$/);
  });

  it("should return empty array when API returns no hotels", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hotels: { hotels: [], currency: "USD" } }),
    });

    const results = await searchHotelsByCityCode({
      cityCode: "XYZ",
      checkInDate: "2026-06-15",
      checkOutDate: "2026-06-17",
      adults: 2,
      rooms: 1,
    });

    expect(results).toBeInstanceOf(Array);
    expect(results).toHaveLength(0);
  });

  it("should map HBX hotel response to HBXHotelOffer format", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        hotels: {
          hotels: [
            {
              code: 12345,
              name: "Test Hotel Barcelona",
              categoryCode: "4EST",
              categoryName: "4 Stars",
              destinationName: "Barcelona",
              countryCode: "ES",
              latitude: "41.3851",
              longitude: "2.1734",
              minRate: "200.00",
              maxRate: "250.00",
              rooms: [
                {
                  rates: [
                    {
                      rateKey: "20260615|20260617|W|1|12345|DBL.ST|NRF|BB|2|0|1~2~0||N@123",
                      rateType: "BOOKABLE",
                      net: "200.00",
                      boardCode: "BB",
                      boardName: "Bed and Breakfast",
                      cancellationPolicies: [],
                    },
                  ],
                },
              ],
            },
          ],
          currency: "EUR",
        },
      }),
    });

    const results = await searchHotelsByCityCode({
      cityCode: "BCN",
      checkInDate: "2026-06-15",
      checkOutDate: "2026-06-17",
      adults: 2,
      rooms: 1,
    });

    expect(results).toHaveLength(1);
    const hotel = results[0];
    expect(hotel.id).toBe("hbx_12345");
    expect(hotel.hotelId).toBe("12345");
    expect(hotel.name).toBe("Test Hotel Barcelona");
    expect(hotel.stars).toBe(4);
    expect(hotel.currency).toBe("EUR");
    expect(hotel.rateKey).toBeTruthy();
    expect(hotel.pricePerNight).toBeGreaterThan(0);
  });

  it("should return null when checkRate fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    const result = await checkRate("invalid-rate-key");
    expect(result).toBeNull();
  });

  it("should return HBX status correctly", () => {
    const status = getHBXStatus();

    expect(status).toHaveProperty("configured");
    expect(status).toHaveProperty("mode");
    expect(status.configured).toBe(true);
    expect(status.mode).toBe("test");
  });
});
