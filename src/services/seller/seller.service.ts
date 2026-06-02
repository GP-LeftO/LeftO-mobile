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
  type?: "MEAL_BAG" | "SPECIFIC_PARCEL";
  category?: "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";
  originalPrice?: number;
  discountedPrice?: number;
  price?: number;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  freshnessBadge?: "eat_today" | "fresh_tonight" | "good_1_2_days";
  allergenNote?: string;
  photoUrl?: string;
  status?: string;
}

export interface ListingFormData {
  title: string;
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
}

// ─── Seller registration ──────────────────────────────────────────────────────

export interface RegisterSellerParams {
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY";
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
  api.put(`/api/listings/${id}`, data).then((r) => r.data.data);

export const deleteListing = (id: string): Promise<void> =>
  api.delete(`/api/listings/${id}`).then(() => undefined);

export const markListingSoldOut = (listingId: string) =>
  api.patch(`/api/listings/${listingId}/sold-out`);
