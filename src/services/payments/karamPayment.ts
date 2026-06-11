// Native (iOS/Android) Karam payment — wraps the Stripe React Native payment sheet.
// The web counterpart lives in karamPayment.web.ts (Metro picks it on platform "web").
import { useStripe } from "@stripe/stripe-react-native";

export interface KaramPayOptions {
  merchantDisplayName: string;
}

export interface KaramPayResult {
  ok: boolean;
  canceled?: boolean;
  error?: string;
}

export function useKaramCheckout() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const pay = async (clientSecret: string, opts: KaramPayOptions): Promise<KaramPayResult> => {
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      merchantDisplayName: opts.merchantDisplayName,
    });
    if (initError) return { ok: false, error: initError.message };

    const { error: payError } = await presentPaymentSheet();
    if (payError) {
      return { ok: false, canceled: payError.code === "Canceled", error: payError.message };
    }
    return { ok: true };
  };

  return { pay };
}
