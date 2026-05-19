import api from "../../shared/api";
import type { Charity } from "../../../types/charity.types";
import type { Order } from "../../../types/order.types";
import type { CreateDonationPayload } from "../../../types/donation.types";

export async function getCharities(): Promise<Charity[]> {
  const res = await api.get("/api/charities");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : (payload?.charities ?? payload?.items ?? []);
}

export async function createDonation(payload: CreateDonationPayload): Promise<Order> {
  const res = await api.post("/api/orders", {
    listingId: payload.listingId,
    charityId: payload.charityId,
    quantity: payload.quantity,
    type: "DONATION",
  });
  return res.data?.data ?? res.data;
}
