import { describe, it, expect } from "vitest";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env") });

describe("Amadeus Hotel Search API", () => {
  it("should authenticate and search hotels in Paris", async () => {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    expect(clientId, "AMADEUS_CLIENT_ID must be set").toBeTruthy();
    expect(clientSecret, "AMADEUS_CLIENT_SECRET must be set").toBeTruthy();

    // Step 1: Get access token
    const tokenRes = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId!,
        client_secret: clientSecret!,
      }),
    });

    expect(tokenRes.ok, `Token request failed: ${tokenRes.status}`).toBe(true);
    const tokenData = await tokenRes.json() as any;
    expect(tokenData.access_token, "Should receive access token").toBeTruthy();

    const token = tokenData.access_token;

    // Step 2: Search hotels by city
    const searchRes = await fetch(
      "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=PAR&ratings=3,4,5",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    expect(searchRes.ok, `Hotel search failed: ${searchRes.status}`).toBe(true);
    const searchData = await searchRes.json() as any;
    expect(Array.isArray(searchData.data), "Should return array of hotels").toBe(true);
    expect(searchData.data.length, "Should find hotels in Paris").toBeGreaterThan(0);

    console.log(`✅ Amadeus Hotels: Found ${searchData.data.length} hotels in Paris`);
  }, 30000);
});
