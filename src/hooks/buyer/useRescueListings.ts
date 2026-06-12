import { useState, useEffect, useCallback } from 'react';
import { fetchRecommendedListings } from '../../services/shared/community.service';
import type { Listing } from '../../types';

export function useRescueListings() {
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [loading,   setLoading]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecommendedListings();
      // Only show listings that have a rescue badge (critical or expiring)
      setListings(data.filter(l => l.rescueBadge));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return { listings, loading, refresh: load };
}
