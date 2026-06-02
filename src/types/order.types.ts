export interface CheckoutParams {
  listingId: string;
  listingTitle: string;
  storeName: string;
  pickupStart?: string;
  pickupEnd?: string;
  pickupWindow: string | null;
  originalPrice: number;
  discountedPrice: number;
  availableQuantity: number;
  estimatedCo2SavedKg?: number;
}

export interface CreateOrderPayload {
  listingId: string;
  quantity: number;
  type: "PURCHASE" | "DONATION";
  charityId?: string;
}

export interface Order {
  id: string;
  buyerId: string;
  listingId: string;
  quantity: number;
  totalPrice: number;
  status: "RESERVED" | "PICKED_UP" | "CANCELLED" | "EXPIRED";
  type: "PURCHASE" | "DONATION";
  charityId?: string;
  pickupStart?: string;
  pickupEnd?: string;
  createdAt: string;
  listing?: {
    id: string;
    title: string;
    discountedPrice: number;
    seller?: {
      id: string;
      businessName: string;
    };
  };
}
