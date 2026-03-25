/**
 * Royal Voyage — Push Notifications Helper
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
