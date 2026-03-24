/**
 * Royal Voyage — Push Notifications Helper
 * Registers Expo Push Token for customer notifications.
 * Token is stored in AsyncStorage and sent to admin panel for PNR updates.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and return the Expo Push Token.
 * Returns null if permissions are denied or on web.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === "web") {
    return null;
  }

  try {
    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[Push] Permission not granted for push notifications");
      return null;
    }

    // Get Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "royal-voyage", // Will use default project ID from app config
    });

    const token = tokenData.data;
    console.log("[Push] Expo Push Token registered:", token.substring(0, 30) + "...");
    return token;
  } catch (error: any) {
    console.warn("[Push] Failed to register push token:", error?.message);
    return null;
  }
}

/**
 * Schedule a local notification (for same device only).
 * Used as fallback when push notification fails.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: data ?? {},
      },
      trigger: null, // immediate
    });
  } catch (error) {
    console.warn("[Push] Failed to schedule local notification:", error);
  }
}
