// Buyer donations are created via POST /api/orders with type="DONATION".
// The response shape is identical to Order.
export type { Order as Donation } from "./order.types";

export interface CreateDonationPayload {
  listingId: string;
  charityId: string;
  quantity: number;
  type: "DONATION";
}
