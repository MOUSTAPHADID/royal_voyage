/**
 * Push Notifications Service for Royal Voyage
 * Manages Expo Push Tokens and sends notifications to users
 */

import * as Notifications from "expo-server-sdk";
import { dbLogger } from "./logger";

const expo = new Notifications.Expo();

export interface PushNotification {
  to: string; // Expo Push Token
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export interface UserPushToken {
  userId: number;
  token: string;
  platform: "ios" | "android";
  active: boolean;
  createdAt: Date;
  lastUsed: Date;
}

class PushNotificationsService {
  /**
   * Register push token for user
   */
  async registerPushToken(userId: number, token: string, platform: "ios" | "android") {
    try {
      // Validate token format
      if (!Notifications.isExpoPushToken(token)) {
        dbLogger.warn(`Invalid Expo push token for user ${userId}: ${token}`);
        return false;
      }

      // TODO: Save token to database
      dbLogger.info(`Push token registered for user ${userId}`, {
        userId,
        platform,
        tokenLength: token.length,
      });

      return true;
    } catch (error: any) {
      dbLogger.error(`Error registering push token for user ${userId}`, error);
      return false;
    }
  }

  /**
   * Send single notification
   */
  async sendNotification(notification: PushNotification): Promise<boolean> {
    try {
      const messages = [
        {
          to: notification.to,
          sound: notification.sound || "default",
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          badge: notification.badge,
        },
      ];

      const tickets = await expo.sendPushNotificationsAsync(messages);

      dbLogger.info(`Push notification sent`, {
        to: notification.to,
        title: notification.title,
        ticketId: tickets[0]?.id,
      });

      return true;
    } catch (error: any) {
      dbLogger.error(`Error sending push notification`, error, {
        to: notification.to,
      });
      return false;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(notifications: PushNotification[]): Promise<number> {
    try {
      const messages = notifications.map((n) => ({
        to: n.to,
        sound: n.sound || "default",
        title: n.title,
        body: n.body,
        data: n.data || {},
        badge: n.badge,
      }));

      const tickets = await expo.sendPushNotificationsAsync(messages);

      const successCount = tickets.filter((t) => t.status === "ok").length;

      dbLogger.info(`Bulk push notifications sent`, {
        total: notifications.length,
        success: successCount,
        failed: notifications.length - successCount,
      });

      return successCount;
    } catch (error: any) {
      dbLogger.error(`Error sending bulk push notifications`, error, {
        count: notifications.length,
      });
      return 0;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(
    pushToken: string,
    bookingId: string,
    bookingType: string,
    destination: string
  ) {
    return this.sendNotification({
      to: pushToken,
      title: "تم تأكيد الحجز ✅",
      body: `حجزك في ${destination} تم تأكيده بنجاح`,
      data: {
        bookingId,
        bookingType,
        destination,
        action: "booking_confirmed",
      },
      badge: 1,
    });
  }

  /**
   * Send payment confirmation notification
   */
  async sendPaymentConfirmation(pushToken: string, amount: number, currency: string) {
    return this.sendNotification({
      to: pushToken,
      title: "تم استقبال الدفع ✅",
      body: `تم استقبال دفعتك بقيمة ${amount} ${currency}`,
      data: {
        action: "payment_confirmed",
        amount,
        currency,
      },
      badge: 1,
    });
  }

  /**
   * Send eSIM activation notification
   */
  async sendEsimActivation(pushToken: string, planName: string, dataAmount: string) {
    return this.sendNotification({
      to: pushToken,
      title: "تم تفعيل eSIM 🌍",
      body: `خطتك ${planName} (${dataAmount}) جاهزة للاستخدام`,
      data: {
        action: "esim_activated",
        planName,
        dataAmount,
      },
      badge: 1,
    });
  }

  /**
   * Send activity reminder notification
   */
  async sendActivityReminder(pushToken: string, activityName: string, startTime: string) {
    return this.sendNotification({
      to: pushToken,
      title: "تذكير: نشاطك قريباً 🎯",
      body: `${activityName} يبدأ في ${startTime}`,
      data: {
        action: "activity_reminder",
        activityName,
        startTime,
      },
      badge: 1,
    });
  }

  /**
   * Send special offer notification
   */
  async sendSpecialOffer(pushToken: string, offerTitle: string, discount: number) {
    return this.sendNotification({
      to: pushToken,
      title: `عرض خاص 🔥 ${discount}% خصم`,
      body: offerTitle,
      data: {
        action: "special_offer",
        offerTitle,
        discount,
      },
      badge: 1,
    });
  }

  /**
   * Send support message notification
   */
  async sendSupportMessage(pushToken: string, message: string) {
    return this.sendNotification({
      to: pushToken,
      title: "رد من فريق الدعم 💬",
      body: message,
      data: {
        action: "support_message",
      },
      badge: 1,
    });
  }

  /**
   * Check push notification receipts
   */
  async checkReceipts(ticketIds: string[]) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(ticketIds);

      dbLogger.info(`Push notification receipts checked`, {
        total: ticketIds.length,
        receipts: Object.keys(receipts).length,
      });

      return receipts;
    } catch (error: any) {
      dbLogger.error(`Error checking push notification receipts`, error);
      return {};
    }
  }
}

// Export singleton instance
export const pushNotificationsService = new PushNotificationsService();

export default PushNotificationsService;
