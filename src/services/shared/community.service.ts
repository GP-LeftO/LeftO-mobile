import api from "./api";
import type { Listing } from "../../types";

export interface AppConfig {
  isRamadanSeason: boolean;
  maghribTime?: string | null;
  isIftarWindow?: boolean;
}

// ─── Karam Program (replaces SUSPENDED_MEAL) ─────────────────────────────────

export interface KaramSeller {
  sellerId: string;
  businessName: string;
  today: { sponsored: number; claimed: number; available: number };
}

export interface KaramBalance {
  sellerId: string;
  participatesInKaram: boolean;
  today: { sponsored: number; claimed: number; available: number };
}

export function fetchAppConfig(): Promise<AppConfig> {
  return api.get("/api/app/config").then((r) => {
    const payload = r.data?.data ?? r.data;
    return {
      isRamadanSeason: payload?.isRamadanSeason ?? false,
      maghribTime:     payload?.maghribTime ?? null,
      isIftarWindow:   payload?.isIftarWindow ?? false,
    };
  });
}

// GET /api/sellers/karam — public, all Karam sellers with today's balance
export function fetchKaramSellers(): Promise<KaramSeller[]> {
  return api.get("/api/sellers/karam").then((r) => {
    const payload = r.data?.data ?? r.data;
    return (Array.isArray(payload) ? payload : []) as KaramSeller[];
  });
}

// POST /api/sellers/:id/karam/sponsor — buyer sponsors one Karam meal from a seller
export function sponsorKaramMeal(sellerId: string): Promise<KaramBalance["today"]> {
  return api.post(`/api/sellers/${sellerId}/karam/sponsor`).then((r) => r.data?.data ?? r.data);
}

// GET /api/sellers/:id/karam — public, single seller Karam balance
export function fetchSellerKaramBalance(sellerId: string): Promise<KaramBalance> {
  return api.get(`/api/sellers/${sellerId}/karam`).then((r) => r.data?.data ?? r.data);
}

// ─── Monthly winner banner ───────────────────────────────────────────────────

export interface MonthlyWinner {
  sellerId: string;
  name: string;
  rating: number;
  month: string;
}

export function fetchMonthlyWinner(): Promise<MonthlyWinner | null> {
  return api.get("/api/stats/monthly-winner").then((r) => {
    const payload = r.data?.data ?? r.data;
    return payload?.winner ?? null;
  }).catch(() => null);
}

// ─── Recommended listings (rescue score + badges) ────────────────────────────

export function fetchRecommendedListings(lat?: number, lng?: number): Promise<Listing[]> {
  return api.get("/api/listings/recommended", { params: { lat, lng } }).then((r) => {
    const payload = r.data?.data ?? r.data;
    return (Array.isArray(payload?.listings) ? payload.listings : []) as Listing[];
  }).catch(() => []);
}

// ─── Regular listing claim (buyer orders) ────────────────────────────────────

export function claimCommunityListing(listingId: string) {
  return api.post("/api/orders", { listingId, type: "PURCHASE", quantity: 1 }).then((r) => r.data?.data ?? r.data);
}
