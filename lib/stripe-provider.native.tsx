import React from "react";
import { StripeProvider } from "@stripe/stripe-react-native";

/**
 * Native Stripe Provider - wraps children with @stripe/stripe-react-native StripeProvider
 * for iOS and Android platforms.
 */

type StripeProviderWrapperProps = {
  publishableKey: string;
  children: React.ReactNode;
};

export function StripeProviderWrapper({ publishableKey, children }: StripeProviderWrapperProps) {
  return (
    <StripeProvider publishableKey={publishableKey}>
      {children as React.ReactElement}
    </StripeProvider>
  );
}
