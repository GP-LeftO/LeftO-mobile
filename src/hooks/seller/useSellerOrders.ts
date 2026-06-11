import { useState, useCallback, useRef } from "react";
import api from "../../services/shared/api";

export interface SellerOrder {
  id: string;
  status: "RESERVED" | "COMPLETED" | "CANCELLED" | "DONATED";
  quantity: number;
  totalPrice?: number;
  createdAt: string;
  expiresAt?: string;
  pickupStart?: string;
  pickupEnd?: string;
  listing?: { id: string; title: string };
  buyer?: { id: string; name?: string };
}

export function useSellerOrders() {
  const [orders,     setOrders]     = useState<SellerOrder[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");
  const [hasMore,    setHasMore]    = useState(true);

  // Use a ref for page so fetchOrders can be stable (no [page] dependency loop)
  const pageRef = useRef(1);

  const fetchOrders = useCallback(async (reset = false) => {
    const nextPage = reset ? 1 : pageRef.current;
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
      pageRef.current = nextPage + 1;
      setHasMore(pagination ? nextPage < pagination.totalPages : items.length === 10);
    } catch {
      setError("Could not load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // stable — no page in deps

  return { orders, loading, refreshing, error, hasMore, fetchOrders };
}
