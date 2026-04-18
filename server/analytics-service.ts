/**
 * Analytics Service for Royal Voyage
 * Tracks user events, bookings, payments, and app metrics
 */

import { analyticsLogger } from "./logger";

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  timestamp: Date;
  properties?: Record<string, any>;
  source: "web" | "mobile" | "admin";
}

export interface BookingMetrics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  conversionRate: number;
  topDestinations: { destination: string; count: number }[];
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  returnRate: number;
  averageSessionDuration: number;
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private eventBuffer: AnalyticsEvent[] = [];
  private flushInterval = 60000; // 1 minute

  constructor() {
    this.startAutoFlush();
  }

  /**
   * Track a user event
   */
  trackEvent(event: Omit<AnalyticsEvent, "timestamp">) {
    const analyticsEvent: AnalyticsEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.eventBuffer.push(analyticsEvent);

    // Flush if buffer is large
    if (this.eventBuffer.length >= 100) {
      this.flush();
    }
  }

  /**
   * Track booking event
   */
  trackBooking(userId: string, bookingType: string, amount: number, destination?: string) {
    this.trackEvent({
      eventName: "booking_created",
      userId,
      source: "mobile",
      properties: {
        bookingType,
        amount,
        destination,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track payment event
   */
  trackPayment(userId: string, amount: number, method: string, status: "success" | "failed") {
    this.trackEvent({
      eventName: `payment_${status}`,
      userId,
      source: "web",
      properties: {
        amount,
        method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track eSIM purchase
   */
  trackEsimPurchase(userId: string, planName: string, price: number, dataAmount: string) {
    this.trackEvent({
      eventName: "esim_purchased",
      userId,
      source: "mobile",
      properties: {
        planName,
        price,
        dataAmount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track activity booking
   */
  trackActivityBooking(userId: string, activityName: string, price: number, city: string) {
    this.trackEvent({
      eventName: "activity_booked",
      userId,
      source: "mobile",
      properties: {
        activityName,
        price,
        city,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track user login
   */
  trackLogin(userId: string, method: string) {
    this.trackEvent({
      eventName: "user_login",
      userId,
      source: "web",
      properties: {
        method,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Track page view
   */
  trackPageView(userId: string, page: string, source: "web" | "mobile") {
    this.trackEvent({
      eventName: "page_view",
      userId,
      source,
      properties: {
        page,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Flush events to storage/analytics backend
   */
  private flush() {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    // Log events for now (in production, send to analytics backend)
    analyticsLogger.info(`Flushing ${events.length} analytics events`, {
      eventCount: events.length,
      events: events.map((e) => ({
        name: e.eventName,
        userId: e.userId,
        source: e.source,
      })),
    });

    // TODO: Send to analytics backend (Mixpanel, Amplitude, etc.)
    this.events.push(...events);
  }

  /**
   * Start auto-flush timer
   */
  private startAutoFlush() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Get booking metrics
   */
  async getBookingMetrics(days: number = 30): Promise<BookingMetrics> {
    // TODO: Query database for metrics
    return {
      totalBookings: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      conversionRate: 0,
      topDestinations: [],
    };
  }

  /**
   * Get user metrics
   */
  async getUserMetrics(): Promise<UserMetrics> {
    // TODO: Query database for metrics
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      returnRate: 0,
      averageSessionDuration: 0,
    };
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(days: number = 30) {
    // TODO: Query database for revenue metrics
    return {
      totalRevenue: 0,
      dailyRevenue: [],
      topPaymentMethods: [],
      refundRate: 0,
    };
  }

  /**
   * Get user retention metrics
   */
  async getRetentionMetrics() {
    // TODO: Query database for retention metrics
    return {
      day1Retention: 0,
      day7Retention: 0,
      day30Retention: 0,
      churnRate: 0,
    };
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

export default AnalyticsService;
