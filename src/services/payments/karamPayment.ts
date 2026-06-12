// Native (iOS/Android) Karam payment — wraps the Stripe React Native payment sheet.
// The web counterpart lives in karamPayment.web.ts (Metro picks it on platform "web").

export interface KaramPayOptions {
  merchantDisplayName: string;
}

export interface KaramPayResult {
  ok: boolean;
  canceled?: boolean;
  error?: string;
}

export function useKaramCheckout() {
  // Dynamic require — avoids a static import that crashes if the native module fails to link.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { useStripe } = require('@stripe/stripe-react-native');
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
