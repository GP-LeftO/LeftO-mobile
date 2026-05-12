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

export const getSellerListings = (sellerId: string) =>
  api.get("/api/listings", { params: { sellerId } }).then((r) => {
    const payload = r.data.data ?? r.data;
    return Array.isArray(payload)
      ? payload
      : (payload?.listings ?? payload?.items ?? payload?.data ?? []);
  });

export const getListings = (params?: Record<string, string>) =>
  api.get("/api/listings", { params });

export const markListingSoldOut = (listingId: string) =>
  api.patch(`/api/listings/${listingId}/sold-out`);
