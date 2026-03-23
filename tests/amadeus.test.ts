import { describe, it, expect, vi } from "vitest";

// ─── Mock the Amadeus SDK ─────────────────────────────────────────────────────
vi.mock("amadeus", () => {
  const mockAmadeus = vi.fn().mockImplementation(() => ({
    referenceData: {
      locations: {
        get: vi.fn().mockResolvedValue({
          data: [
            {
              iataCode: "DXB",
              name: "Dubai International Airport",
              subType: "AIRPORT",
              address: { cityName: "Dubai", countryName: "United Arab Emirates" },
            },
            {
              iataCode: "CMN",
              name: "Mohammed V International Airport",
              subType: "AIRPORT",
              address: { cityName: "Casablanca", countryName: "Morocco" },
            },
          ],
        }),
        hotels: {
          byCity: {
            get: vi.fn().mockResolvedValue({
              data: [
                {
                  hotelId: "ADPAR001",
                  name: "Burj Al Arab",
                  rating: "5",
                  geoCode: { latitude: 25.1412, longitude: 55.1853 },
                  address: { cityName: "Dubai", countryCode: "AE", lines: ["Jumeirah Beach Road"] },
                  amenities: ["SWIMMING_POOL", "WIFI", "SPA", "RESTAURANT"],
                },
                {
                  hotelId: "ADPAR002",
                  name: "Atlantis The Palm",
                  rating: "5",
                  geoCode: { latitude: 25.1304, longitude: 55.1174 },
                  address: { cityName: "Dubai", countryCode: "AE", lines: ["Palm Jumeirah"] },
                  amenities: ["SWIMMING_POOL", "WIFI", "BEACH"],
                },
              ],
            }),
          },
        },
      },
    },
    shopping: {
      flightOffersSearch: {
        get: vi.fn().mockResolvedValue({
          data: [
            {
              id: "1",
              validatingAirlineCodes: ["EK"],
              price: { total: "450.00", currency: "USD" },
              numberOfBookableSeats: 7,
              itineraries: [
                {
                  duration: "PT4H30M",
                  segments: [
                    {
                      carrierCode: "EK",
                      number: "201",
                      departure: { iataCode: "CMN", at: "2026-05-01T08:00:00" },
                      arrival: { iataCode: "DXB", at: "2026-05-01T16:30:00" },
                    },
                  ],
                },
              ],
              travelerPricings: [
                { fareDetailsBySegment: [{ cabin: "ECONOMY" }] },
              ],
            },
          ],
        }),
      },
      hotelOffersSearch: {
        get: vi.fn().mockResolvedValue({
          data: [
            {
              hotel: { hotelId: "ADPAR001" },
              offers: [{ price: { total: "850.00", currency: "USD" } }],
            },
          ],
        }),
      },
    },
  }));
  return { default: mockAmadeus };
});

// ─── Import after mock ────────────────────────────────────────────────────────
import {
  searchFlights,
  searchLocations,
  searchHotelsByCity,
} from "../server/amadeus";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Amadeus API Service", () => {
  describe("searchLocations", () => {
    it("returns empty array for keyword shorter than 2 chars", async () => {
      const result = await searchLocations("D");
      expect(result).toEqual([]);
    });

    it("returns location suggestions for valid keyword", async () => {
      const result = await searchLocations("Dubai");
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        iataCode: "DXB",
        cityName: "Dubai",
        countryName: "United Arab Emirates",
        type: "AIRPORT",
      });
    });

    it("maps subType correctly to AIRPORT or CITY", async () => {
      const result = await searchLocations("CMN");
      const types = result.map((r) => r.type);
      expect(types.every((t) => t === "AIRPORT" || t === "CITY")).toBe(true);
    });
  });

  describe("searchFlights", () => {
    it("returns flight offers with correct structure", async () => {
      const flights = await searchFlights({
        originCode: "CMN",
        destinationCode: "DXB",
        departureDate: "2026-05-01",
        adults: 1,
      });

      expect(flights).toHaveLength(1);
      const flight = flights[0];
      expect(flight).toMatchObject({
        id: "1",
        airline: "Emirates",
        airlineCode: "EK",
        flightNumber: "EK 201",
        originCode: "CMN",
        destinationCode: "DXB",
        departureTime: "08:00",
        arrivalTime: "16:30",
        duration: "4h 30m",
        stops: 0,
        price: 450.0,
        currency: "USD",
        class: "ECONOMY",
        seatsLeft: 7,
      });
    });

    it("parses ISO duration correctly", async () => {
      const flights = await searchFlights({
        originCode: "CMN",
        destinationCode: "DXB",
        departureDate: "2026-05-01",
        adults: 1,
      });
      expect(flights[0].duration).toBe("4h 30m");
    });

    it("resolves airline name from code", async () => {
      const flights = await searchFlights({
        originCode: "CMN",
        destinationCode: "DXB",
        departureDate: "2026-05-01",
        adults: 1,
      });
      expect(flights[0].airline).toBe("Emirates");
    });
  });

  describe("searchHotelsByCity", () => {
    it("returns hotel list with correct structure", async () => {
      const hotels = await searchHotelsByCity({
        cityCode: "DXB",
        checkInDate: "2026-05-01",
        checkOutDate: "2026-05-04",
        adults: 2,
      });

      expect(hotels.length).toBeGreaterThan(0);
      const hotel = hotels[0];
      expect(hotel).toMatchObject({
        hotelId: "ADPAR001",
        name: "Burj Al Arab",
        city: "Dubai",
        country: "AE",
        stars: 5,
        pricePerNight: 850.0,
        currency: "USD",
      });
    });

    it("includes amenities formatted correctly", async () => {
      const hotels = await searchHotelsByCity({
        cityCode: "DXB",
        checkInDate: "2026-05-01",
        checkOutDate: "2026-05-04",
        adults: 2,
      });
      const amenities = hotels[0].amenities;
      expect(Array.isArray(amenities)).toBe(true);
      // Should be title-cased
      expect(amenities[0]).toMatch(/^[A-Z]/);
    });

    it("includes hotel image URL", async () => {
      const hotels = await searchHotelsByCity({
        cityCode: "DXB",
        checkInDate: "2026-05-01",
        checkOutDate: "2026-05-04",
        adults: 2,
      });
      expect(hotels[0].image).toMatch(/^https:\/\//);
    });
  });
});
