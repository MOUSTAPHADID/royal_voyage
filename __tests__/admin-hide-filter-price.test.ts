import { describe, it, expect } from "vitest";

// ─── Test 1: Admin elements hidden from regular users in Profile ───
describe("Admin Elements Hidden from Regular Users", () => {
  it("profile.tsx should check isAdmin before showing daily profit notification", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/(tabs)/profile.tsx",
      "utf-8"
    );
    // Check that isAdmin is defined
    expect(content).toContain("const isAdmin = user?.isAdmin === true;");
    // Check that daily profit notification is wrapped in isAdmin check
    expect(content).toContain("{isAdmin && (");
    // Check that getDailyNotificationStatus is only called for admin
    expect(content).toContain("if (isAdmin) {");
  });

  it("profile.tsx should keep About Us and Privacy Policy visible for all users", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/(tabs)/profile.tsx",
      "utf-8"
    );
    // These should be in the support section, visible to all
    expect(content).toContain('"/about"');
    expect(content).toContain('"/privacy"');
  });
});

// ─── Test 2: Status Filter in Update Status Screen ───
describe("Status Filter in Update Status Screen", () => {
  it("update-status.tsx should have statusFilter state", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    expect(content).toContain('useState<BookingStatus | "all">("all")');
  });

  it("update-status.tsx should compute statusCounts", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    expect(content).toContain("statusCounts");
    expect(content).toContain("counts[s.id] = bookings.filter");
  });

  it("update-status.tsx should filter bookings by statusFilter", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    expect(content).toContain('statusFilter !== "all"');
    expect(content).toContain("b.status === statusFilter");
  });

  it("update-status.tsx should have filter tab UI elements", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    expect(content).toContain("filterTab:");
    expect(content).toContain("filterTabText:");
    expect(content).toContain("filterBadge:");
    expect(content).toContain("filterBadgeText:");
  });

  it("update-status.tsx should show count badges for each status", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/admin/update-status.tsx",
      "utf-8"
    );
    expect(content).toContain("statusCounts[s.id]");
    expect(content).toContain("statusCounts.all");
  });
});

// ─── Test 3: Price Consistency - toMRU uses PricingSettings ───
describe("Price Consistency - toMRU uses PricingSettings", () => {
  it("currency.ts toMRU should use dynamic rates from PricingSettings", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/lib/currency.ts",
      "utf-8"
    );
    // Check that toMRU tries to load PricingSettings
    expect(content).toContain('require("./pricing-settings")');
    expect(content).toContain("getPricingSettings");
    // Check fallback to defaults
    expect(content).toContain("USD_TO_MRU_DEFAULT");
    expect(content).toContain("EUR_TO_MRU_DEFAULT");
  });

  it("currency.ts fromMRU should also use dynamic rates", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/lib/currency.ts",
      "utf-8"
    );
    // Check that fromMRU also uses PricingSettings
    const fromMRUSection = content.match(
      /export function fromMRU[\s\S]*?^}/m
    );
    expect(fromMRUSection).not.toBeNull();
    expect(fromMRUSection![0]).toContain("getPricingSettings");
  });

  it("toMRU should return MRU amount unchanged", async () => {
    const { toMRU } = await import("../lib/currency");
    expect(toMRU(1000, "MRU")).toBe(1000);
  });

  it("toMRU should convert USD using dynamic rate", async () => {
    const { toMRU } = await import("../lib/currency");
    const result = toMRU(100, "USD");
    // Should be approximately 100 * 39.5 = 3950 (default rate)
    expect(result).toBeGreaterThan(3000);
    expect(result).toBeLessThan(5000);
  });

  it("toMRU should convert EUR using dynamic rate", async () => {
    const { toMRU } = await import("../lib/currency");
    const result = toMRU(100, "EUR");
    // Should be approximately 100 * 43 = 4300 (default rate)
    expect(result).toBeGreaterThan(3500);
    expect(result).toBeLessThan(5500);
  });
});
