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

export const createSellerDonation = async (payload: SellerDonationPayload): Promise<SellerDonation> => {
  try {
    const r = await api.post("/api/donations", payload);
    return r.data.data;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: unknown }; config?: { url?: string; data?: string }; message?: string };
    console.error('[Donation] createSellerDonation failed:', JSON.stringify({
      status:      err?.response?.status,
      data:        err?.response?.data,
      message:     err?.message,
      url:         err?.config?.url,
      requestBody: err?.config?.data,
    }, null, 2));
    throw e;
  }
};

export const getSellerDonations = (page = 1, limit = 10): Promise<{ donations: SellerDonation[]; pagination: { page: number; totalPages: number } }> =>
  api.get("/api/donations/me", { params: { page, limit } }).then((r) => {
    const payload = r.data.data ?? r.data;
    const donations = payload?.donations ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
    const pagination = payload?.pagination ?? { page, totalPages: 1 };
    return { donations, pagination };
  });
