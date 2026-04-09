import React from "react";

/**
 * Native Stripe Provider - wraps children with @stripe/stripe-react-native StripeProvider
 * for iOS and Android platforms.
 * Uses dynamic require to avoid crashing in Expo Go where native modules may be missing.
 * 
 * IMPORTANT: Do NOT use static import { ... } from "@stripe/stripe-react-native" here.
 * The OnrampSdk native module is not available in Expo Go and will crash on load.
 * Always use dynamic require() inside a try/catch.
 */

type StripeProviderWrapperProps = {
  publishableKey: string;
  children: React.ReactNode;
};

let NativeStripeProvider: React.ComponentType<any> | null = null;

try {
  // Dynamic require to avoid crashing in Expo Go (OnrampSdk not available)
  const stripe = require("@stripe/stripe-react-native");
  NativeStripeProvider = stripe.StripeProvider ?? null;
} catch {
  // Stripe native module not available (e.g. Expo Go) — silently skip
}

export function StripeProviderWrapper({ publishableKey, children }: StripeProviderWrapperProps) {
  if (NativeStripeProvider && publishableKey) {
    return (
      <NativeStripeProvider publishableKey={publishableKey}>
        {children}
      </NativeStripeProvider>
    );
  }
  // Expo Go or missing key — render children directly
  return <>{children}</>;
}
