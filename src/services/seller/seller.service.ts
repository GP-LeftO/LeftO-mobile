import api from "../shared/api";
import type { SellerDetail } from "../../types";

export const MOCK_SELLER: SellerDetail = {
  id: "mock-seller-1",
  businessName: "Sunrise Bakery",
  businessType: "BAKERY",
  description:
    "Family-run bakery serving fresh bread and pastries since 1998. We rescue unsold items every evening so nothing goes to waste.",
  hero: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
  heroImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
  rating: 4.7,
  reviewCount: 38,
  location: {
    address: "14 Al-Nuzha St, Ramallah",
    latitude: 31.9038,
    longitude: 35.2034,
  },
  contactInfo: {
    phone: "+970-2-555-0100",
    website: "https://sunrisebakery.ps",
  },
};

// ─── Shared listing types ─────────────────────────────────────────────────────

export interface SellerListing {
  id: string;
  title: string;
  description?: string;
  type?: "MEAL_BAG" | "SPECIFIC_PARCEL";
  category?: "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";
  originalPrice?: number;
  discountedPrice?: number;
  price?: number;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  expiryDate?: string | null;
  freshnessBadge?: "eat_today" | "fresh_tonight" | "good_1_2_days";
  allergenNote?: string;
  photoUrl?: string;
  status?: string;
  qrCodeUrl?: string;
  isPriceDecaying?: boolean;
  floorPrice?: number | null;
}

export interface ListingFormData {
  title: string;
  description?: string;
  type: "MEAL_BAG" | "SPECIFIC_PARCEL";
  category: "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  pickupStart: string;
  pickupEnd: string;
  freshnessBadge: "eat_today" | "fresh_tonight" | "good_1_2_days";
  allergenNote?: string;
  photoUrl?: string;
  expiryDate?: string;
  isPriceDecaying?: boolean;
  floorPrice?: number;
}

// ─── Seller registration ──────────────────────────────────────────────────────

export interface RegisterSellerParams {
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY" | "GROCERY";
  registrationNumber?: string;
  location: { latitude: number; longitude: number; address?: string };
  description?: string;
  contactInfo?: { phone?: string; website?: string; socialMedia?: string };
  documentUrls?: string[];
}

export const registerSeller = (params: RegisterSellerParams) =>
  api.post("/api/sellers/register", params).then((r) => r.data.data);

export const getSellerProfile = () =>
  api.get("/api/sellers/me").then((r) => r.data.data);

// ─── Listing queries ──────────────────────────────────────────────────────────

export const getSellerListings = (sellerId: string): Promise<SellerListing[]> =>
  api.get("/api/listings", { params: { sellerId } }).then((r) => {
    const payload = r.data.data ?? r.data;
    return Array.isArray(payload)
      ? payload
      : (payload?.listings ?? payload?.items ?? payload?.data ?? []);
  });

export const getListings = (params?: Record<string, string>) =>
  api.get("/api/listings", { params });

// ─── Listing mutations ────────────────────────────────────────────────────────

export const createListing = (data: ListingFormData): Promise<SellerListing> =>
  api.post("/api/listings", data).then((r) => r.data.data);

export const updateListing = (id: string, data: ListingFormData): Promise<SellerListing> =>
  api.patch(`/api/listings/${id}`, data).then((r) => r.data.data);

export const deleteListing = (id: string): Promise<void> =>
  api.delete(`/api/listings/${id}`).then(() => undefined);

export const markListingSoldOut = (listingId: string) =>
  api.patch(`/api/listings/${listingId}/sold-out`);

// ─── Seller orders ────────────────────────────────────────────────────────────

export interface SellerOrder {
  id: string;
  status: "RESERVED" | "COMPLETED" | "CANCELLED" | "DONATED";
  totalPrice?: number;
  quantity?: number;
  createdAt?: string;
  expiresAt?: string;
  qrCodeUrl?: string;
  listing?: { id?: string; title?: string; pickupStart?: string; pickupEnd?: string };
  buyer?: { id?: string; name?: string; phone?: string };
}

export const getSellerOrders = (params?: { status?: string; page?: number; limit?: number }): Promise<SellerOrder[]> =>
  api.get("/api/sellers/me/orders", { params }).then((r) => {
    const payload = r.data?.data ?? r.data;
    return (Array.isArray(payload) ? payload : payload?.orders ?? payload?.items ?? payload?.data ?? []) as SellerOrder[];
  });

// ─── Seller profile update ────────────────────────────────────────────────────

// Matches actual PATCH /api/sellers/me schema (flat fields, not nested)
export interface UpdateSellerParams {
  businessName?: string;
  description?: string;
  phone?: string;
  website?: string;
  socialMedia?: string;
  logoUrl?: string;
}

export const updateSellerProfile = (params: UpdateSellerParams) =>
  api.patch("/api/sellers/me", params).then((r) => r.data?.data ?? r.data);

// ─── Karam program (seller-side) ──────────────────────────────────────────────

export const updateKaramParticipation = (participatesInKaram: boolean) =>
  api.patch("/api/sellers/me/karam", { participatesInKaram }).then((r) => r.data?.data ?? r.data);

export const sponsorKaramMealAsSeller = () =>
  api.post("/api/sellers/me/karam/sponsor").then((r) => r.data?.data ?? r.data);

export const claimKaramMeal = () =>
  api.post("/api/sellers/me/karam/claim").then((r) => r.data?.data ?? r.data);

// ─── Seller donation (create) ─────────────────────────────────────────────────

export interface CreateDonationParams {
  listingId: string;
  charityId: string;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  purposeNote?: string;
}

export const createDonation = (params: CreateDonationParams) =>
  api.post("/api/donations", params).then((r) => r.data?.data ?? r.data);

// ─── Seller donations (history) ───────────────────────────────────────────────

export interface SellerDonation {
  id: string;
  status: "PENDING" | "PICKED_UP" | "CONFIRMED" | "CANCELLED";
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  createdAt?: string;
  listing?: { id?: string; title?: string };
  charity?: { id?: string; orgName?: string; name?: string };
}

export const getMySellerDonations = (page = 1, limit = 20): Promise<SellerDonation[]> =>
  api.get("/api/donations/me", { params: { page, limit } }).then((r) => {
    const payload = r.data?.data ?? r.data;
    return (Array.isArray(payload) ? payload : payload?.donations ?? []) as SellerDonation[];
  });
