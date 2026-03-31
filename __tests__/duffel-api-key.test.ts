import { describe, it, expect } from "vitest";

describe("Duffel API Key Validation", () => {
  it("should have DUFFEL_API_TOKEN configured", () => {
    const token = process.env.DUFFEL_API_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(10);
  });

  it("should be able to connect to Duffel API", async () => {
    const token = process.env.DUFFEL_API_TOKEN;
    if (!token) {
      throw new Error("DUFFEL_API_TOKEN not set");
    }

    // Make a lightweight API call to verify the token works
    const response = await fetch("https://api.duffel.com/air/airports?limit=1", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Duffel-Version": "v2",
        "Accept": "application/json",
      },
    });

    // Token should be valid - we expect 200 OK
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toBeDefined();
  });
});
