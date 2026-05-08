import api from "../services/api";

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
