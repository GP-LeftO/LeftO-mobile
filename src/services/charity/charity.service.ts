import api from "../shared/api";

export interface CharityDonation {
  id: string;
  status: "PENDING" | "PICKED_UP" | "CONFIRMED";
  quantity: number;
  pickupStart?: string;
  pickupEnd?: string;
  createdAt: string;
  proofPhoto?: string;
  listing?: { id: string; title: string; photoUrl?: string };
  seller?: { id: string; businessName: string };
}

export const getCharityDonations = (page = 1, limit = 10): Promise<{ donations: CharityDonation[]; pagination: { page: number; totalPages: number; total: number } }> =>
  api.get("/api/donations/me", { params: { page, limit } }).then((r) => {
    const payload = r.data.data ?? r.data;
    const donations = payload?.donations ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
    const pagination = payload?.pagination ?? { page, totalPages: 1, total: donations.length };
    return { donations, pagination };
  });

export const markDonationPickedUp = (id: string): Promise<void> =>
  api.patch(`/api/donations/${id}/pickup`).then(() => undefined);

export const confirmDonation = (id: string, proofPhotoUrl?: string): Promise<void> =>
  api.patch(`/api/donations/${id}/confirm`, proofPhotoUrl ? { proofPhotoUrl } : {}).then(() => undefined);
