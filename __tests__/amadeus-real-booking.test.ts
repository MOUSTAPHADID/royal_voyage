/**
 * Real Booking Test — Amadeus Production
 * Creates an actual PNR on Amadeus Production with a test passenger.
 *
 * ⚠️  WARNING: This test creates a REAL booking on Amadeus Production.
 *     The PNR will be queued to the consolidator (NKC262203) for ticketing.
 *     Only run this test when you want to verify end-to-end PNR issuance.
 *
 * Set RUN_REAL_BOOKING=true to enable this test.
 */
import { describe, it, expect, beforeAll } from "vitest";
import "dotenv/config";

const RUN_REAL_BOOKING = process.env.RUN_REAL_BOOKING === "true";
const CLIENT_ID = process.env.AMADEUS_PROD_CLIENT_ID!;
const CLIENT_SECRET = process.env.AMADEUS_PROD_CLIENT_SECRET!;
const CONSOLIDATOR_OFFICE_ID = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID || "";
const BASE_URL = "https://api.amadeus.com";

// Test passenger — use a real person's data for actual booking
const TEST_PASSENGER = {
  firstName: "AHMED",
  lastName: "OULD",
  dateOfBirth: "1990-01-15",
  gender: "MALE",
  email: "royal-voyage@gmail.com",
  phone: "33700000",
  countryCallingCode: "222",
};

let accessToken = "";
let rawOffer: any = null;
let pricedOffer: any = null;
let createdOrderId = "";
let createdPnr = "";

