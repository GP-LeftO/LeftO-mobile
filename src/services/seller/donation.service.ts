import api from "../shared/api";

export interface SellerDonationPayload {
  listingId: string;
  charityId: string;
  quantity: number;
  pickupStart: string;
  pickupEnd: string;
}

export interface SellerDonation {
  id: string;
  status: "PENDING" | "PICKED_UP" | "CONFIRMED";
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  createdAt: string;
  proofPhotoUrl?: string;
  listing?: { id: string; title: string };
  charity?: { id: string; orgName: string };
}

export const createSellerDonation = (payload: SellerDonationPayload): Promise<SellerDonation> =>
  api.post("/api/donations", payload).then((r) => r.data.data);

export const getSellerDonations = (page = 1, limit = 10): Promise<{ donations: SellerDonation[]; pagination: { page: number; totalPages: number } }> =>
  api.get("/api/donations/me", { params: { page, limit } }).then((r) => {
    const payload = r.data.data ?? r.data;
    const donations = payload?.donations ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
    const pagination = payload?.pagination ?? { page, totalPages: 1 };
    return { donations, pagination };
  });
