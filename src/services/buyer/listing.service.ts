/**
 * listing.service.ts
 * API calls for individual listing and seller detail endpoints.
 * Falls back to mock data in development when the API is unavailable.
 */

import api from "../shared/api";
import type { ListingDetail, SellerDetail } from "../../types";
import { MOCK_SELLER } from "../seller/seller.service";

const MOCK_LISTING: ListingDetail = {
  id: "mock-listing-1",
  title: "Mixed Pastry Bag",
  description:
    "A surprise selection of today's freshest pastries — croissants, danishes, and more. Rescue food, save money, reduce waste.",
  type: "SURPRISE_BAG",
  status: "AVAILABLE",
  freshnessBadge: "FRESH_TODAY",
  originalPrice: 40,
  discountedPrice: 15,
  quantity: 5,
  pickupStart: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  pickupEnd: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
  allergenNote: "May contain gluten, dairy, eggs, and nuts.",
  rating: 4.7,
  reviewCount: 38,
  seller: {
    id: MOCK_SELLER.id,
    businessName: MOCK_SELLER.businessName,
    businessType: MOCK_SELLER.businessType,
    location: MOCK_SELLER.location,
  },
};

export const getListingById = async (id: string): Promise<ListingDetail> => {
  try {
    return await api.get(`/api/listings/${id}`).then((r) => r.data.data ?? r.data);
  } catch (err) {
    if (__DEV__) return { ...MOCK_LISTING, id };
    throw err;
  }
};

export const getSellerById = async (id: string): Promise<SellerDetail> => {
  try {
    return await api.get(`/api/sellers/${id}`).then((r) => r.data.data ?? r.data);
  } catch (err) {
    if (__DEV__) return { ...MOCK_SELLER, id };
    throw err;
  }
};
