import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), "utf-8");
}

describe("Online Check-in Screen", () => {
  const src = readFile("app/online-checkin.tsx");

  it("exists and exports a default component", () => {
    expect(src).toContain("export default function OnlineCheckinScreen");
  });

  it("has multi-step flow (info, seat, confirm, done)", () => {
    expect(src).toContain('"info"');
    expect(src).toContain('"seat"');
    expect(src).toContain('"confirm"');
    expect(src).toContain('"done"');
    expect(src).toContain("CheckinStep");
  });

  it("has step indicator component", () => {
    expect(src).toContain("StepIndicator");
    expect(src).toContain("stepStyles");
  });

  it("generates a seat map with 30 rows", () => {
    expect(src).toContain("generateSeatMap");
    expect(src).toContain("SeatInfo");
    expect(src).toContain('COLS = ["A", "B", "C", "D", "E", "F"]');
  });

  it("supports seat preferences (window, aisle, middle)", () => {
    expect(src).toContain("SeatPreference");
    expect(src).toContain('"window"');
    expect(src).toContain('"aisle"');
    expect(src).toContain('"middle"');
    expect(src).toContain("seatPreference");
  });

  it("has seat type mapping for columns", () => {
    expect(src).toContain("COL_TYPES");
    expect(src).toContain('A: "window"');
    expect(src).toContain('C: "aisle"');
    expect(src).toContain('B: "middle"');
  });

  it("has exit row indicators", () => {
    expect(src).toContain("EXIT_ROWS");
    expect(src).toContain("isExit");
    expect(src).toContain("exitLabel");
    expect(src).toContain("EXIT");
  });

  it("has extra legroom rows", () => {
    expect(src).toContain("EXTRA_ROWS");
    expect(src).toContain("isExtra");
    expect(src).toContain("Extra Leg");
  });

  it("generates boarding groups based on row", () => {
    expect(src).toContain("getBoardingGroup");
    expect(src).toContain("boardingGroup");
  });

  it("has SeatButton component", () => {
    expect(src).toContain("SeatButton");
    expect(src).toContain("seatBtnStyles");
  });

  it("shows boarding pass after check-in", () => {
    expect(src).toContain("BOARDING PASS");
    expect(src).toContain("boardingPass");
    expect(src).toContain("bpHeader");
    expect(src).toContain("bpBody");
    expect(src).toContain("bpFooter");
  });

  it("displays passenger info, flight details, and seat info on boarding pass", () => {
    expect(src).toContain("PASSENGER");
    expect(src).toContain("FLIGHT");
    expect(src).toContain("SEAT");
    expect(src).toContain("BOARDING");
    expect(src).toContain("CLASS");
    expect(src).toContain("DEPARTURE");
  });

  it("uses updateBookingCheckin from app context", () => {
    expect(src).toContain("updateBookingCheckin");
    expect(src).toContain("useApp");
  });

  it("handles already checked-in state", () => {
    expect(src).toContain("booking?.checkedIn");
    expect(src).toContain("Already Checked In");
  });

  it("sends local notification on successful check-in", () => {
    expect(src).toContain("scheduleLocalNotification");
    expect(src).toContain("Check-in Complete");
  });

  it("has confirmation alert before finalizing", () => {
    expect(src).toContain("Alert.alert");
    expect(src).toContain("Confirm Check-in");
    expect(src).toContain("handleCheckin");
  });

  it("has haptic feedback", () => {
    expect(src).toContain("Haptics");
    expect(src).toContain("NotificationFeedbackType.Success");
  });

  it("reads booking id from route params", () => {
    expect(src).toContain("useLocalSearchParams");
  });

  it("has seat map legend", () => {
    expect(src).toContain("legendRow");
    expect(src).toContain("Available");
    expect(src).toContain("Selected");
    expect(src).toContain("Taken");
  });
});

describe("Booking Type - Check-in Fields", () => {
  const src = readFile("lib/mock-data.ts");

  it("has checkedIn field", () => {
    expect(src).toContain("checkedIn?: boolean");
  });

  it("has checkedInAt field", () => {
    expect(src).toContain("checkedInAt?: string");
  });

  it("has seatNumber field", () => {
    expect(src).toContain("seatNumber?: string");
  });

  it("has seatPreference field", () => {
    expect(src).toContain("seatPreference?:");
    expect(src).toContain('"window"');
    expect(src).toContain('"middle"');
    expect(src).toContain('"aisle"');
  });

  it("has boardingGroup field", () => {
    expect(src).toContain("boardingGroup?: string");
  });
});

describe("App Context - Check-in Support", () => {
  const src = readFile("lib/app-context.tsx");

  it("has updateBookingCheckin in context type", () => {
    expect(src).toContain("updateBookingCheckin");
  });

  it("implements updateBookingCheckin function", () => {
    expect(src).toContain("checkedIn: true");
    expect(src).toContain("checkedInAt: now");
    expect(src).toContain("seatNumber");
    expect(src).toContain("boardingGroup");
  });

  it("exposes updateBookingCheckin in provider value", () => {
    const providerMatch = src.indexOf("updateBookingCheckin,");
    expect(providerMatch).toBeGreaterThan(-1);
  });
});

describe("Booking Detail - Check-in Button", () => {
  const src = readFile("app/booking/detail.tsx");

  it("has check-in button", () => {
    expect(src).toContain("checkinBtn");
    expect(src).toContain("online-checkin");
  });

  it("shows different state when already checked in", () => {
    expect(src).toContain("booking.checkedIn");
    expect(src).toContain("seatNumber");
  });

  it("has checkinBtn and checkinBtnText styles", () => {
    expect(src).toContain("checkinBtn:");
    expect(src).toContain("checkinBtnText:");
  });
});

describe("Route Registration - Online Check-in", () => {
  const src = readFile("app/_layout.tsx");

  it("registers online-checkin route", () => {
    expect(src).toContain('name="online-checkin"');
  });
});

describe("Icon Mappings for Check-in", () => {
  const src = readFile("components/ui/icon-symbol.tsx");

  it("has person.badge.clock icon mapping", () => {
    expect(src).toContain('"person.badge.clock"');
  });
});
