import { describe, it, expect } from "vitest";
import { searchActivities } from "../server/hbx";

describe("HBX Activities API", () => {
  it("should successfully connect to HBX Activities API with valid credentials", async () => {
    // Test with Barcelona (BCN) for next 7 days
    const today = new Date();
    const fromDate = today.toISOString().slice(0, 10);
    const toDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const activities = await searchActivities({
      destinationCode: "BCN",
      fromDate,
      toDate,
    });

    // If credentials are valid, we should get an array (even if empty)
    expect(Array.isArray(activities)).toBe(true);
    
    // If we get activities, verify structure
    if (activities.length > 0) {
      const activity = activities[0];
      expect(activity).toHaveProperty("code");
      expect(activity).toHaveProperty("name");
      expect(activity).toHaveProperty("minPrice");
      expect(activity).toHaveProperty("currency");
    }
  }, 15000); // 15 second timeout for API call
});
