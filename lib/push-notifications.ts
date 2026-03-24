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
