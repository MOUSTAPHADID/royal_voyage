import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RK_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY or STRIPE_RK_KEY is not configured");
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return stripeInstance;
}

// Default exchange rates (MRU is not supported by Stripe, so we convert to EUR/USD)
const DEFAULT_USD_TO_MRU = 39.5;
const DEFAULT_EUR_TO_MRU = 43.0;

/**
 * Convert MRU amount to a Stripe-supported currency (EUR or USD)
 * Returns amount in cents (smallest unit for EUR/USD)
 */
function convertMRUToStripeCurrency(
  amountMRU: number,
  targetCurrency: "eur" | "usd" = "eur",
  rates?: { usdToMRU?: number; eurToMRU?: number }
): { amountInCents: number; displayAmount: number; currency: string } {
  const usdRate = rates?.usdToMRU ?? DEFAULT_USD_TO_MRU;
  const eurRate = rates?.eurToMRU ?? DEFAULT_EUR_TO_MRU;

  const rate = targetCurrency === "eur" ? eurRate : usdRate;
  const displayAmount = amountMRU / rate;
  const amountInCents = Math.round(displayAmount * 100); // EUR/USD use cents

  return { amountInCents, displayAmount, currency: targetCurrency };
}

/**
 * Create a PaymentIntent for a booking
 * Amount is in MRU — automatically converted to EUR for Stripe processing
 */
export async function createPaymentIntent(params: {
  amount: number; // Amount in MRU
  currency?: string; // Target Stripe currency: "eur" or "usd" (default: "eur")
  description?: string;
  metadata?: Record<string, string>;
  receiptEmail?: string;
  rates?: { usdToMRU?: number; eurToMRU?: number };
}): Promise<{
  clientSecret: string;
  paymentIntentId: string;
  amount: number; // Original MRU amount
  amountConverted: number; // Amount in target currency (e.g., EUR)
  currency: string; // Target currency
  publishableKey: string;
}> {
  const stripe = getStripe();

  // MRU is not supported by Stripe, convert to EUR (default) or USD
  const targetCurrency = (params.currency?.toLowerCase() === "usd" ? "usd" : "eur") as "eur" | "usd";
  const { amountInCents, displayAmount, currency } = convertMRUToStripeCurrency(
    params.amount,
    targetCurrency,
    params.rates
  );

  // Minimum charge: 50 cents
  const finalAmountInCents = Math.max(amountInCents, 50);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: finalAmountInCents,
    currency,
    description: params.description || "Royal Voyage Booking",
    metadata: {
      ...(params.metadata || {}),
      originalAmountMRU: params.amount.toString(),
      exchangeRate: targetCurrency === "eur"
        ? (params.rates?.eurToMRU ?? DEFAULT_EUR_TO_MRU).toString()
        : (params.rates?.usdToMRU ?? DEFAULT_USD_TO_MRU).toString(),
    },
    ...(params.receiptEmail ? { receipt_email: params.receiptEmail } : {}),
    payment_method_types: ["card"],
  });

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || "";

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
    amount: params.amount,
    amountConverted: displayAmount,
    currency,
    publishableKey,
  };
}

/**
 * Retrieve a PaymentIntent to check its status
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<{
  status: string;
  amount: number;
  currency: string;
  id: string;
}> {
  const stripe = getStripe();
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    status: pi.status,
    amount: pi.amount,
    currency: pi.currency,
    id: pi.id,
  };
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_RK_KEY);
}

/**
 * Get the publishable key for client-side use
 */
export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY || "";
}
