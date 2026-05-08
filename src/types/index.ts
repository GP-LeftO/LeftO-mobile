export type UserRole = "buyer" | "seller" | "charity" | null;

export type Language = "en" | "ar";

export type AppStep =
  | "splash"
  | "onboarding"
  | "role-selection"
  | "get-started"
  | "app";

// ─── Listing enums ────────────────────────────────────────────────────────────

export type ListingType = "SURPRISE_BAG" | "SPECIFIC_PARCEL";

export type FreshnessBadge = "FRESH_TODAY" | "EAT_SOON" | "LAST_CHANCE";

export type ListingStatus = "AVAILABLE" | "SOLD_OUT";

// ─── Listing interfaces ───────────────────────────────────────────────────────

export interface ListingSeller {
  id: string;
  businessName: string;
  businessType: string;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface Listing {
  id: string;
  title: string;
  description?: string;
  type: ListingType;
  status: ListingStatus;
  freshnessBadge: FreshnessBadge;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  allergenNote?: string;
  seller: ListingSeller;
}

// ─── Store details navigation params ─────────────────────────────────────────

export interface StoreDetailsParams {
  listingId: string;
  sellerId: string;
}
