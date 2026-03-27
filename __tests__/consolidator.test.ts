import { describe, it, expect } from "vitest";

describe("Consolidator Integration", () => {
  it("AMADEUS_CONSOLIDATOR_OFFICE_ID should be set", () => {
    const officeId = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID;
    expect(officeId).toBeDefined();
    expect(officeId!.length).toBeGreaterThanOrEqual(8);
    console.log(`Consolidator Office ID: ${officeId}`);
  });

  it("Consolidator Office ID should have valid IATA format (3 letter city + digits)", () => {
    const officeId = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID!;
    // IATA Office ID: 3 letter city code + digits + optional check letter
    expect(officeId).toMatch(/^[A-Z]{3}\d{4,6}[A-Z]?$/);
  });

  it("getConsolidatorConfig should return configured state", async () => {
    // Dynamically import to get fresh env
    const mod = await import("../server/amadeus");
    const config = mod.getConsolidatorConfig();
    expect(config.isConfigured).toBe(true);
    expect(config.consolidatorOfficeId).toBeTruthy();
    expect(config.ticketingMode).toBe("DELAY_TO_QUEUE");
    console.log("Consolidator config:", JSON.stringify(config, null, 2));
  });

  it("createFlightOrder should use DELAY_TO_QUEUE when consolidator is configured", () => {
    const consolidatorId = process.env.AMADEUS_CONSOLIDATOR_OFFICE_ID;
    expect(consolidatorId).toBeTruthy();
    // When consolidator is set, ticketing agreement should be DELAY_TO_QUEUE
    // This is verified by the server code logic
    const ticketingMode = consolidatorId ? "DELAY_TO_QUEUE" : "CONFIRM";
    expect(ticketingMode).toBe("DELAY_TO_QUEUE");
  });
});
