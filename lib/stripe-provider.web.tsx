import React from "react";

/**
 * Web-only Stripe Provider - no-op wrapper since @stripe/stripe-react-native
 * doesn't support web. On web, Stripe payments use server-side redirect flow.
 */

type StripeProviderWrapperProps = {
  publishableKey: string;
  children: React.ReactNode;
};

export function StripeProviderWrapper({ children }: StripeProviderWrapperProps) {
  return <>{children}</>;
}
