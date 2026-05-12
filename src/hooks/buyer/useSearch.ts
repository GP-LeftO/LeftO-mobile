/**
 * useSearch
 *
 * Debounced search hook for the SearchScreen.
 * - Accepts a query string
 * - Debounces API calls by 500 ms using useEffect + setTimeout (no external lib)
 * - Returns empty listings immediately when query is empty (no API call)
 * - Returns { listings, isLoading, error, refetch }
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { searchListings } from "../../services/buyer/search.service";
import type { Listing } from "../../types";

interface UseSearchResult {
  listings:  Listing[];
  isLoading: boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useSearch(query: string): UseSearchResult {
  const [listings,  setListings]  = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const lastQuery   = useRef<string>("");

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setListings([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await searchListings({ q: q.trim(), radiusKm: 5, page: 1, limit: 20 });
      setListings(result.listings);
    } catch {
      setError("error");
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setListings([]);
      setIsLoading(false);
      setError(null);
      lastQuery.current = "";
      return;
    }

    lastQuery.current = query;
    setIsLoading(true);

    const timer = setTimeout(() => {
      doSearch(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const refetch = useCallback(() => {
    if (lastQuery.current) doSearch(lastQuery.current);
  }, [doSearch]);

  return { listings, isLoading, error, refetch };
}
