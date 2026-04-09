// Web mock for @stripe/stripe-react-native
// This module is not supported on web — all exports are no-ops
const React = require("react");

// No-op StripeProvider
const StripeProvider = ({ children }) => children;

// No-op hooks
const usePaymentSheet = () => ({
  initPaymentSheet: async () => ({ error: { code: "WebNotSupported", message: "Stripe Payment Sheet is not available on web." } }),
  presentPaymentSheet: async () => ({ error: { code: "WebNotSupported", message: "Stripe Payment Sheet is not available on web." } }),
  confirmPaymentSheetPayment: async () => ({ error: { code: "WebNotSupported", message: "Stripe Payment Sheet is not available on web." } }),
  loading: false,
});

const useStripe = () => ({
  confirmPayment: async () => ({ error: { code: "WebNotSupported", message: "Stripe is not available on web." } }),
  createPaymentMethod: async () => ({ error: { code: "WebNotSupported", message: "Stripe is not available on web." } }),
  handleNextAction: async () => ({ error: { code: "WebNotSupported", message: "Stripe is not available on web." } }),
  retrievePaymentIntent: async () => ({ error: { code: "WebNotSupported", message: "Stripe is not available on web." } }),
  confirmSetupIntent: async () => ({ error: { code: "WebNotSupported", message: "Stripe is not available on web." } }),
  createToken: async () => ({ error: { code: "WebNotSupported", message: "Stripe is not available on web." } }),
  openApplePaySetup: async () => {},
  presentApplePay: async () => ({ error: { code: "WebNotSupported", message: "Apple Pay is not available on web." } }),
  confirmApplePayPayment: async () => ({ error: { code: "WebNotSupported", message: "Apple Pay is not available on web." } }),
  isApplePaySupported: false,
});

module.exports = {
  StripeProvider,
  usePaymentSheet,
  useStripe,
};
