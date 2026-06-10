import api from "../shared/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DonationStatus = "PENDING" | "PICKED_UP" | "CONFIRMED";

export interface Donation {
  id: string;
  donorType: "BUYER" | "SELLER";
  donorId: string;
  charityId: string;
  listingId: string;
  sellerId: string;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  status: DonationStatus;
  proofPhoto?: string;
  createdAt: string;
  updatedAt: string;
  listing?: {
    id?: string;
    title?: string;
    pickupStart?: string;
    pickupEnd?: string;
    seller?: { id?: string; businessName?: string };
  };
  seller?: { id?: string; businessName?: string };
}

export interface DonationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RatingInput {
  ratingOverall: number;
  ratingPickup: number;
  ratingQuality: number;
  ratingVariety: number;
  comment?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export const getMyDonations = (page: number, limit: number) =>
  api.get("/api/donations/me", { params: { page, limit } });

export const markPickedUp = (donationId: string) =>
  api.patch(`/api/donations/${donationId}/pickup`);

export const confirmDonation = (donationId: string, proofPhotoUrl?: string) =>
  api.patch(
    `/api/donations/${donationId}/confirm`,
    proofPhotoUrl ? { proofPhotoUrl } : {}
  );

export const uploadProof = (formData: FormData) =>
  api.post("/api/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const rateSellerAfterDonation = (
  donationId: string,
  sellerId: string,
  ratings: RatingInput
) => api.post("/api/reviews/charity", { donationId, sellerId, ...ratings });
