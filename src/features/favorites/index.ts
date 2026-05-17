// index.ts — barrel export for the Favorites feature

export { default as FavoritesScreen } from "./screens/FavoritesScreen";

export type {
  FavoriteSeller,
  FavoriteActiveListing,
  FavoriteSellerCardProps,
  FavoritesScreenProps,
  UseFavoritesReturn,
} from "./types/favorites.types";
