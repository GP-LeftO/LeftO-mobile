// Web Karam payment — real Stripe card collection via Stripe.js mounted into a DOM
// modal overlay. No native module; uses @stripe/stripe-js + the same PaymentIntent
// clientSecret the backend already returns. Requires STRIPE_PUBLISHABLE_KEY.
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { STRIPE_PUBLISHABLE_KEY, isStripeConfigured } from "../../config/payments";

export interface KaramPayOptions {
  merchantDisplayName: string;
}

export interface KaramPayResult {
  ok: boolean;
  canceled?: boolean;
  error?: string;
}

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  return stripePromise;
}

// Builds a centered modal with a Stripe Card Element + Pay/Cancel buttons.
// Resolves once the user pays, cancels, or an error occurs.
function runCardModal(clientSecret: string, opts: KaramPayOptions): Promise<KaramPayResult> {
  return new Promise(async (resolve) => {
    const stripe = await getStripe();
    if (!stripe) {
      resolve({ ok: false, error: "Stripe failed to load" });
      return;
    }

    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);" +
      "display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif";

    const card = document.createElement("div");
    card.style.cssText =
      "background:#fff;border-radius:16px;padding:24px;width:min(92vw,400px);" +
      "box-shadow:0 12px 40px rgba(0,0,0,0.25)";
    card.innerHTML =
      `<div style="font-size:17px;font-weight:700;color:#404040;margin-bottom:4px">${opts.merchantDisplayName}</div>` +
      `<div style="font-size:13px;color:#9CA3AF;margin-bottom:16px">Enter your card details</div>` +
      `<div id="lefto-card-el" style="padding:12px;border:1.5px solid #E5E7EB;border-radius:10px"></div>` +
      `<div id="lefto-card-err" style="color:#EF4444;font-size:12px;min-height:16px;margin-top:8px"></div>` +
      `<button id="lefto-pay-btn" style="margin-top:8px;width:100%;padding:13px;border:none;border-radius:12px;` +
      `background:#DE985A;color:#fff;font-size:15px;font-weight:700;cursor:pointer">Pay</button>` +
      `<button id="lefto-cancel-btn" style="margin-top:8px;width:100%;padding:11px;border:none;border-radius:12px;` +
      `background:transparent;color:#9CA3AF;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>`;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const elements = stripe.elements();
    const cardEl = elements.create("card", { hidePostalCode: true });
    cardEl.mount("#lefto-card-el");

    const errBox = card.querySelector<HTMLDivElement>("#lefto-card-err")!;
    const payBtn = card.querySelector<HTMLButtonElement>("#lefto-pay-btn")!;
    const cancelBtn = card.querySelector<HTMLButtonElement>("#lefto-cancel-btn")!;

    const cleanup = () => {
      cardEl.unmount();
      document.body.removeChild(overlay);
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve({ ok: false, canceled: true });
    };

    payBtn.onclick = async () => {
      payBtn.disabled = true;
      payBtn.textContent = "Processing…";
      errBox.textContent = "";
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl },
      });
      if (error) {
        errBox.textContent = error.message ?? "Payment failed";
        payBtn.disabled = false;
        payBtn.textContent = "Pay";
        return;
      }
      cleanup();
      resolve({ ok: paymentIntent?.status === "succeeded" });
    };
  });
}

export function useKaramCheckout() {
  const pay = async (clientSecret: string, opts: KaramPayOptions): Promise<KaramPayResult> => {
    if (!isStripeConfigured()) {
      return { ok: false, error: "Stripe publishable key not configured" };
    }
    return runCardModal(clientSecret, opts);
  };
  return { pay };
}
