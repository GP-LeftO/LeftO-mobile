import api from "../../shared/api";
import type { UserProfile } from "../../../types";
import type { ProfileOrder, ReviewPayload, SellerReview, SellerReviewsResponse } from "../../../types/profile";

export function fetchProfile(): Promise<UserProfile> {
  return api.get("/api/users/me").then((r) => {
    const payload = r.data?.data ?? r.data;
    return payload as UserProfile;
  });
}

export function fetchMyOrders(): Promise<ProfileOrder[]> {
  return api
    .get("/api/orders/me", { params: { limit: 50 } })
    .then((r) => {
      const payload = r.data?.data ?? r.data;
      if (Array.isArray(payload)) return payload as ProfileOrder[];
      return (payload?.orders ?? payload?.items ?? payload?.data ?? []) as ProfileOrder[];
    });
}

export function submitReview(payload: ReviewPayload): Promise<void> {
  return api.post("/api/reviews", payload).then(() => undefined);
}

export function fetchSellerReviews(sellerId: string, limit = 10): Promise<SellerReview[]> {
  return api
    .get(`/api/reviews/seller/${sellerId}`, { params: { limit } })
    .then((r) => {
      const payload = r.data?.data ?? r.data;
      const arr = payload?.reviews ?? payload?.data ?? payload;
      return Array.isArray(arr) ? (arr as SellerReview[]) : [];
    });
}
