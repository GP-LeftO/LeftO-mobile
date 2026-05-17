import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  fetchFavorites,
  addFavorite as apiAddFavorite,
  deleteFavorite as apiDeleteFavorite,
} from "../../services/buyer/favorites.service";
import { t } from "../../i18n";

import type { FavoriteSeller } from "../../features/favorites/types/favorites.types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoritesContextValue {
  /** Set of sellerIds — O(1) lookup, single source of truth for heart state. */
  favoritedSellerIds: Set<string>;
  /** Full seller objects for the Favorites screen. */
  favorites: FavoriteSeller[];
  isLoading: boolean;
  /** Non-null when there is a toast to display (error or success). */
  toastMessage: string | null;
  addFavorite: (sellerId: string) => Promise<void>;
  removeFavorite: (sellerId: string) => Promise<void>;
  /** O(1) lookup used by every ListingCard. */
  isFavorited: (sellerId: string) => boolean;
  refetch: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const TOAST_MS = 2500;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites]                   = useState<FavoriteSeller[]>([]);
  const [favoritedSellerIds, setFavoritedSellerIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]                   = useState(true);
  const [toastMessage, setToastMessage]             = useState<string | null>(null);

  const favoritesRef         = useRef<FavoriteSeller[]>([]);
  favoritesRef.current       = favorites;
  const favIdsRef            = useRef<Set<string>>(favoritedSellerIds);
  favIdsRef.current          = favoritedSellerIds;

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), TOAST_MS);
  }, []);

  const loadFavorites = useCallback(async () => {
    setIsLoading(true);
    try {
      const sellers = await fetchFavorites();
      setFavorites(sellers);
      setFavoritedSellerIds(new Set(sellers.map((s) => s.id)));
    } catch {
      // silently fail on load; cards just start unfavorited
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [loadFavorites]);

  const isFavorited = useCallback(
    (sellerId: string) => favIdsRef.current.has(sellerId),
    [],
  );

  const addFavorite = useCallback(async (sellerId: string) => {
    const snapshotIds  = new Set(favIdsRef.current);
    const snapshotList = [...favoritesRef.current];

    setFavoritedSellerIds((prev) => new Set(prev).add(sellerId));

    try {
      await apiAddFavorite(sellerId);
      await loadFavorites();
    } catch {
      setFavoritedSellerIds(snapshotIds);
      setFavorites(snapshotList);
      showToast(t().favorites.errorToast);
    }
  }, [loadFavorites, showToast]);

  const removeFavorite = useCallback(async (sellerId: string) => {
    const snapshotIds  = new Set(favIdsRef.current);
    const snapshotList = [...favoritesRef.current];

    setFavoritedSellerIds((prev) => {
      const next = new Set(prev);
      next.delete(sellerId);
      return next;
    });
    setFavorites((prev) => prev.filter((s) => s.id !== sellerId));

    try {
      await apiDeleteFavorite(sellerId);
      showToast(t().favorites.removedToast);
    } catch {
      setFavoritedSellerIds(snapshotIds);
      setFavorites(snapshotList);
      showToast(t().favorites.errorToast);
    }
  }, [showToast]);

  const value: FavoritesContextValue = {
    favoritedSellerIds,
    favorites,
    isLoading,
    toastMessage,
    addFavorite,
    removeFavorite,
    isFavorited,
    refetch: loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFavoritesContext(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavoritesContext must be used inside FavoritesProvider");
  }
  return ctx;
}
