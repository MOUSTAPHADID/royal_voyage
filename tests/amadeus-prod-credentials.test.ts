import { describe, it, expect } from "vitest";

/**
 * Test: Amadeus Production API credentials validation
 */
describe("Amadeus Production API Credentials", () => {
  it("should obtain an access token from Production API", async () => {
    const clientId = process.env.AMADEUS_PROD_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_PROD_CLIENT_SECRET;

    expect(clientId, "AMADEUS_PROD_CLIENT_ID must be set").toBeTruthy();
    expect(clientSecret, "AMADEUS_PROD_CLIENT_SECRET must be set").toBeTruthy();

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId!,
      client_secret: clientSecret!,
    });

    const response = await fetch(
      "https://api.amadeus.com/v1/security/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }
    );

    const data = (await response.json()) as any;

    expect(response.status, `Amadeus Production returned HTTP ${response.status}: ${JSON.stringify(data)}`).toBe(200);
    expect(data.access_token, "access_token should be present").toBeTruthy();
    expect(data.token_type).toBe("Bearer");

    console.log("[Amadeus Production] ✅ Token obtained. App:", data.application_name, "| Expires in:", data.expires_in, "s");
  }, 15000);
});
