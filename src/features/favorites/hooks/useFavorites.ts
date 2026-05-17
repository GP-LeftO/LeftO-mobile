// useFavorites — ViewModel for the Favorites screen.
// Favorites state (add/remove/isFavorited) lives in FavoritesContext.
// This hook derives the listing-level view data and manages notification toggles.

import { useState, useEffect, useCallback, useRef } from "react";

import api from "../../../services/shared/api";
import { useFavoritesContext } from "../../../context/shared/FavoritesContext";

import type { FavoriteSeller, UseFavoritesReturn } from "../types/favorites.types";
import type { Listing } from "../../../types";

export function useFavorites(): UseFavoritesReturn {
  const {
    favorites,
    isLoading,
    toastMessage,
    removeFavorite,
    refetch,
  } = useFavoritesContext();

  const [favoriteListings, setFavoriteListings] = useState<Listing[]>([]);
  const [listingsLoading, setListingsLoading]   = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [notificationMap, setNotificationMap]   = useState<Record<string, boolean>>({});

  const favoritesRef     = useRef<FavoriteSeller[]>([]);
  favoritesRef.current   = favorites;

  const fetchListings = useCallback(async () => {
    if (favoritesRef.current.length === 0) {
      setFavoriteListings([]);
      return;
    }
    setListingsLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/api/listings");
      const payload  = data?.data ?? data;
      const all: Listing[] = Array.isArray(payload)
        ? payload
        : (payload?.listings ?? payload?.items ?? []);
      const sellerIds = new Set(favoritesRef.current.map((s) => s.id));
      setFavoriteListings(all.filter((l) => sellerIds.has(l.seller.id)));
    } catch {
      setError("error");
    } finally {
      setListingsLoading(false);
    }
  }, []);

  // Re-derive listings whenever the favorites list changes (add or remove).
  const favoritesKey = favorites.map((f) => f.id).sort().join(",");
  useEffect(() => {
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchListings, favoritesKey]);

  const toggleNotification = useCallback((sellerId: string) => {
    setNotificationMap((curr) => ({
      ...curr,
      [sellerId]: !curr[sellerId],
    }));
  }, []);

  return {
    favorites,
    favoriteListings,
    isLoading: isLoading || listingsLoading,
    error,
    toastMessage,
    notificationMap,
    removeFavorite,
    toggleNotification,
    refetch,
  };
}
