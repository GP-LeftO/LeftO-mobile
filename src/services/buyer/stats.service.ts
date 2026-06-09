import api from '../shared/api';

export interface LeaderboardBuyer {
  rank: number;
  id: string;
  name: string;
  co2SavedKg: number;
  badges: string[];
}

export interface LeaderboardSeller {
  rank: number;
  id: string;
  businessName: string;
  rating: number;
  mealsRescued: number;
  totalDonations: number;
}

export interface Leaderboard {
  buyers: LeaderboardBuyer[];
  sellers: LeaderboardSeller[];
}

export const getLeaderboard = () =>
  api.get<{ data: Leaderboard }>('/api/stats/leaderboard');

export interface HeatSpot {
  sellerId: string;
  businessName: string;
  lat: number;
  lng: number;
  activeListings: number;
  totalQuantity: number;
}

export const getHeatmap = () =>
  api.get<{ data: HeatSpot[] }>('/api/stats/heatmap');
