/**
 * Web stub for Stripe Payment Sheet hooks.
 * @stripe/stripe-react-native doesn't support web, so we provide no-op implementations.
 * On web, Stripe payments will show an alert directing users to use the mobile app.
 */

type InitResult = { error?: { message: string; code?: string } };
type PresentResult = { error?: { message: string; code?: string } };

export function usePaymentSheet() {
  return {
    initPaymentSheet: async (_params: any): Promise<InitResult> => {
      return { error: { message: "Stripe Payment Sheet is not available on web. Please use the mobile app.", code: "WebNotSupported" } };
    },
    presentPaymentSheet: async (): Promise<PresentResult> => {
      return { error: { message: "Stripe Payment Sheet is not available on web. Please use the mobile app.", code: "WebNotSupported" } };
    },
  };
}
