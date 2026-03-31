import { describe, it, expect, beforeAll } from "vitest";

// Test the top-up and balance transaction DB functions
// These tests verify the schema and function signatures are correct

describe("Top-Up Balance System", () => {
  let dbModule: any;

  beforeAll(async () => {
    dbModule = await import("../server/db");
  });

  it("should export getTopUpRequests function", () => {
    expect(typeof dbModule.getTopUpRequests).toBe("function");
  });

  it("should export getTopUpRequestsByAccount function", () => {
    expect(typeof dbModule.getTopUpRequestsByAccount).toBe("function");
  });

  it("should export getTopUpRequestById function", () => {
    expect(typeof dbModule.getTopUpRequestById).toBe("function");
  });

  it("should export createTopUpRequest function", () => {
    expect(typeof dbModule.createTopUpRequest).toBe("function");
  });

  it("should export approveTopUpRequest function", () => {
    expect(typeof dbModule.approveTopUpRequest).toBe("function");
  });

  it("should export rejectTopUpRequest function", () => {
    expect(typeof dbModule.rejectTopUpRequest).toBe("function");
  });

  it("should export getBalanceTransactions function", () => {
    expect(typeof dbModule.getBalanceTransactions).toBe("function");
  });

  it("should export deductBalance function", () => {
    expect(typeof dbModule.deductBalance).toBe("function");
  });

  it("should have correct schema exports", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.topUpRequests).toBeDefined();
    expect(schema.balanceTransactions).toBeDefined();
  });

  it("getTopUpRequests should return array when DB unavailable", async () => {
    const result = await dbModule.getTopUpRequests();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getTopUpRequestsByAccount should return array when DB unavailable", async () => {
    const result = await dbModule.getTopUpRequestsByAccount(999);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getBalanceTransactions should return array when DB unavailable", async () => {
    const result = await dbModule.getBalanceTransactions(999);
    expect(Array.isArray(result)).toBe(true);
  });
});
