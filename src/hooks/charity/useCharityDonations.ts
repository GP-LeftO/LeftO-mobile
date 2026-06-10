import { useState, useEffect, useCallback } from "react";
import * as charityService from "../../services/charity/charity.service";
import type { Donation, RatingInput } from "../../services/charity/charity.service";

export function useCharityDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const loadDonations = useCallback(async (pageNum: number) => {
    if (pageNum === 1) setLoading(true);
    setError(null);
    try {
      const res = await charityService.getMyDonations(pageNum, 10);
      const payload = res.data?.data ?? res.data;
      const items: Donation[] = Array.isArray(payload)
        ? payload
        : (payload?.donations ?? []);
      const pagination = payload?.pagination;

      setDonations((prev) => (pageNum === 1 ? items : [...prev, ...items]));
      setPage(pageNum);
      setHasMore(pagination ? pageNum < pagination.totalPages : false);
    } catch {
      setError("تعذّر تحميل التبرعات. يرجى المحاولة مجدداً.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await charityService.getMyDonations(1, 10);
      const payload = res.data?.data ?? res.data;
      const items: Donation[] = Array.isArray(payload)
        ? payload
        : (payload?.donations ?? []);
      const pagination = payload?.pagination;

      setDonations(items);
      setPage(1);
      setHasMore(pagination ? 1 < pagination.totalPages : false);
    } catch {
      setError("تعذّر تحميل التبرعات. يرجى المحاولة مجدداً.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) loadDonations(page + 1);
  }, [hasMore, loading, page, loadDonations]);

  const markPickedUp = useCallback(
    async (id: string) => {
      const snapshot = donations;
      setDonations((d) =>
        d.map((item) =>
          item.id === id ? { ...item, status: "PICKED_UP" as const } : item
        )
      );
      try {
        await charityService.markPickedUp(id);
      } catch {
        setDonations(snapshot);
        throw new Error("pickup failed");
      }
    },
    [donations]
  );

  const confirmWithProof = useCallback(
    async (id: string, imageUri?: string) => {
      let fileUrl: string | undefined;

      if (imageUri) {
        const filename = imageUri.split("/").pop() ?? "proof.jpg";
        const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
        const mime = ext === "png" ? "image/png" : "image/jpeg";
        const form = new FormData();
        form.append("file", {
          uri: imageUri,
          name: filename,
          type: mime,
        } as unknown as Blob);
        form.append("documentType", "CHARITY_REGISTRATION");

        const uploadRes = await charityService.uploadProof(form);
        const uploadPayload = uploadRes.data?.data ?? uploadRes.data;
        fileUrl = uploadPayload?.fileUrl as string | undefined;
      }

      await charityService.confirmDonation(id, fileUrl);

      setDonations((d) =>
        d.map((item) =>
          item.id === id
            ? {
                ...item,
                status: "CONFIRMED" as const,
                ...(fileUrl ? { proofPhoto: fileUrl } : {}),
              }
            : item
        )
      );
    },
    []
  );

  const rateSeller = useCallback(
    async (donationId: string, sellerId: string, ratings: RatingInput) => {
      await charityService.rateSellerAfterDonation(donationId, sellerId, ratings);
      setRatedIds((prev) => new Set([...prev, donationId]));
    },
    []
  );

  useEffect(() => {
    loadDonations(1);
  }, [loadDonations]);

  return {
    donations,
    loading,
    refreshing,
    error,
    hasMore,
    ratedIds,
    loadDonations,
    refresh,
    loadMore,
    markPickedUp,
    confirmWithProof,
    rateSeller,
  };
}
