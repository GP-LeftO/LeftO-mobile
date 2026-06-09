import { useState, useEffect, useCallback } from "react";
import api from "../../services/shared/api";
import type { SellerReview } from "../../types/profile";

export interface UseSellerReviewsResult {
  reviews: SellerReview[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: boolean;
  refetch: () => void;
  loadMore: () => void;
}

export function useSellerReviews(sellerId: string): UseSellerReviewsResult {
  const [reviews,     setReviews]     = useState<SellerReview[]>([]);
  const [page,        setPage]        = useState(1);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState(false);

  const fetchPage = useCallback(async (pageNum: number, replace: boolean) => {
    if (!sellerId) return;
    replace ? setLoading(true) : setLoadingMore(true);
    setError(false);
    try {
      const res  = await api.get(`/api/reviews/seller/${sellerId}`, { params: { page: pageNum, limit: 10 } });
      const payload    = res.data?.data ?? res.data;
      const arr        = payload?.reviews ?? payload?.data ?? payload;
      const fetched    = Array.isArray(arr) ? (arr as SellerReview[]) : [];
      const pagination = payload?.pagination;
      setReviews((prev) => replace ? fetched : [...prev, ...fetched]);
      setHasMore(pagination ? pageNum < pagination.totalPages : false);
    } catch {
      setError(true);
    } finally {
      replace ? setLoading(false) : setLoadingMore(false);
    }
  }, [sellerId]);

  const refetch = useCallback(() => {
    setPage(1);
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  }, [fetchPage, hasMore, loadingMore, page]);

  useEffect(() => { fetchPage(1, true); }, [fetchPage]);

  return { reviews, loading, loadingMore, hasMore, error, refetch, loadMore };
}
