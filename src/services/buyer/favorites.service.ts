// favorites.service.ts — API calls for buyer Favorites (GET, POST, DELETE)

import api from "../shared/api";

import type { FavoriteSeller } from "../../features/favorites/types/favorites.types";

export async function fetchFavorites(): Promise<FavoriteSeller[]> {
  const { data } = await api.get("/api/favorites/me");
  const payload = data?.data ?? data;
  const items: Record<string, unknown>[] = Array.isArray(payload) ? payload : [];

  // API returns [{ sellerId, seller: { businessName, rating, listings } }]
  // sellerId is at the ROOT of each item — not inside seller object
  return items.map((item) => {
    const s = (item.seller as Record<string, unknown> | undefined) ?? {};
    return {
      id:           (item.sellerId ?? "") as string,
      businessName: (s.businessName ?? s.name ?? "") as string,
      businessType: (s.businessType ?? s.type ?? "") as string,
      logoUrl:      s.logoUrl as string | undefined,
      distanceKm:   item.distanceKm as number | undefined,
      activeListing: (item.activeListing ?? s.activeListing) as FavoriteSeller["activeListing"],
    };
  });
}

export async function addFavorite(sellerId: string): Promise<void> {
  await api.post("/api/favorites", { sellerId });
}

export async function deleteFavorite(sellerId: string): Promise<void> {
  await api.delete(`/api/favorites/${sellerId}`);
}
