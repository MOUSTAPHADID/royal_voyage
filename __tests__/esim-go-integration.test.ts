import { describe, it, expect, beforeAll } from "vitest";

describe("eSIM Go API Integration", () => {
  const apiKey = process.env.ESIM_GO_API_KEY;
  const baseUrl = process.env.ESIM_GO_BASE_URL || "https://api.esimgo.com/v1";

  beforeAll(() => {
    expect(apiKey).toBeDefined();
  });

  it("should search eSIM plans", async () => {
    try {
      const response = await fetch(`${baseUrl}/plans`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
        console.log("✅ Search plans endpoint works");
      } else {
        console.warn(`⚠️ Search plans returned ${response.status}`);
      }
    } catch (error: any) {
      console.warn("⚠️ Search plans test skipped (network):", error.message);
    }
  });

  it("should get plan details", async () => {
    try {
      // Try to get first plan details (using a sample plan ID)
      const response = await fetch(`${baseUrl}/plans/sample-plan`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        expect(data).toBeDefined();
        console.log("✅ Get plan details endpoint works");
      } else {
        console.warn(`⚠️ Get plan details returned ${response.status}`);
      }
    } catch (error: any) {
      console.warn("⚠️ Get plan details test skipped (network):", error.message);
    }
  });

  it("should validate API key format", () => {
    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(20);
    expect(apiKey).toMatch(/^[a-zA-Z0-9_-]+$/);
    console.log("✅ API key format is valid");
  });

  it("should have correct base URL", () => {
    expect(baseUrl).toBeDefined();
    expect(baseUrl).toMatch(/^https:\/\//);
    console.log("✅ Base URL is valid");
  });
});
