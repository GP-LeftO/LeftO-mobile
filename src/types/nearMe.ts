// Types derived from GET /api/listings response (verified against live API)

export interface NearMeSeller {
  id: string;
  businessName: string;
  businessType: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  verifiedBadge: boolean;
  totalDonations: number;
}

export interface NearMeListing {
  id: string;
  sellerId: string;
  type: "MEAL_BAG" | "SPECIFIC_PARCEL";
  title: string;
  description: string;
  category: "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";
  quantity: number;
  originalPrice: number;
  discountedPrice: number;
  pickupStart: string;
  pickupEnd: string;
  expiryDate: string;
  photoUrl: string | null;
  freshnessBadge: string;
  allergenNote: string | null;
  estimatedWeightG: number;
  estimatedCo2SavedG: number;
  qrCodeUrl: string | null;
  status: "ACTIVE" | "SOLD_OUT" | "EXPIRED";
  createdAt: string;
  updatedAt: string;
  seller: NearMeSeller;
  distanceKm?: number;
}

export interface NearMeListingsResponse {
  success: boolean;
  data: {
    listings: NearMeListing[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface NearMeCoords {
  latitude: number;
  longitude: number;
}

export interface NearMeMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
  listings?: NearMeListing[];
}

export interface NearMeQueryParams {
  coords: NearMeCoords;
  radius?: number;
  category?: string;
  limit?: number;
}