describe("Amadeus Real Booking — Production PNR Issuance", () => {
  beforeAll(async () => {
    if (!RUN_REAL_BOOKING) return;

    // Authenticate
    const res = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });
    const data = await res.json() as any;
    accessToken = data.access_token;
  }, 30000);

  it("should skip if RUN_REAL_BOOKING is not set", () => {
    if (!RUN_REAL_BOOKING) {
      console.log("⏭️  Skipping real booking test — set RUN_REAL_BOOKING=true to enable");
      console.log("   This test creates a REAL PNR on Amadeus Production");
      console.log("   Usage: RUN_REAL_BOOKING=true pnpm test amadeus-real-booking");
      return;
    }
    expect(accessToken).toBeTruthy();
    console.log("🚀 Real booking test ENABLED — will create actual PNR");
  });

  it("should search for available flight", async () => {
    if (!RUN_REAL_BOOKING) return;
    expect(accessToken).toBeTruthy();

    // Search 30 days ahead for availability
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const departureDate = futureDate.toISOString().split("T")[0];

    const res = await fetch(
      `${BASE_URL}/v2/shopping/flight-offers?originLocationCode=NKC&destinationLocationCode=CMN&departureDate=${departureDate}&adults=1&max=5&currencyCode=USD`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    expect(res.ok).toBe(true);
    const data = await res.json() as any;
    const offers = data?.data || [];
    expect(offers.length).toBeGreaterThan(0);

    rawOffer = offers[0];
    console.log(`✅ Found flight: ${rawOffer.id}`);
    console.log(`   Route: NKC → CMN`);
    console.log(`   Price: ${rawOffer.price?.total} ${rawOffer.price?.currency}`);
    console.log(`   Airline: ${rawOffer.validatingAirlineCodes?.[0]}`);
    console.log(`   Date: ${departureDate}`);
  }, 60000);

  it("should price the flight offer", async () => {
    if (!RUN_REAL_BOOKING || !rawOffer) return;

    const res = await fetch(`${BASE_URL}/v1/shopping/flight-offers/pricing`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-HTTP-Method-Override": "GET",
      },
      body: JSON.stringify({
        data: {
          type: "flight-offers-pricing",
          flightOffers: [rawOffer],
        },
      }),
    });

    expect(res.ok).toBe(true);
    const data = await res.json() as any;
    pricedOffer = data?.data?.flightOffers?.[0];
    expect(pricedOffer).toBeTruthy();

    console.log(`✅ Priced: ${pricedOffer.price?.total} ${pricedOffer.price?.currency}`);
    console.log(`   Last ticketing: ${pricedOffer.lastTicketingDate}`);
  }, 60000);

  it("should create a real flight order (PNR)", async () => {
    if (!RUN_REAL_BOOKING || !pricedOffer) return;

    const traveler = {
      id: "1",
      dateOfBirth: TEST_PASSENGER.dateOfBirth,
      name: {
        firstName: TEST_PASSENGER.firstName,
        lastName: TEST_PASSENGER.lastName,
      },
      gender: TEST_PASSENGER.gender,
      contact: {
        emailAddress: TEST_PASSENGER.email,
        phones: [
          {
            deviceType: "MOBILE",
            countryCallingCode: TEST_PASSENGER.countryCallingCode,
            number: TEST_PASSENGER.phone,
          },
        ],
      },
      documents: [],
    };

    const orderData: any = {
      type: "flight-order",
      flightOffers: [pricedOffer],
      travelers: [traveler],
      remarks: {
        general: [
          {
            subType: "GENERAL_MISCELLANEOUS",
            text: "ONLINE BOOKING FROM ROYAL VOYAGE - TEST",
          },
        ],
      },
      ticketingAgreement: CONSOLIDATOR_OFFICE_ID
        ? {
            option: "DELAY_TO_QUEUE",
            dateTimeInformation: {
              dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 19),
            },
          }
        : { option: "CONFIRM" },
      contacts: [
        {
          addresseeName: { firstName: "ROYAL", lastName: "VOYAGE" },
          purpose: "STANDARD",
          emailAddress: "royal-voyage@gmail.com",
          phones: [
            {
              deviceType: "MOBILE",
              countryCallingCode: "222",
              number: "33700000",
            },
          ],
          address: {
            lines: ["Tavragh Zeina"],
            cityName: "Nouakchott",
            countryCode: "MR",
          },
        },
      ],
    };

    if (CONSOLIDATOR_OFFICE_ID) {
      orderData.queuingOfficeId = CONSOLIDATOR_OFFICE_ID;
    }

    const res = await fetch(`${BASE_URL}/v1/booking/flight-orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: orderData }),
    });

    if (!res.ok) {
      const err = await res.json() as any;
      console.error("❌ Booking failed:", JSON.stringify(err?.errors, null, 2));
      throw new Error(`Booking failed: ${err?.errors?.[0]?.detail || "Unknown error"}`);
    }

    const data = await res.json() as any;
    const order = data?.data;
    const records = order?.associatedRecords || [];
    createdPnr = records[0]?.reference || "";
    createdOrderId = order?.id || "";

    expect(createdPnr).toBeTruthy();
    expect(createdOrderId).toBeTruthy();

    console.log("\n🎉 REAL PNR CREATED SUCCESSFULLY!");
    console.log("================================");
    console.log(`   PNR: ${createdPnr}`);
    console.log(`   Order ID: ${createdOrderId}`);
    console.log(`   Passenger: ${TEST_PASSENGER.firstName} ${TEST_PASSENGER.lastName}`);
    console.log(`   Consolidator: ${CONSOLIDATOR_OFFICE_ID || "N/A"}`);
    console.log(`   Ticketing: ${CONSOLIDATOR_OFFICE_ID ? "DELAY_TO_QUEUE (24h)" : "CONFIRM"}`);
    console.log("================================\n");
    console.log("⚠️  Remember to cancel this booking if it was a test!");
    console.log(`   Cancel URL: DELETE ${BASE_URL}/v1/booking/flight-orders/${createdOrderId}`);
  }, 120000);

  it("should verify the created order details", async () => {
    if (!RUN_REAL_BOOKING || !createdOrderId) return;

    const res = await fetch(`${BASE_URL}/v1/booking/flight-orders/${createdOrderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    expect(res.ok).toBe(true);
    const data = await res.json() as any;
    const order = data?.data;

    expect(order?.id).toBe(createdOrderId);
    console.log(`✅ Order verified: ${order?.id}`);
    console.log(`   Status: ${order?.flightOffers?.[0]?.lastTicketingDate ? "Active" : "Unknown"}`);
    console.log(`   PNR: ${order?.associatedRecords?.[0]?.reference}`);
  }, 60000);
});
