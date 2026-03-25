import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

describe("Today's Deals Screen", () => {
  const src = readFile("app/deals.tsx");

  it("exists and exports a default component", () => {
    expect(src).toContain("export default function DealsScreen");
  });

  it("contains deal data with discounts", () => {
    expect(src).toContain("discountPercent");
    expect(src).toContain("originalPrice");
    expect(src).toContain("discountedPrice");
  });

  it("has countdown timer logic", () => {
    expect(src).toContain("useCountdown");
    expect(src).toContain("formatCountdown");
    expect(src).toContain("expiresAt");
  });

  it("has filter tabs for all, flights, hotels", () => {
    expect(src).toContain('"all"');
    expect(src).toContain('"flights"');
    expect(src).toContain('"hotels"');
  });

  it("navigates to booking on deal press", () => {
    expect(src).toContain("/booking/passenger-details");
    expect(src).toContain("handleDealPress");
  });

  it("displays savings badge", () => {
    expect(src).toContain("saveBadge");
    expect(src).toContain("saveText");
  });

  it("has multiple deal entries", () => {
    const dealCount = (src.match(/id: "deal\d+"/g) || []).length;
    expect(dealCount).toBeGreaterThanOrEqual(5);
  });
});

describe("Flight Status Tracking Screen", () => {
  const src = readFile("app/flight-status.tsx");

  it("exists and exports a default component", () => {
    expect(src).toContain("export default function FlightStatusScreen");
  });

  it("defines flight phases timeline", () => {
    expect(src).toContain("TIMELINE_PHASES");
    expect(src).toContain("scheduled");
    expect(src).toContain("boarding");
    expect(src).toContain("departed");
    expect(src).toContain("in_flight");
    expect(src).toContain("landed");
    expect(src).toContain("arrived");
  });

  it("defines flight status types", () => {
    expect(src).toContain("on_time");
    expect(src).toContain("delayed");
    expect(src).toContain("cancelled");
  });

  it("displays gate and terminal info", () => {
    expect(src).toContain("gate");
    expect(src).toContain("terminal");
    expect(src).toContain("seat");
  });

  it("has auto-refresh logic", () => {
    expect(src).toContain("30000"); // 30 second interval
    expect(src).toContain("setInterval");
  });

  it("shows StatusBadge component", () => {
    expect(src).toContain("StatusBadge");
    expect(src).toContain("statusBadge");
  });

  it("shows FlightTimeline component", () => {
    expect(src).toContain("FlightTimeline");
    expect(src).toContain("timelineItem");
  });

  it("reads booking id from route params", () => {
    expect(src).toContain("useLocalSearchParams");
    expect(src).toContain("id");
    expect(src).toContain("useApp");
  });
});

describe("WhatsApp Ticket Sending (Booking Detail)", () => {
  const src = readFile("app/booking/detail.tsx");

  it("imports Linking and Share", () => {
    expect(src).toContain("Linking");
    expect(src).toContain("Share");
  });

  it("imports ticket generator functions", () => {
    expect(src).toContain("generateFlightTicket");
    expect(src).toContain("generateHotelVoucher");
  });

  it("has WhatsApp ticket button", () => {
    expect(src).toContain("whatsappTicketBtn");
    expect(src).toContain("WhatsApp");
    expect(src).toContain("#25D366");
  });

  it("uses wa.me URL for sharing", () => {
    expect(src).toContain("wa.me");
    expect(src).toContain("encodeURIComponent");
  });

  it("has fallback to native share", () => {
    expect(src).toContain("Share.share");
  });

  it("has flight status tracking button", () => {
    expect(src).toContain("trackFlightBtn");
    expect(src).toContain("flight-status");
  });
});

describe("Route Registration", () => {
  const src = readFile("app/_layout.tsx");

  it("registers deals route", () => {
    expect(src).toContain('name="deals"');
  });

  it("registers flight-status route", () => {
    expect(src).toContain('name="flight-status"');
  });
});

describe("Home Screen Deals Banner", () => {
  const src = readFile("app/(tabs)/index.tsx");

  it("has Today's Deals banner link", () => {
    expect(src).toContain("/deals");
    expect(src).toContain("Today's Deals");
  });
});
