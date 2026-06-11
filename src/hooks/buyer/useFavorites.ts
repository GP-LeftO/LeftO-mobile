import { useState, useCallback } from "react";

import { useFavoritesContext } from "../../context/shared/FavoritesContext";
import { useAuthContext } from "../../context/AuthContext";
import type { FavoriteListing } from "../../services/buyer/favorites.service";

export function useFavorites() {
  const { user } = useAuthContext();
  const {
    favorites,
    favoritedListingIds,
    isLoading,
    addFavorite,
    removeFavorite,
    refetch,
  } = useFavoritesContext();

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await refetch();
    } catch {
      setError("تعذّر تحميل المفضلة");
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const toggleFavorite = useCallback(
    async (listingId: string) => {
      if (favoritedListingIds.has(listingId)) {
        await removeFavorite(listingId);
      } else {
        await addFavorite(listingId);
      }
    },
    [favoritedListingIds, addFavorite, removeFavorite],
  );

  if (user?.role !== "BUYER") {
    return {
      favorites:     [] as FavoriteListing[],
      favoritedIds:  new Set<string>(),
      loading:       false,
      refreshing:    false,
      error:         null as string | null,
      loadFavorites: async () => {},
      refresh:       async () => {},
      toggleFavorite: async (_listingId: string) => {},
    };
  }

  return {
    favorites,
    favoritedIds:  favoritedListingIds,
    loading:       isLoading,
    refreshing,
    error,
    loadFavorites: refetch,
    refresh,
    toggleFavorite,
  };
}
