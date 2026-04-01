/**
 * Royal Service — Push Notifications Helper
 * Registers Expo Push Token for customer notifications.
 *
 * NOTE: expo-notifications remote push was removed from Expo Go in SDK 53.
 * All functions silently no-op in Expo Go to avoid console errors.
 * They work correctly in development builds (APK).
 */
import { Platform } from "react-native";

async function getNotifications() {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = await import("expo-notifications");
    // Set handler only once
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    // Create Android notification channel for new bookings with custom sound
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("new_booking", {
        name: "حجز جديد",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: "new_booking.wav",
      }).catch(() => {});
      await Notifications.setNotificationChannelAsync("booking_cancelled", {
        name: "إلغاء حجز",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        sound: "new_booking.wav",
      }).catch(() => {});
    }
    return Notifications;
  } catch {
    return null;
  }
}

/**
 * Register for push notifications and return the Expo Push Token.
 * Returns null if permissions are denied, on web, or in Expo Go.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const Notifications = await getNotifications();
  if (!Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "royal-voyage",
    });

    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Schedule a local notification 1 hour before the 24h cash payment deadline.
 */
export async function scheduleCashPaymentReminder(
  bookingRef: string,
  deadlineISO: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    const deadline = new Date(deadlineISO).getTime();
    const reminderTime = deadline - 60 * 60 * 1000; // 1 hour before deadline
    const now = Date.now();
    if (reminderTime <= now) return;

    const secondsUntilReminder = Math.floor((reminderTime - now) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ تذكير بالدفع النقدي",
        body: `تبقى ساعة واحدة فقط لدفع حجزك ${bookingRef}. يرجى زيارة مكتبنا في تفرغ زين نواكشوط.`,
        sound: true,
        data: { bookingRef, type: "cash_payment_reminder" },
      },
      trigger: {
        seconds: secondsUntilReminder,
        repeats: false,
      } as any,
    });
  } catch {
    // Silently fail in Expo Go
  }
}

/**
 * Schedule a local notification 2 hours before flight departure.
 */
export async function scheduleFlightReminder(
  bookingRef: string,
  flightNumber: string,
  seatNumber: string,
  boardingGroup: string,
  departureDate: string,
  departureTime: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    // Parse departure date and time
    // departureDate format: "2026-04-15" or similar, departureTime: "14:30" or "2:30 PM"
    const dateStr = departureDate;
    let hours = 0;
    let minutes = 0;
    
    // Try parsing time like "14:30" or "2:30 PM"
    const timeParts = departureTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeParts) {
      hours = parseInt(timeParts[1], 10);
      minutes = parseInt(timeParts[2], 10);
      if (timeParts[3]) {
        const period = timeParts[3].toUpperCase();
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
      }
    }

    const departure = new Date(dateStr);
    departure.setHours(hours, minutes, 0, 0);
    
    const reminderTime = departure.getTime() - 2 * 60 * 60 * 1000; // 2 hours before
    const now = Date.now();
    if (reminderTime <= now) return; // Already past

    const secondsUntilReminder = Math.floor((reminderTime - now) / 1000);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "\u2708\uFE0F Flight Reminder",
        body: `Your flight ${flightNumber} departs in 2 hours! Seat: ${seatNumber} | Boarding Group: ${boardingGroup} | Ref: ${bookingRef}`,
        sound: true,
        data: { bookingRef, type: "flight_reminder" },
      },
      trigger: {
        seconds: secondsUntilReminder,
        repeats: false,
      } as any,
    });
  } catch {
    // Silently fail in Expo Go
  }
}

/**
 * Schedule hold expiry reminders for 24-hour confirmed bookings.
 * Sends 3 notifications: 6 hours before, 2 hours before, and at expiry.
 */
