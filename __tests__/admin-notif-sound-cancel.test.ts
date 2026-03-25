import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStorage: Record<string, string> = {};

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(mockStorage[key] ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
  },
}));

// ===== 1. Admin Notifications Storage Tests =====
describe("Admin Notifications Storage", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    vi.resetModules();
  });

  it("should define AdminNotification types correctly", async () => {
    const { addAdminNotification, getAdminNotifications } = await import(
      "../lib/admin-notifications"
    );

    const notif = await addAdminNotification({
      type: "new_booking",
      title: "🔔 حجز جديد! ✈️ رحلة",
      body: "أحمد • NKC → CDG • 50,000 أوق • RV-123456",
      bookingRef: "RV-123456",
      bookingId: "booking_1",
    });

    expect(notif.id).toMatch(/^notif_/);
    expect(notif.type).toBe("new_booking");
    expect(notif.read).toBe(false);
    expect(notif.createdAt).toBeTruthy();

    const all = await getAdminNotifications();
    expect(all.length).toBe(1);
    expect(all[0].title).toContain("حجز جديد");
  });

  it("should support booking_cancelled type", async () => {
    const { addAdminNotification } = await import("../lib/admin-notifications");

    const notif = await addAdminNotification({
      type: "booking_cancelled",
      title: "❌ إلغاء حجز! ✈️ رحلة",
      body: "محمد • NKC → DXB • 75,000 أوق • RV-654321",
      bookingRef: "RV-654321",
      bookingId: "booking_2",
    });

    expect(notif.type).toBe("booking_cancelled");
    expect(notif.title).toContain("إلغاء حجز");
  });

  it("should mark notifications as read", async () => {
    const { addAdminNotification, markNotificationRead, getAdminNotifications } =
      await import("../lib/admin-notifications");

    const notif = await addAdminNotification({
      type: "new_booking",
      title: "Test",
      body: "Test body",
    });

    expect(notif.read).toBe(false);

    await markNotificationRead(notif.id);
    const all = await getAdminNotifications();
    const found = all.find((n: any) => n.id === notif.id);
    expect(found?.read).toBe(true);
  });

  it("should mark all notifications as read", async () => {
    const { addAdminNotification, markAllNotificationsRead, getAdminNotifications } =
      await import("../lib/admin-notifications");

    await addAdminNotification({ type: "new_booking", title: "T1", body: "B1" });
    await addAdminNotification({ type: "booking_cancelled", title: "T2", body: "B2" });

    await markAllNotificationsRead();
    const all = await getAdminNotifications();
    expect(all.every((n: any) => n.read)).toBe(true);
  });

  it("should clear all notifications", async () => {
    const { addAdminNotification, clearAdminNotifications, getAdminNotifications } =
      await import("../lib/admin-notifications");

    await addAdminNotification({ type: "new_booking", title: "T1", body: "B1" });
    await clearAdminNotifications();
    const all = await getAdminNotifications();
    expect(all.length).toBe(0);
  });

  it("should get unread count", async () => {
    const { addAdminNotification, markNotificationRead, getUnreadCount } =
      await import("../lib/admin-notifications");

    const n1 = await addAdminNotification({ type: "new_booking", title: "T1", body: "B1" });
    await addAdminNotification({ type: "booking_cancelled", title: "T2", body: "B2" });

    let count = await getUnreadCount();
    expect(count).toBe(2);

    await markNotificationRead(n1.id);
    count = await getUnreadCount();
    expect(count).toBe(1);
  });
});

// ===== 2. Custom Sound Configuration Tests =====
describe("Custom Notification Sound Configuration", () => {
  it("should have new_booking.wav registered in app.config.ts", async () => {
    const fs = await import("fs");
    const configContent = fs.readFileSync("app.config.ts", "utf-8");
    expect(configContent).toContain("expo-notifications");
    expect(configContent).toContain("new_booking.wav");
    expect(configContent).toContain("sounds");
  });

  it("should have sound file in assets/sounds", async () => {
    const fs = await import("fs");
    expect(fs.existsSync("assets/sounds/new_booking.wav")).toBe(true);
    expect(fs.existsSync("assets/sounds/new_booking.mp3")).toBe(true);
  });

  it("should create Android notification channels with custom sound", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("lib/push-notifications.ts", "utf-8");
    expect(content).toContain('setNotificationChannelAsync("new_booking"');
    expect(content).toContain('setNotificationChannelAsync("booking_cancelled"');
    expect(content).toContain('sound: "new_booking.wav"');
  });

  it("should pass sound and channelId in push notification for new booking", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/booking/payment.tsx", "utf-8");
    expect(content).toContain('sound: "new_booking.wav"');
    expect(content).toContain('channelId: "new_booking"');
  });

  it("should pass sound and channelId in push notification for cancellation", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/booking/detail.tsx", "utf-8");
    expect(content).toContain('sound: "new_booking.wav"');
    expect(content).toContain('channelId: "booking_cancelled"');
  });

  it("should support sound and channelId in server push endpoint", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers.ts", "utf-8");
    expect(content).toContain("sound: z.string().optional()");
    expect(content).toContain("channelId: z.string().optional()");
    expect(content).toContain('sound: input.sound ?? "default"');
    expect(content).toContain("channelId: input.channelId");
  });
});

// ===== 3. Cancellation Notification Tests =====
describe("Booking Cancellation Notification", () => {
  it("should save cancellation notification to admin log", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/booking/detail.tsx", "utf-8");
    expect(content).toContain("addAdminNotification");
    expect(content).toContain('type: "booking_cancelled"');
    expect(content).toContain("إلغاء حجز");
  });

  it("should send push notification to admin on cancellation", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/booking/detail.tsx", "utf-8");
    expect(content).toContain("sendAdminPush.mutateAsync");
    expect(content).toContain('type: "booking_cancelled"');
    expect(content).toContain("adminPushToken");
  });

  it("should include booking details in cancellation notification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/booking/detail.tsx", "utf-8");
    expect(content).toContain("booking.passengerName");
    expect(content).toContain("booking.flight?.originCode");
    expect(content).toContain("booking.hotel?.name");
    expect(content).toContain("booking.reference");
    expect(content).toContain("booking.totalPrice");
  });
});

// ===== 4. Admin Notifications Screen Tests =====
describe("Admin Notifications Screen", () => {
  it("should have notifications screen file", async () => {
    const fs = await import("fs");
    expect(fs.existsSync("app/admin/notifications.tsx")).toBe(true);
  });

  it("should have notifications button in admin index", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/admin/index.tsx", "utf-8");
    expect(content).toContain('"/admin/notifications"');
    expect(content).toContain("سجل الإشعارات");
    expect(content).toContain("bell.fill");
  });

  it("should import admin-notifications in notifications screen", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/admin/notifications.tsx", "utf-8");
    expect(content).toContain("getAdminNotifications");
    expect(content).toContain("markNotificationRead");
    expect(content).toContain("markAllNotificationsRead");
    expect(content).toContain("clearAdminNotifications");
  });

  it("should navigate to booking detail from notification", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("app/admin/notifications.tsx", "utf-8");
    expect(content).toContain("/admin/booking-detail");
    expect(content).toContain("notification.bookingId");
  });
});
