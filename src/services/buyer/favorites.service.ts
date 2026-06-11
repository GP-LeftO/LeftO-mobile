import api from '../shared/api';

export interface FavoriteListing {
  id: string;
  listingId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    type: string;
    status: string;
    freshnessBadge: string | null;
    originalPrice: number;
    discountedPrice: number;
    quantity: number;
    pickupStart: string;
    pickupEnd: string;
    allergenNote: string | null;
    photoUrl: string | null;
    seller: {
      id: string;
      businessName: string;
      businessType: string;
      location: {
        address: string | null;
        latitude: number;
        longitude: number;
      };
    };
  } | null;
}

export const favoritesService = {
  getMyFavorites: (): Promise<FavoriteListing[]> =>
    api.get('/api/favorites/me').then(r => r.data.data ?? r.data),

  addFavorite: (listingId: string): Promise<void> =>
    api.post('/api/favorites', { listingId }).then(r => r.data),

  removeFavorite: (listingId: string): Promise<void> =>
    api.delete(`/api/favorites/${listingId}`).then(r => r.data),
};
