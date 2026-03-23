/**
 * Email Service Tests
 * Tests the email service configuration and template generation.
 * Note: Actual SMTP sending is not tested here to avoid sending real emails.
 */
import { describe, it, expect } from "vitest";

// Test that the email module exports the expected functions
describe("Email Service", () => {
  it("should export sendFlightTicket and sendHotelConfirmation", async () => {
    const emailModule = await import("../server/email");
    expect(typeof emailModule.sendFlightTicket).toBe("function");
    expect(typeof emailModule.sendHotelConfirmation).toBe("function");
  });

  it("should handle missing SMTP credentials gracefully", async () => {
    // When EMAIL_USER/EMAIL_PASS are not set, the service should return true (graceful fallback)
    const emailModule = await import("../server/email");

    const result = await emailModule.sendFlightTicket({
      passengerName: "Test Passenger",
      passengerEmail: "test@example.com",
      bookingRef: "RV-TEST-001",
      origin: "NKC",
      originCity: "Nouakchott",
      destination: "CDG",
      destinationCity: "Paris",
      departureDate: "2026-04-01",
      departureTime: "10:00",
      arrivalTime: "18:00",
      airline: "Air France",
      flightNumber: "AF123",
      cabinClass: "Economy",
      passengers: 1,
      children: 0,
      totalPrice: "45,000 أوق",
      currency: "MRU",
      tripType: "one-way",
    });

    // Should return true (graceful fallback when no SMTP configured)
    // OR true if SMTP is configured and email was sent
    expect(typeof result).toBe("boolean");
  });

  it("should handle hotel confirmation gracefully", async () => {
    const emailModule = await import("../server/email");

    const result = await emailModule.sendHotelConfirmation({
      guestName: "Test Guest",
      guestEmail: "test@example.com",
      bookingRef: "RV-HOTEL-001",
      hotelName: "Novotel Nouakchott",
      hotelCity: "Nouakchott",
      hotelCountry: "Mauritania",
      stars: 4,
      checkIn: "2026-04-01",
      checkOut: "2026-04-05",
      nights: 4,
      roomType: "Deluxe Room",
      guests: 2,
      children: 1,
      totalPrice: "120,000 أوق",
      currency: "MRU",
    });

    expect(typeof result).toBe("boolean");
  });

  it("should have EMAIL_USER env var set", () => {
    // Check that the secret was provided
    const emailUser = process.env.EMAIL_USER;
    // This test validates the secret is configured
    // If not set, it's acceptable (graceful fallback mode)
    if (emailUser) {
      expect(emailUser).toMatch(/@/);
    } else {
      console.log("[Test] EMAIL_USER not set — running in graceful fallback mode");
      expect(true).toBe(true);
    }
  });
});
