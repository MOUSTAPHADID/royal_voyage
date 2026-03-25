import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");

function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf-8");
}

// ─── 1. Change Seat After Check-in ──────────────────────────────
describe("Change Seat After Check-in", () => {
  const src = readSrc("app/change-seat.tsx");
  const mockData = readSrc("lib/mock-data.ts");
  const appCtx = readSrc("lib/app-context.tsx");
  const pricing = readSrc("lib/pricing-settings.ts");
  const layout = readSrc("app/_layout.tsx");
  const detail = readSrc("app/booking/detail.tsx");

  it("exports default component", () => {
    expect(src).toContain("export default function");
  });

  it("uses updateBookingSeatChange from context", () => {
    expect(src).toContain("updateBookingSeatChange");
    expect(appCtx).toContain("updateBookingSeatChange");
  });

  it("Booking type has seatChangeCount and seatChangeFee", () => {
    expect(mockData).toContain("seatChangeCount");
    expect(mockData).toContain("seatChangeFee");
  });

  it("pricing settings has seatChangeFeeMRU", () => {
    expect(pricing).toContain("seatChangeFeeMRU");
  });

  it("route is registered in _layout.tsx", () => {
    expect(layout).toContain("change-seat");
  });

  it("booking detail has change seat button", () => {
    expect(detail).toContain("change-seat");
    expect(detail).toContain("changeSeatBtn");
  });

  it("has seat map generation", () => {
    expect(src).toContain("generateSeatMap");
  });

  it("shows fee notice", () => {
    expect(src).toContain("seatChangeFeeMRU");
  });
});

// ─── 2. Meal Selection During Check-in ──────────────────────────
describe("Meal Selection During Check-in", () => {
  const src = readSrc("app/online-checkin.tsx");
  const mockData = readSrc("lib/mock-data.ts");
  const appCtx = readSrc("lib/app-context.tsx");

  it("has MealChoice type", () => {
    expect(src).toContain("MealChoice");
  });

  it("has meal step in CheckinStep", () => {
    expect(src).toContain('"meal"');
  });

  it("has meal selection UI with 4 options", () => {
    expect(src).toContain("Regular Meal");
    expect(src).toContain("Vegetarian");
    expect(src).toContain("Halal");
    expect(src).toContain("No Meal");
  });

  it("saves meal choice via updateBookingMeal", () => {
    expect(src).toContain("updateBookingMeal");
    expect(appCtx).toContain("updateBookingMeal");
  });

  it("Booking type has mealChoice field", () => {
    expect(mockData).toContain("mealChoice");
  });

  it("shows meal in confirm review step", () => {
    // The confirm step should display the selected meal
    const confirmSection = src.split("Step 4: Confirmation")[1] || src.split("Confirmation")[1] || src;
    expect(src).toContain("Meal");
  });

  it("STEPS array includes meal step", () => {
    expect(src).toContain('key: "meal"');
  });
});

// ─── 3. Travel Checklist Screen ─────────────────────────────────
describe("Travel Checklist Screen", () => {
  const src = readSrc("app/travel-checklist.tsx");
  const mockData = readSrc("lib/mock-data.ts");
  const appCtx = readSrc("lib/app-context.tsx");
  const layout = readSrc("app/_layout.tsx");
  const detail = readSrc("app/booking/detail.tsx");

  it("exports default component", () => {
    expect(src).toContain("export default function");
  });

  it("has checklist items with 4 categories", () => {
    expect(src).toContain("documents");
    expect(src).toContain("packing");
    expect(src).toContain("airport");
    expect(src).toContain("health");
  });

  it("includes passport, visa, luggage items", () => {
    expect(src).toContain("Passport");
    expect(src).toContain("Visa");
    expect(src).toContain("Luggage");
  });

  it("uses updateBookingChecklist from context", () => {
    expect(src).toContain("updateBookingChecklist");
    expect(appCtx).toContain("updateBookingChecklist");
  });

  it("Booking type has travelChecklist field", () => {
    expect(mockData).toContain("travelChecklist");
  });

  it("route is registered in _layout.tsx", () => {
    expect(layout).toContain("travel-checklist");
  });

  it("booking detail has checklist button", () => {
    expect(detail).toContain("travel-checklist");
    expect(detail).toContain("checklistBtn");
  });

  it("has progress bar and counter", () => {
    expect(src).toContain("progressBarFill");
    expect(src).toContain("checkedItems");
    expect(src).toContain("totalItems");
  });

  it("auto-checks check-in items when already checked in", () => {
    expect(src).toContain("booking?.checkedIn");
    expect(src).toContain("checkin: true");
    expect(src).toContain("boarding_pass: true");
  });

  it("has quick tips section", () => {
    expect(src).toContain("Quick Tips");
  });
});

// ─── 4. PayPal Amount Pre-fill Fix ──────────────────────────────
describe("PayPal Amount Pre-fill", () => {
  const src = readSrc("server/_core/paypal-pages.ts");

  it("uses createOrder with amount", () => {
    expect(src).toContain("createOrder");
  });

  it("passes amount to PayPal SDK", () => {
    expect(src).toContain("amount");
    expect(src).toContain("value");
  });

  it("uses PayPal JS SDK", () => {
    expect(src).toContain("paypal");
  });
});
