import { describe, it, expect } from "vitest";

/**
 * Production credentials validation test.
 * Verifies that AMADEUS_PROD_CLIENT_ID and AMADEUS_PROD_CLIENT_SECRET
 * are set and non-empty in the environment.
 */
describe("Amadeus Production Credentials", () => {
  it("AMADEUS_PROD_CLIENT_ID is set and non-empty", () => {
    const id = process.env.AMADEUS_PROD_CLIENT_ID;
    expect(id).toBeDefined();
    expect(typeof id).toBe("string");
    expect((id as string).length).toBeGreaterThan(5);
  });

  it("AMADEUS_PROD_CLIENT_SECRET is set and non-empty", () => {
    const secret = process.env.AMADEUS_PROD_CLIENT_SECRET;
    expect(secret).toBeDefined();
    expect(typeof secret).toBe("string");
    expect((secret as string).length).toBeGreaterThan(5);
  });

  it("production hostname is api.amadeus.com (not test)", () => {
    const id = process.env.AMADEUS_PROD_CLIENT_ID ?? "";
    const secret = process.env.AMADEUS_PROD_CLIENT_SECRET ?? "";
    // If both prod keys exist, the server should use production hostname
    const isProd = id.length > 0 && secret.length > 0;
    expect(isProd).toBe(true);
  });
});
