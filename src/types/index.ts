export type UserRole = "buyer" | "seller" | "charity" | null;

// Lowercase values match what the backend stores and returns (GET /api/users/me)
export type AllergyOption =
  | "gluten"
  | "dairy"
  | "nuts"
  | "eggs"
  | "seafood"
  | "soy"
  | "sesame"
  | "vegetarian"
  | "vegan"
  | "halal_only";

export type Language = "en" | "ar";

export type AppStep =
  | "splash"
  | "onboarding"
  | "role-selection"
  | "get-started"
  | "app";

// ─── Listing enums ────────────────────────────────────────────────────────────

// POST /api/listings → type: "MEAL_BAG" | "SPECIFIC_PARCEL"
export type ListingType = "MEAL_BAG" | "SPECIFIC_PARCEL";

// GET /api/listings → freshnessBadge values (lowercase from backend)
export type FreshnessBadge = "eat_today" | "fresh_tonight" | "good_1_2_days";

// GET /api/listings → status values
export type ListingStatus = "ACTIVE" | "SOLD_OUT" | "EXPIRED";

// POST /api/listings → category values
export type ListingCategory = "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";

// ─── Listing interfaces ───────────────────────────────────────────────────────

export interface ListingSeller {
  id: string;
  businessName: string;
  businessType: string;
  rating?: number;
  verifiedBadge?: boolean;
  totalDonations?: number;
  participatesInKaram?: boolean;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

export type RescueBadge = "critical_rescue" | "expiring_soon" | "good_deal";

export interface Listing {
  id: string;
  title: string;
  description?: string;
  type: ListingType;
  category?: ListingCategory;
  status: ListingStatus;
  freshnessBadge?: FreshnessBadge;
  originalPrice: number;
  discountedPrice: number;
  currentPrice: number;
  isPriceDecaying: boolean;
  floorPrice?: number | null;
  expiryDate?: string | null;
  createdAt?: string;
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  allergenNote?: string;
  estimatedWeightG?: number;
  estimatedCo2SavedG?: number;
  qrCodeUrl?: string;
  distanceKm?: number;
  rescueScore?: number;
  rescueBadge?: RescueBadge | null;
  seller: ListingSeller;
}

/** Full listing detail returned by GET /api/listings/:id */
export interface ListingDetail extends Listing {
  rating?: number;
  reviewCount?: number;
  score?: number;
  reasons?: string[];
}

/** Full seller profile returned by GET /api/sellers/:id */
export interface SellerDetail {
  id: string;
  businessName: string;
  businessType: string;
  description?: string;
  hero?: string;
  heroImage?: string;
  rating?: number;
  reviewCount?: number;
  verifiedBadge?: boolean;
  totalDonations?: number;
  location?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  contactInfo?: {
    phone?: string;
    website?: string;
    socialMedia?: string;
  };
}

/** Full user profile returned by GET /api/users/me */
export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: "BUYER" | "SELLER" | "CHARITY";
  language?: "AR" | "EN";
  avatarStyle?: string | null;
  avatarColor?: string | null;
  dietaryPreferences: string[];
  allergyPreferences: AllergyOption[];
  badges: string[];
  points: number;
  totalCo2SavedKg: number;
  pickupWindowPref?: string | null;
  createdAt: string;
  activeOrdersCount: number;
  confirmedDonationsCount: number;
  seller?: {
    id: string;
    businessName: string;
    businessType: string;
    status: string;
    rating?: number;
    verifiedBadge: boolean;
  } | null;
  charity?: unknown | null;
}

// ─── Store details navigation params ─────────────────────────────────────────

export interface StoreDetailsParams {
  listingId: string;
  sellerId: string;
}

// ─── Charity registration ─────────────────────────────────────────────────────

export interface CharityInfoFormData {
  orgName: string;
  description: string;
  region: string;
  registrationNumber: string;
  location: { latitude: number; longitude: number; address?: string } | null;
  contactPhone: string;
}

export interface CharityRegistrationForm extends CharityInfoFormData {
  docUri: string | null;
  docName: string;
}
