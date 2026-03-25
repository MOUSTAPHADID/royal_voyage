import { describe, it, expect } from "vitest";

describe("Admin Push Notification on New Booking", () => {
  it("app-context should have ADMIN_PUSH_TOKEN storage key", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/lib/app-context.tsx",
      "utf-8"
    );
    expect(content).toContain("ADMIN_PUSH_TOKEN: \"@royal_voyage_admin_push_token\"");
  });

  it("app-context should expose saveAdminPushToken and adminPushToken", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/lib/app-context.tsx",
      "utf-8"
    );
    expect(content).toContain("saveAdminPushToken: (token: string) => void;");
    expect(content).toContain("adminPushToken: string | null;");
    expect(content).toContain("saveAdminPushToken,");
    expect(content).toContain("adminPushToken,");
  });

  it("app-context should load admin push token from storage on init", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/lib/app-context.tsx",
      "utf-8"
    );
    expect(content).toContain("AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PUSH_TOKEN)");
    expect(content).toContain("storedAdminToken");
    expect(content).toContain("setAdminPushToken(storedAdminToken)");
  });

  it("login.tsx should register admin push token on admin login", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/auth/login.tsx",
      "utf-8"
    );
    expect(content).toContain("saveAdminPushToken");
    // Admin login should register push token
    expect(content).toContain("registerForPushNotifications()");
    // Check the admin branch calls saveAdminPushToken
    const adminSection = content.substring(
      content.indexOf('result === "admin"'),
      content.indexOf('result === "user"')
    );
    expect(adminSection).toContain("saveAdminPushToken");
  });

  it("payment.tsx should send push notification to admin on new booking", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/booking/payment.tsx",
      "utf-8"
    );
    // Should import adminPushToken from context
    expect(content).toContain("adminPushToken");
    // Should use sendPushNotification mutation
    expect(content).toContain("sendAdminPush");
    expect(content).toContain("trpc.email.sendPushNotification.useMutation()");
    // Should send notification with booking details
    expect(content).toContain("حجز جديد!");
    expect(content).toContain("new_booking");
  });

  it("payment.tsx should include booking details in admin notification", async () => {
    const { default: fs } = await import("fs");
    const content = fs.readFileSync(
      "/home/ubuntu/royal_voyage/app/booking/payment.tsx",
      "utf-8"
    );
    // Should include customer name, destination, price, and reference
    expect(content).toContain("customerName");
    expect(content).toContain("bookingType");
    expect(content).toContain("bookingRef: ref");
  });
});
