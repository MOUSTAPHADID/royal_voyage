import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const NOTIFICATION_ID_KEY = "daily_profit_notification_id";
const NOTIFICATION_ENABLED_KEY = "daily_profit_notification_enabled";
const NOTIFICATION_HOUR_KEY = "daily_profit_notification_hour";

export const DEFAULT_NOTIFICATION_HOUR = 20; // 8 مساءً

/**
 * expo-notifications remote push was removed from Expo Go in SDK 53.
 * Local scheduled notifications still work in development builds (APK).
 * In Expo Go, we silently skip all notification calls to avoid console errors.
 */
async function getNotifications() {
  if (Platform.OS === "web") return null;
  try {
    // Dynamic import to avoid crash in Expo Go
    const Notifications = await import("expo-notifications");
    return Notifications;
  } catch {
    return null;
  }
}

/**
 * طلب صلاحية الإشعارات من المستخدم
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const Notifications = await getNotifications();
  if (!Notifications) return false;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("daily-profits", {
        name: "تقرير الأرباح اليومي",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * جدولة الإشعار اليومي
 */
export async function scheduleDailyProfitNotification(hour: number = DEFAULT_NOTIFICATION_HOUR): Promise<boolean> {
  if (Platform.OS === "web") return false;

  const Notifications = await getNotifications();
  if (!Notifications) return false;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;

    // إلغاء الإشعار القديم إن وجد
    await cancelDailyProfitNotification();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "📊 تقرير أرباح Royal Service",
        body: "اضغط لعرض ملخص حجوزات وأرباح اليوم",
        data: { screen: "admin-profits" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? "daily",
        hour,
        minute: 0,
      } as any,
    });

    await AsyncStorage.setItem(NOTIFICATION_ID_KEY, id);
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, "true");
    await AsyncStorage.setItem(NOTIFICATION_HOUR_KEY, String(hour));
    return true;
  } catch {
    return false;
  }
}

/**
 * إلغاء الإشعار اليومي
 */
export async function cancelDailyProfitNotification(): Promise<void> {
  const Notifications = await getNotifications();

  const id = await AsyncStorage.getItem(NOTIFICATION_ID_KEY);
  if (id && Notifications) {
    await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
    await AsyncStorage.removeItem(NOTIFICATION_ID_KEY);
  }
  await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, "false");
}

/**
 * التحقق من حالة الإشعار
 */
export async function getDailyNotificationStatus(): Promise<{
  enabled: boolean;
  hour: number;
}> {
  const enabled = (await AsyncStorage.getItem(NOTIFICATION_ENABLED_KEY)) === "true";
  const hourStr = await AsyncStorage.getItem(NOTIFICATION_HOUR_KEY);
  const hour = hourStr ? parseInt(hourStr) : DEFAULT_NOTIFICATION_HOUR;
  return { enabled, hour };
}
