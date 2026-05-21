// Order status values verified against GET /api/orders/me Swagger spec
export type ProfileOrderStatus = "RESERVED" | "COMPLETED" | "CANCELLED";

export interface ProfileOrderSeller {
  id: string;
  businessName: string;
}

export interface ProfileOrderCharity {
  id: string;
  name: string;
}

export interface ProfileOrderListing {
  id: string;
  title: string;
  discountedPrice: number;
  seller?: ProfileOrderSeller;
}

export interface ProfileOrder {
  id: string;
  buyerId: string;
  listingId: string;
  quantity: number;
  totalPrice: number;
  status: ProfileOrderStatus;
  type: "PURCHASE" | "DONATION";
  charityId?: string;
  charity?: ProfileOrderCharity;
  pickupStart?: string;
  pickupEnd?: string;
  createdAt: string;
  listing?: ProfileOrderListing;
}

// POST /api/reviews — required fields verified from Swagger spec
export interface ReviewPayload {
  orderId: string;
  sellerId: string;
  ratingOverall: number; // 1–5
  ratingPickup: number;  // 1–5
  ratingQuality: number; // 1–5
  ratingVariety: number; // 1–5
  comment?: string;
}

export type ToastKey = "reviewSuccess" | "alreadyReviewed" | "error";

// GET /api/reviews/seller/:id
export interface SellerReviewBuyer {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
}

export interface SellerReview {
  id: string;
  ratingOverall: number;
  ratingPickup: number;
  ratingQuality: number;
  ratingVariety: number;
  comment?: string;
  createdAt: string;
  buyer?: SellerReviewBuyer;
}

export interface SellerReviewsResponse {
  reviews: SellerReview[];
  averageRating?: number;
  totalReviews?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
