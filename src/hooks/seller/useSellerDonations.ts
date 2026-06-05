import { useState, useCallback } from "react";
import { getSellerDonations } from "../../services/seller/donation.service";
import type { SellerDonation } from "../../services/seller/donation.service";

export function useSellerDonations() {
  const [donations,  setDonations]  = useState<SellerDonation[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);

  const fetchDonations = useCallback(async (reset = false) => {
    const nextPage = reset ? 1 : page;
    if (reset) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { donations: items, pagination } = await getSellerDonations(nextPage, 10);
      setDonations(prev => reset ? items : [...prev, ...items]);
      setPage(nextPage + 1);
      setHasMore(nextPage < pagination.totalPages);
    } catch {
      setError("Could not load donations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  return { donations, loading, refreshing, error, hasMore, fetchDonations };
}
