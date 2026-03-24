import { describe, it, expect } from "vitest";

/**
 * Test: Amadeus API credentials validation
 * Calls the Amadeus OAuth token endpoint to verify credentials are valid.
 */
describe("Amadeus API Credentials", () => {
  it("should obtain an access token using the provided credentials", async () => {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    expect(clientId, "AMADEUS_CLIENT_ID must be set").toBeTruthy();
    expect(clientSecret, "AMADEUS_CLIENT_SECRET must be set").toBeTruthy();

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId!,
      client_secret: clientSecret!,
    });

    const response = await fetch(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );

    const data = (await response.json()) as any;

    expect(response.status, `Amadeus returned HTTP ${response.status}: ${JSON.stringify(data)}`).toBe(200);
    expect(data.access_token, "access_token should be present in response").toBeTruthy();
    expect(data.token_type).toBe("Bearer");

    console.log("[Amadeus] ✅ Token obtained successfully. Expires in:", data.expires_in, "seconds");
  }, 15000);
});
