// favorites.service.ts — API calls for buyer Favorites (GET, POST, DELETE)

import api from "../shared/api";

import type { FavoriteSeller } from "../../features/favorites/types/favorites.types";

export async function fetchFavorites(): Promise<FavoriteSeller[]> {
  const { data } = await api.get("/api/favorites/me");
  const payload = data?.data ?? data;
  const items: Record<string, unknown>[] = Array.isArray(payload) ? payload : [];

  return items.map((item) => {
    // Backend returns { id, sellerId, notify, seller: { id, businessName, ... } }
    // Fall back to flat shape in case the backend ever returns seller fields directly.
    const s = (item.seller as Record<string, unknown> | undefined) ?? item;
    return {
      id:           (s.id           ?? item.sellerId ?? "") as string,
      businessName: (s.businessName ?? s.name        ?? "") as string,
      businessType: (s.businessType ?? s.type        ?? "") as string,
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
