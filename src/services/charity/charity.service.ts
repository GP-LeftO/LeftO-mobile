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

// ─── Basket (food needs) ────────────────────────────────────────────────────

export type BasketCategory = "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";

export interface CharitySummary {
  id: string;
  name: string;
  region?: string;
  basket: BasketCategory[];
}

export function getMyCharityProfile(): Promise<{ id: string }> {
  return api.get("/api/charities/me").then(r => r.data?.data ?? r.data);
}

export function getMyBasket(): Promise<BasketCategory[]> {
  return api.get("/api/charities/me/basket").then(r => {
    const d = r.data?.data ?? r.data;
    return d?.categories ?? [];
  });
}

export function setMyBasket(categories: BasketCategory[]): Promise<void> {
  return api.put("/api/charities/me/basket", { categories }).then(() => undefined);
}

export function getCharityBasket(charityId: string): Promise<BasketCategory[]> {
  return api.get(`/api/charities/${charityId}/basket`).then(r => {
    const d = r.data?.data ?? r.data;
    return d?.categories ?? [];
  });
}

export function getApprovedCharities(): Promise<CharitySummary[]> {
  return api.get("/api/charities").then(async r => {
    const payload = r.data?.data ?? r.data;
    const arr: {id: string; name?: string; orgName?: string; region?: string}[] =
      Array.isArray(payload) ? payload : payload?.charities ?? payload?.items ?? [];
    const results = await Promise.allSettled(
      arr.map(c => getCharityBasket(c.id).then(basket => ({
        id: c.id,
        name: c.name ?? c.orgName ?? "Charity",
        region: c.region,
        basket,
      })))
    );
    return results
      .filter(r => r.status === "fulfilled")
      .map(r => (r as PromiseFulfilledResult<CharitySummary>).value);
  });
}
