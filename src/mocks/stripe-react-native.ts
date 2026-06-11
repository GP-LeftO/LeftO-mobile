// Web stub for @stripe/stripe-react-native (native module). The real web payment
// path lives in services/payments/karamPayment.web.ts via @stripe/stripe-js, so
// these are only here to satisfy any stray imports during web bundling.
import React from "react";

export function useStripe() {
  return {
    initPaymentSheet: async () => ({ error: { message: "Not available on web" } }),
    presentPaymentSheet: async () => ({ error: { code: "Failed", message: "Not available on web" } }),
  };
}

export const StripeProvider = ({ children }: { children?: React.ReactNode }) =>
  children as React.ReactElement;

export default { useStripe, StripeProvider };
