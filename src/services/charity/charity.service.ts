import api from "../shared/api";
import * as ImagePicker from "expo-image-picker";

// Covers both Order statuses (from buyer donation orders) and Donation model statuses
export type DonationStatus =
  | "PENDING"    // Donation model
  | "CONFIRMED"  // Donation model
  | "PICKED_UP"  // Donation model
  | "RESERVED"   // Order model — buyer just donated, not yet picked up
  | "COMPLETED"  // Order model — picked up
  | "CANCELLED"; // both

export interface CharityDonation {
  id: string;
  status: DonationStatus;
  quantity: number;
  totalPrice?: number;
  type?: "PURCHASE" | "DONATION";
  createdAt: string;
  listing?: {
    id?: string;
    title?: string;
    pickupStart?: string;
    pickupEnd?: string;
    seller?: { id?: string; businessName?: string };
  };
  seller?: { businessName?: string };
  buyer?: { id?: string; name?: string };
  confirmedAt?: string;
  pickedUpAt?: string;
  proofUrl?: string;
}

export function fetchCharityDonations(): Promise<CharityDonation[]> {
  return api
    .get("/api/donations/me")
    .then((r) => {
      // API returns { data: { donations: [...], pagination: {...} } }
      const payload = r.data?.data ?? r.data;
      const arr = Array.isArray(payload)
        ? payload
        : (payload?.donations ?? payload?.orders ?? payload?.items ?? []);
      return arr as CharityDonation[];
    });
}

export function confirmDonationPickup(donationId: string): Promise<void> {
  return api.patch(`/api/donations/${donationId}/pickup`).then(() => undefined);
}

// Step 1: upload the photo to /api/documents/upload, get URL back
async function uploadProofPhoto(localUri: string): Promise<string> {
  const form = new FormData();
  const filename = localUri.split("/").pop() ?? "proof.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  form.append("file", { uri: localUri, name: filename, type: mime } as unknown as Blob);
  form.append("documentType", "CHARITY_REGISTRATION"); // closest available type
  const { data } = await api.post("/api/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const payload = data?.data ?? data;
  return payload.fileUrl as string;
}

// Step 2: confirm the donation with the uploaded URL
// API: PATCH /api/donations/:id/confirm  body: { proofPhotoUrl?: "url" }
export async function confirmDonationWithProof(donationId: string, proofUri: string): Promise<void> {
  const proofPhotoUrl = await uploadProofPhoto(proofUri);
  await api.patch(`/api/donations/${donationId}/confirm`, { proofPhotoUrl });
}

// Confirm without proof (just pickup confirmation)
export function confirmDonationOnly(donationId: string): Promise<void> {
  return api.patch(`/api/donations/${donationId}/confirm`, {}).then(() => undefined);
}
