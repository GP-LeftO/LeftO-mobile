/**
 * useStoreDetails
 *
 * Fetches listing and seller details in parallel for the StoreDetailsScreen.
 * Manages loading, error, and refresh states.
 * Returns typed data with null safety — screen never crashes on missing fields.
 */

import { useState, useCallback, useEffect } from "react";
import { getListingById, getSellerById } from "../services/listing.service";
import type { ListingDetail, SellerDetail } from "../types";

interface UseStoreDetailsResult {
  listing:   ListingDetail | null;
  seller:    SellerDetail  | null;
  loading:   boolean;
  error:     string | null;
  refetch:   () => void;
}

export function useStoreDetails(
  listingId: string,
  sellerId:  string
): UseStoreDetailsResult {
  const [listing,  setListing]  = useState<ListingDetail | null>(null);
  const [seller,   setSeller]   = useState<SellerDetail  | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingData, sellerData] = await Promise.all([
        getListingById(listingId),
        getSellerById(sellerId),
      ]);
      setListing(listingData);
      setSeller(sellerData);
    } catch {
      setError("error");
    } finally {
      setLoading(false);
    }
  }, [listingId, sellerId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { listing, seller, loading, error, refetch: fetch };
}
