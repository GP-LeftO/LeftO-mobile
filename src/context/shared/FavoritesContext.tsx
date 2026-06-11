import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuthContext } from "../AuthContext";
import { favoritesService, type FavoriteListing } from "../../services/buyer/favorites.service";
import { t } from "../../i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FavoritesContextValue {
  /** Set of listingIds — O(1) lookup, single source of truth for heart state. */
  favoritedListingIds: Set<string>;
  /** Full favorite objects for the Favorites screen. */
  favorites: FavoriteListing[];
  isLoading: boolean;
  /** Non-null when there is a toast to display. */
  toastMessage: string | null;
  addFavorite: (listingId: string) => Promise<void>;
  removeFavorite: (listingId: string) => Promise<void>;
  /** O(1) lookup used by every ListingCard. */
  isFavorited: (listingId: string) => boolean;
  refetch: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const TOAST_MS = 2500;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const isBuyer = user?.role === "BUYER";

  const [favorites, setFavorites]                     = useState<FavoriteListing[]>([]);
  const [favoritedListingIds, setFavoritedListingIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading]                     = useState(false);
  const [toastMessage, setToastMessage]               = useState<string | null>(null);

  const favoritesRef   = useRef<FavoriteListing[]>([]);
  favoritesRef.current = favorites;
  const favIdsRef      = useRef<Set<string>>(favoritedListingIds);
  favIdsRef.current    = favoritedListingIds;

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastTimer.current = setTimeout(() => setToastMessage(null), TOAST_MS);
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!isBuyer) return;
    setIsLoading(true);
    try {
      const data = await favoritesService.getMyFavorites();
      setFavorites(data);
      setFavoritedListingIds(new Set(data.map((f) => f.listingId)));
    } catch {
      // silently fail; heart icons start unfavorited
    } finally {
      setIsLoading(false);
    }
  }, [isBuyer]);

  useEffect(() => {
    loadFavorites();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [loadFavorites]);

  const isFavorited = useCallback(
    (listingId: string) => favIdsRef.current.has(listingId),
    [],
  );

  const addFavorite = useCallback(async (listingId: string) => {
    const snapshotIds  = new Set(favIdsRef.current);
    const snapshotList = [...favoritesRef.current];

    setFavoritedListingIds((prev) => new Set(prev).add(listingId));

    try {
      await favoritesService.addFavorite(listingId);
      showToast(t().favorites.addedToast);
      await loadFavorites();
    } catch {
      setFavoritedListingIds(snapshotIds);
      setFavorites(snapshotList);
      showToast(t().favorites.errorToast);
    }
  }, [loadFavorites, showToast]);

  const removeFavorite = useCallback(async (listingId: string) => {
    const snapshotIds  = new Set(favIdsRef.current);
    const snapshotList = [...favoritesRef.current];

    setFavoritedListingIds((prev) => {
      const next = new Set(prev);
      next.delete(listingId);
      return next;
    });
    setFavorites((prev) => prev.filter((f) => f.listingId !== listingId));

    try {
      await favoritesService.removeFavorite(listingId);
      showToast(t().favorites.removedToast);
    } catch {
      setFavoritedListingIds(snapshotIds);
      setFavorites(snapshotList);
      showToast(t().favorites.errorToast);
    }
  }, [showToast]);

  const value: FavoritesContextValue = {
    favoritedListingIds,
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
