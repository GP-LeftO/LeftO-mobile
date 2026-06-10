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

// ─── Basket (food needs) ────────────────────────────────────────────────────

export type BasketCategory = "MEALS" | "BREAD_AND_PASTRIES" | "GROCERIES" | "MIXED";

export interface CharitySummary {
  id: string;
  name: string;
  region?: string;
  basket: BasketCategory[];
}

export function getMyBasket(): Promise<BasketCategory[]> {
  return api.get("/api/charities/me/basket").then(r => {
    const d = r.data?.data ?? r.data;
    return d?.categories ?? [];
  });
}

export function setMyBasket(categories: BasketCategory[]): Promise<void> {
  return api.put("/api/charities/me/basket", { categories }).then(() => undefined);
}

export function getCharityBasket(charityId: string): Promise<BasketCategory[]> {
  return api.get(`/api/charities/${charityId}/basket`).then(r => {
    const d = r.data?.data ?? r.data;
    return d?.categories ?? [];
  });
}

export function getApprovedCharities(): Promise<CharitySummary[]> {
  return api.get("/api/charities").then(async r => {
    const payload = r.data?.data ?? r.data;
    const arr: {id: string; name?: string; orgName?: string; region?: string}[] =
      Array.isArray(payload) ? payload : payload?.charities ?? payload?.items ?? [];
    const results = await Promise.allSettled(
      arr.map(c => getCharityBasket(c.id).then(basket => ({
        id: c.id,
        name: c.name ?? c.orgName ?? "Charity",
        region: c.region,
        basket,
      })))
    );
    return results
      .filter(r => r.status === "fulfilled")
      .map(r => (r as PromiseFulfilledResult<CharitySummary>).value);
  });
}
