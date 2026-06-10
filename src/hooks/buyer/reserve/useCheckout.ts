import { useState, useCallback } from "react";
import { createOrder } from "../../../services/buyer/reserve/orderService";
import { createDonation } from "../../../services/buyer/reserve/donationService";
import type { Order, CheckoutParams } from "../../../types/order.types";

interface UseCheckoutResult {
  quantity: number;
  loading: boolean;
  error: string | null;
  increaseQty: () => void;
  decreaseQty: () => void;
  submitReservation: (params: CheckoutParams) => Promise<Order>;
  submitDonation: (charityId: string, params: CheckoutParams) => Promise<Order>;
}

export function useCheckout(availableQuantity: number): UseCheckoutResult {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const increaseQty = useCallback(() => {
    setQuantity(prev => Math.min(prev + 1, availableQuantity));
  }, [availableQuantity]);

  const decreaseQty = useCallback(() => {
    setQuantity(prev => Math.max(prev - 1, 1));
  }, []);

  const submitReservation = useCallback(async (params: CheckoutParams): Promise<Order> => {
    setLoading(true);
    setError(null);
    try {
      const order = await createOrder({ listingId: params.listingId, quantity, type: "PURCHASE" });
      return order;
    } catch (err: unknown) {
      const axErr = err as { response?: { status?: number; data?: { message?: string } } };
      const status = axErr.response?.status;
      const msg = status === 403
        ? "حسابك موقوف مؤقتاً بسبب إلغاءات متعددة. تواصل مع الدعم لإعادة التفعيل."
        : (axErr.response?.data?.message ?? "Something went wrong. Please try again.");
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quantity]);

  const submitDonation = useCallback(async (charityId: string, params: CheckoutParams): Promise<Order> => {
    setLoading(true);
    setError(null);
    try {
      const order = await createDonation({ listingId: params.listingId, charityId, quantity, type: "DONATION" });
      return order;
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } };
      const msg = axErr.response?.data?.message ?? "Something went wrong. Please try again.";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quantity]);

  return { quantity, loading, error, increaseQty, decreaseQty, submitReservation, submitDonation };
}
