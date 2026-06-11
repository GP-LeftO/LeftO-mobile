import { isExpoGo } from './pushNotifications.service';

export function getStripeHook() {
  if (isExpoGo) {
    console.warn('[LeftO] Expo Go — Stripe is not available');
    return {
      initPaymentSheet:    async () => ({ error: null }),
      presentPaymentSheet: async () => ({ error: null }),
      confirmPayment:      async () => ({ error: null }),
    };
  }
  // Dynamic require — only runs in real builds where the native module is linked.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useStripe } = require('@stripe/stripe-react-native');
  return useStripe();
}

export async function isStripeAvailable(): Promise<boolean> {
  if (isExpoGo) return false;
  try {
    require('@stripe/stripe-react-native');
    return true;
  } catch {
    return false;
  }
}
