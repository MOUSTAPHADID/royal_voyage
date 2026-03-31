/**
 * Platform-resolved Stripe Payment Sheet hook.
 * Metro resolves to:
 * - use-stripe-payment.web.ts on web
 * - use-stripe-payment.native.ts on iOS/Android
 * - This file as fallback
 */

type InitResult = { error?: { message: string; code?: string } };
type PresentResult = { error?: { message: string; code?: string } };

export function usePaymentSheet() {
  return {
    initPaymentSheet: async (_params: any): Promise<InitResult> => {
      return { error: { message: "Stripe Payment Sheet is not available on this platform.", code: "Unsupported" } };
    },
    presentPaymentSheet: async (): Promise<PresentResult> => {
      return { error: { message: "Stripe Payment Sheet is not available on this platform.", code: "Unsupported" } };
    },
  };
}
