// favorites.types.ts — all TypeScript interfaces for the Favorites feature

import type { ListingType, ListingStatus, Listing, StoreDetailsParams } from "../../../types";

export interface FavoriteActiveListing {
  id: string;
  type: ListingType;
  status: ListingStatus;
  originalPrice: number;
  discountedPrice: number;
  pickupStart?: string;
  pickupEnd?: string;
  itemsLeft: number;
}

export interface FavoriteSeller {
  id: string;
  businessName: string;
  businessType: string;
  logoUrl?: string;
  distanceKm?: number;
  activeListing?: FavoriteActiveListing;
}

export interface FavoriteSellerCardProps {
  seller: FavoriteSeller;
  isNotificationOn: boolean;
  onRemove: (sellerId: string) => void;
  onToggleNotification: (sellerId: string) => void;
  onPress: (sellerId: string) => void;
}

export interface FavoritesScreenProps {
  onBrowse?: () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
}

export interface UseFavoritesReturn {
  favorites: FavoriteSeller[];
  favoriteListings: Listing[];
  isLoading: boolean;
  error: string | null;
  toastMessage: string | null;
  notificationMap: Record<string, boolean>;
  removeFavorite: (sellerId: string) => Promise<void>;
  toggleNotification: (sellerId: string) => void;
  refetch: () => void;
}
