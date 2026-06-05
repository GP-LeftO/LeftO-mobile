import { useState, useCallback } from "react";
import api from "../../services/shared/api";

export interface SellerOrder {
  id: string;
  status: "RESERVED" | "COMPLETED" | "CANCELLED";
  quantity: number;
  totalPrice?: number;
  pickupStart?: string;
  pickupEnd?: string;
  createdAt: string;
  listing?: { id: string; title: string };
  buyer?: { id: string; name?: string };
}

export function useSellerOrders() {
  const [orders,     setOrders]     = useState<SellerOrder[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);

  const fetchOrders = useCallback(async (reset = false) => {
    const nextPage = reset ? 1 : page;
    if (reset) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/sellers/me/orders", {
        params: { page: nextPage, limit: 10 },
      });
      const payload    = data.data ?? data;
      const items: SellerOrder[] = payload?.orders ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
      const pagination = payload?.pagination;

      setOrders(prev => reset ? items : [...prev, ...items]);
      setPage(nextPage + 1);
      setHasMore(pagination ? nextPage < pagination.totalPages : items.length === 10);
    } catch {
      setError("Could not load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  return { orders, loading, refreshing, error, hasMore, fetchOrders };
}
