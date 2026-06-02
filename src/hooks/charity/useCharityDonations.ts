import { useState, useCallback } from "react";
import { getCharityDonations, markDonationPickedUp, confirmDonation } from "../../services/charity/charity.service";
import type { CharityDonation } from "../../services/charity/charity.service";

export function useCharityDonations(status: "PENDING" | "PICKED_UP" | "CONFIRMED") {
  const [donations,  setDonations]  = useState<CharityDonation[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState("");
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(true);

  const fetch = useCallback(async (reset = false) => {
    const nextPage = reset ? 1 : page;
    if (reset) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { donations: items, pagination } = await getCharityDonations(nextPage, 10);
      const filtered = items.filter(d => d.status === status);
      setDonations(prev => reset ? filtered : [...prev, ...filtered]);
      setPage(nextPage + 1);
      setHasMore(nextPage < pagination.totalPages);
    } catch {
      setError("Could not load donations");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, status]);

  const pickUp = async (id: string) => {
    await markDonationPickedUp(id);
    await fetch(true);
  };

  const confirm = async (id: string, proofPhotoUrl?: string) => {
    await confirmDonation(id, proofPhotoUrl);
    await fetch(true);
  };

  return { donations, loading, refreshing, error, hasMore, fetch, pickUp, confirm };
}
