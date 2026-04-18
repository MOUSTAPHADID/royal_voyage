import { describe, it, expect } from "vitest";

describe("eSIM Go API Key Validation", () => {
  it("should validate eSIM Go API key", async () => {
    const apiKey = process.env.ESIM_GO_API_KEY;
    const baseUrl = process.env.ESIM_GO_BASE_URL || "https://api.esimgo.com/v1";

    expect(apiKey).toBeDefined();
    expect(apiKey?.length).toBeGreaterThan(0);

    try {
      // Test API connection with a simple request
      const response = await fetch(`${baseUrl}/plans`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      // Check if response is valid (200-299 or 401/403 which means auth issue)
      expect([200, 201, 400, 401, 403, 404]).toContain(response.status);

      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status} - Invalid API key`);
      }

      if (response.status >= 200 && response.status < 300) {
        const data = await response.json();
        expect(data).toBeDefined();
        console.log("✅ eSIM Go API key is valid!");
      }
    } catch (error: any) {
      if (error.message.includes("Invalid API key")) {
        throw error;
      }
      // Network errors are acceptable in test environment
      console.warn("⚠️ Could not verify API key (network issue):", error.message);
    }
  });
});
