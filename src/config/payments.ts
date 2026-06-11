// Stripe publishable key (public — safe to ship in the client bundle).
// Fill this with your pk_test_… / pk_live_… from the Stripe dashboard.
// Used by both the native payment sheet and the web Stripe Elements flow.
export const STRIPE_PUBLISHABLE_KEY = "";

export const isStripeConfigured = (): boolean =>
  STRIPE_PUBLISHABLE_KEY.startsWith("pk_");
