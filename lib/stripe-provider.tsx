import React from "react";
import { Platform } from "react-native";

/**
 * Cross-platform Stripe Provider wrapper.
 * - On iOS/Android: uses @stripe/stripe-react-native StripeProvider
 * - On Web: renders children directly (Stripe React Native doesn't support web)
 */

type StripeProviderWrapperProps = {
  publishableKey: string;
  children: React.ReactNode;
};

let NativeStripeProvider: React.ComponentType<any> | null = null;

if (Platform.OS !== "web") {
  try {
    // Dynamic require to avoid Metro bundling this on web
    const stripe = require("@stripe/stripe-react-native");
    NativeStripeProvider = stripe.StripeProvider;
  } catch {
    // Stripe not available
  }
}

export function StripeProviderWrapper({ publishableKey, children }: StripeProviderWrapperProps) {
  if (Platform.OS !== "web" && NativeStripeProvider) {
    return (
      <NativeStripeProvider publishableKey={publishableKey}>
        {children}
      </NativeStripeProvider>
    );
  }
  // On web, just render children - Stripe Payment Sheet is not available
  return <>{children}</>;
}
