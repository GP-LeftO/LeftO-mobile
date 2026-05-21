import { useState, useEffect, useCallback } from "react";
import { fetchSellerReviews } from "../../services/buyer/profile/profileService";
import type { SellerReview } from "../../types/profile";

export interface UseSellerReviewsResult {
  reviews: SellerReview[];
  loading: boolean;
  error: boolean;
  refetch: () => void;
}

export function useSellerReviews(sellerId: string): UseSellerReviewsResult {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!sellerId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const data = await fetchSellerReviews(sellerId, 10);
      setReviews(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { load(); }, [load]);

  return { reviews, loading, error, refetch: load };
}
