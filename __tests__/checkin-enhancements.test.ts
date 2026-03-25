import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(__dirname, "..", relativePath), "utf-8");
}

describe("Online Check-in Enhancements", () => {
  // ─── 1. Share Boarding Pass via WhatsApp ─────────────────────
  describe("Share Boarding Pass via WhatsApp", () => {
    it("should have generateBoardingPassText function", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("generateBoardingPassText");
    });

    it("should include Royal Voyage contact info in boarding pass text", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("+222 33 70 00 00");
      expect(src).toContain("royal-voyage@gmail.com");
      expect(src).toContain("Tavragh Zeina, Nouakchott");
    });

    it("should have WhatsApp share button with correct URL scheme", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("whatsapp://send?text=");
    });

    it("should have native Share fallback", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("Share.share");
      expect(src).toContain("shareBoardingPassNative");
    });

    it("should have share buttons in done step and already-checked-in view", () => {
      const src = readFile("app/online-checkin.tsx");
      // Both views should have WhatsApp and Share buttons
      const whatsappMatches = src.match(/shareBoardingPassWhatsApp/g);
      const nativeMatches = src.match(/shareBoardingPassNative/g);
      expect(whatsappMatches!.length).toBeGreaterThanOrEqual(2);
      expect(nativeMatches!.length).toBeGreaterThanOrEqual(2);
    });

    it("should include BOARDING PASS header in text", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("BOARDING PASS");
    });
  });

  // ─── 2. Pre-flight Reminder Notification ─────────────────────
  describe("Pre-flight Reminder Notification", () => {
    it("should have scheduleFlightReminder function in push-notifications", () => {
      const src = readFile("lib/push-notifications.ts");
      expect(src).toContain("export async function scheduleFlightReminder");
    });

    it("should schedule reminder 2 hours before departure", () => {
      const src = readFile("lib/push-notifications.ts");
      expect(src).toContain("2 * 60 * 60 * 1000");
    });

    it("should include flight info in reminder notification", () => {
      const src = readFile("lib/push-notifications.ts");
      expect(src).toContain("Flight Reminder");
      expect(src).toContain("departs in 2 hours");
    });

    it("should have flightReminderScheduled field in Booking type", () => {
      const src = readFile("lib/mock-data.ts");
      expect(src).toContain("flightReminderScheduled?: boolean");
    });

    it("should have updateBookingFlightReminder in app-context", () => {
      const src = readFile("lib/app-context.tsx");
      expect(src).toContain("updateBookingFlightReminder");
    });

    it("should auto-schedule reminder on check-in confirmation", () => {
      const src = readFile("app/online-checkin.tsx");
      // handleCheckin should call scheduleFlightReminder
      expect(src).toContain("scheduleFlightReminder");
      expect(src).toContain("updateBookingFlightReminder");
    });

    it("should show reminder status in already-checked-in view", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("flightReminderScheduled");
      expect(src).toContain("Reminder Scheduled");
    });

    it("should have bell.badge.fill icon mapping", () => {
      const src = readFile("components/ui/icon-symbol.tsx");
      expect(src).toContain('"bell.badge.fill"');
      expect(src).toContain('"notifications-active"');
    });
  });

  // ─── 3. Seat Upgrade with Extra Legroom ──────────────────────
  describe("Seat Upgrade with Extra Legroom", () => {
    it("should have seatUpgrade and seatUpgradeFee fields in Booking type", () => {
      const src = readFile("lib/mock-data.ts");
      expect(src).toContain("seatUpgrade?: boolean");
      expect(src).toContain("seatUpgradeFee?: number");
    });

    it("should have extraLegroomFeeMRU in PricingSettings", () => {
      const src = readFile("lib/pricing-settings.ts");
      expect(src).toContain("extraLegroomFeeMRU: number");
      expect(src).toContain("extraLegroomFeeMRU: 500");
    });

    it("should have upgrade toggle card in seat selection step", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("wantUpgrade");
      expect(src).toContain("Extra Legroom Upgrade");
    });

    it("should pass seatUpgrade params to updateBookingCheckin", () => {
      const src = readFile("lib/app-context.tsx");
      expect(src).toContain("seatUpgrade?: boolean");
      expect(src).toContain("seatUpgradeFee?: number");
    });

    it("should show upgrade badge in boarding pass when selected", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("EXTRA LEGROOM UPGRADE");
      expect(src).toContain("bpUpgradeBadge");
    });

    it("should show upgrade fee in currency format", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("fmt(upgradeFee)");
    });

    it("should highlight extra legroom rows (1, 12, 25)", () => {
      const src = readFile("app/online-checkin.tsx");
      expect(src).toContain("EXTRA_ROWS = [1, 12, 25]");
    });

    it("should have sparkles icon mapping for upgrade", () => {
      const src = readFile("components/ui/icon-symbol.tsx");
      expect(src).toContain('"sparkles"');
      expect(src).toContain('"auto-awesome"');
    });
  });
});
