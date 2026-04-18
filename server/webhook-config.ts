/**
 * Webhook Configuration for Travel Booking APIs
 * 
 * This file contains webhook URLs and event handlers for:
 * - Stripe (Payment processing)
 * - eSIM Go (eSIM activation and status updates)
 * - Duffel (Flight booking updates)
 */

import { esimLogger, paymentLogger, webhookLogger } from "./logger";

export interface WebhookConfig {
  provider: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
}

export const webhookConfigs: Record<string, WebhookConfig> = {
  stripe: {
    provider: "stripe",
    url: `${process.env.WEBHOOK_BASE_URL || "https://yourdomain.com"}/webhooks/stripe`,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
    events: [
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "charge.refunded",
      "charge.dispute.created",
    ],
    active: true,
  },
  esimGo: {
    provider: "esim-go",
    url: `${process.env.WEBHOOK_BASE_URL || "https://yourdomain.com"}/webhooks/esim-go`,
    secret: process.env.ESIM_GO_WEBHOOK_SECRET,
    events: [
      "order.activated",
      "order.cancelled",
      "order.expired",
      "order.status_changed",
    ],
    active: true,
  },
  duffel: {
    provider: "duffel",
    url: `${process.env.WEBHOOK_BASE_URL || "https://yourdomain.com"}/webhooks/duffel`,
    secret: process.env.DUFFEL_WEBHOOK_SECRET,
    events: [
      "order.confirmed",
      "order.cancelled",
      "order.updated",
    ],
    active: true,
  },
};

/**
 * Log webhook configuration on startup
 */
export function logWebhookConfig() {
  webhookLogger.info("Webhook Configuration Loaded", {
    activeWebhooks: Object.values(webhookConfigs)
      .filter((w) => w.active)
      .map((w) => `${w.provider} (${w.events.length} events)`),
  });

  // Validate required secrets
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    webhookLogger.warn("Missing STRIPE_WEBHOOK_SECRET - Stripe webhooks may not work");
  }
  if (!process.env.ESIM_GO_WEBHOOK_SECRET) {
    webhookLogger.warn("Missing ESIM_GO_WEBHOOK_SECRET - eSIM Go webhooks may not work");
  }
}

/**
 * Get webhook configuration for a specific provider
 */
export function getWebhookConfig(provider: string): WebhookConfig | null {
  const config = webhookConfigs[provider];
  if (!config) {
    webhookLogger.warn(`Webhook config not found for provider: ${provider}`);
    return null;
  }
  return config;
}

/**
 * Verify webhook signature (provider-specific)
 */
export async function verifyWebhookSignature(
  provider: string,
  payload: string,
  signature: string
): Promise<boolean> {
  const config = getWebhookConfig(provider);
  if (!config || !config.secret) {
    webhookLogger.warn(`Cannot verify webhook signature for ${provider} - no secret`);
    return false;
  }

  try {
    if (provider === "stripe") {
      // Stripe uses HMAC SHA256
      const crypto = await import("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", config.secret)
        .update(payload)
        .digest("hex");
      return signature === expectedSignature;
    } else if (provider === "esim-go" || provider === "duffel") {
      // eSIM Go and Duffel use similar signature verification
      const crypto = await import("crypto");
      const expectedSignature = crypto
        .createHmac("sha256", config.secret)
        .update(payload)
        .digest("hex");
      return signature === expectedSignature;
    }
  } catch (error: any) {
    webhookLogger.error(`Error verifying webhook signature for ${provider}`, error);
    return false;
  }

  return false;
}

/**
 * Log webhook event for debugging
 */
export function logWebhookEvent(
  provider: string,
  eventType: string,
  data: any,
  status: "received" | "processed" | "failed"
) {
  webhookLogger.info(`Webhook ${status}: ${provider}/${eventType}`, {
    provider,
    eventType,
    status,
    timestamp: new Date().toISOString(),
    dataKeys: Object.keys(data || {}),
  });

  if (provider === "esim-go") {
    esimLogger.debug(`eSIM webhook event: ${eventType}`, data);
  } else if (provider === "stripe") {
    paymentLogger.debug(`Stripe webhook event: ${eventType}`, data);
  }
}

/**
 * Setup instructions for each webhook provider
 */
export const webhookSetupInstructions = {
  stripe: `
1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL: ${webhookConfigs.stripe.url}
4. Select events: ${webhookConfigs.stripe.events.join(", ")}
5. Copy signing secret and set as STRIPE_WEBHOOK_SECRET
  `,
  esimGo: `
1. Go to eSIM Go portal settings
2. Navigate to Webhooks section
3. Add new webhook endpoint: ${webhookConfigs.esimGo.url}
4. Select events: ${webhookConfigs.esimGo.events.join(", ")}
5. Copy webhook secret and set as ESIM_GO_WEBHOOK_SECRET
  `,
  duffel: `
1. Go to Duffel dashboard settings
2. Navigate to Webhooks section
3. Add new webhook endpoint: ${webhookConfigs.duffel.url}
4. Select events: ${webhookConfigs.duffel.events.join(", ")}
5. Copy webhook secret and set as DUFFEL_WEBHOOK_SECRET
  `,
};

/**
 * Print webhook setup instructions
 */
export function printWebhookSetupGuide() {
  console.log("\n🔗 Webhook Setup Guide\n");
  console.log("=".repeat(60));

  Object.entries(webhookSetupInstructions).forEach(([provider, instructions]) => {
    console.log(`\n📌 ${provider.toUpperCase()}`);
    console.log(instructions);
  });

  console.log("=".repeat(60));
  console.log("\n✅ After setup, verify webhooks are working by checking logs/webhook.log\n");
}
