import { describe, it, expect } from "vitest";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(__dirname, "../.env") });

describe("Amadeus Production API", () => {
  it("should authenticate with production keys", async () => {
    const clientId = process.env.AMADEUS_PROD_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_PROD_CLIENT_SECRET;

    expect(clientId, "AMADEUS_PROD_CLIENT_ID must be set").toBeTruthy();
    expect(clientSecret, "AMADEUS_PROD_CLIENT_SECRET must be set").toBeTruthy();

    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId!,
      client_secret: clientSecret!,
    });

    const tokenRes = await fetch("https://api.amadeus.com/v1/security/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    expect(tokenRes.ok, `Token request failed: ${tokenRes.status}`).toBe(true);
    const tokenData = await tokenRes.json() as any;
    expect(tokenData.access_token, "Should receive access token").toBeTruthy();
    console.log("✅ Amadeus Production: Token received, expires in", tokenData.expires_in, "s");
  }, 15000);
});