export async function scheduleHoldExpiryReminders(
  bookingRef: string,
  deadlineISO: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    const deadline = new Date(deadlineISO).getTime();
    const now = Date.now();

    // Reminder 1: 6 hours before expiry
    const sixHoursBefore = deadline - 6 * 60 * 60 * 1000;
    if (sixHoursBefore > now) {
      const seconds = Math.floor((sixHoursBefore - now) / 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "\u23F0 \u062A\u0630\u0643\u064A\u0631 \u0628\u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0645\u0624\u0643\u062F",
          body: `\u062A\u0628\u0642\u0649 6 \u0633\u0627\u0639\u0627\u062A \u0639\u0644\u0649 \u0627\u0646\u062A\u0647\u0627\u0621 \u0645\u0647\u0644\u0629 \u062D\u062C\u0632\u0643 ${bookingRef}. \u064A\u0631\u062C\u0649 \u0625\u062A\u0645\u0627\u0645 \u0627\u0644\u062F\u0641\u0639.`,
          sound: true,
          data: { bookingRef, type: "hold_expiry_6h" },
        },
        trigger: { seconds, repeats: false } as any,
      });
    }

    // Reminder 2: 2 hours before expiry
    const twoHoursBefore = deadline - 2 * 60 * 60 * 1000;
    if (twoHoursBefore > now) {
      const seconds = Math.floor((twoHoursBefore - now) / 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "\u26A0\uFE0F \u062D\u062C\u0632\u0643 \u0639\u0644\u0649 \u0648\u0634\u0643 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621",
          body: `\u062A\u0628\u0642\u0649 \u0633\u0627\u0639\u062A\u0627\u0646 \u0641\u0642\u0637 \u0639\u0644\u0649 \u0627\u0646\u062A\u0647\u0627\u0621 \u0645\u0647\u0644\u0629 \u062D\u062C\u0632\u0643 ${bookingRef}. \u0623\u0633\u0631\u0639 \u0628\u0627\u0644\u062F\u0641\u0639!`,
          sound: true,
          data: { bookingRef, type: "hold_expiry_2h" },
        },
        trigger: { seconds, repeats: false } as any,
      });
    }

    // Reminder 3: At expiry
    if (deadline > now) {
      const seconds = Math.floor((deadline - now) / 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "\u274C \u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u0627\u0644\u062D\u062C\u0632",
          body: `\u0627\u0646\u062A\u0647\u062A \u0645\u0647\u0644\u0629 \u062D\u062C\u0632\u0643 ${bookingRef}. \u0642\u062F \u064A\u062A\u0645 \u0625\u0644\u063A\u0627\u0621 \u0627\u0644\u062D\u062C\u0632 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B.`,
          sound: true,
          data: { bookingRef, type: "hold_expired" },
        },
        trigger: { seconds, repeats: false } as any,
      });
    }
  } catch {
    // Silently fail in Expo Go
  }
}

/**
 * Schedule an admin notification for hold expiry.
 */
export async function scheduleAdminHoldExpiryNotification(
  bookingRef: string,
  customerName: string,
  deadlineISO: string
): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    const deadline = new Date(deadlineISO).getTime();
    const now = Date.now();

    // Notify admin 1 hour before expiry
    const oneHourBefore = deadline - 60 * 60 * 1000;
    if (oneHourBefore > now) {
      const seconds = Math.floor((oneHourBefore - now) / 1000);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "\u{1F6A8} \u062D\u062C\u0632 \u0639\u0644\u0649 \u0648\u0634\u0643 \u0627\u0644\u0627\u0646\u062A\u0647\u0627\u0621",
          body: `\u062D\u062C\u0632 ${customerName} (${bookingRef}) \u0633\u064A\u0646\u062A\u0647\u064A \u062E\u0644\u0627\u0644 \u0633\u0627\u0639\u0629. \u062A\u0623\u0643\u062F \u0645\u0646 \u0627\u0644\u062F\u0641\u0639.`,
          sound: true,
          data: { bookingRef, type: "admin_hold_expiry" },
        },
        trigger: { seconds, repeats: false } as any,
      });
    }
  } catch {
    // Silently fail
  }
}

/**
 * Schedule an immediate local notification (same device only).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (Platform.OS === "web") return;

  const Notifications = await getNotifications();
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: data ?? {},
      },
      trigger: null,
    });
  } catch {
    // Silently fail in Expo Go
  }
}
