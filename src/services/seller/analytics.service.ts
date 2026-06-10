import api from '../shared/api';

export interface PeakHour {
  hour: number;
  count: number;
}

export interface SellerAnalytics {
  totalListings: number;
  activeListings: number;
  totalItemsSold: number;
  totalRevenue: number;
  co2SavedKg: number;
  sellThroughRate: number;
  peakHours: PeakHour[];
  topListing: { id: string; title: string; unitsSold: number } | null;
}

export const getMyAnalytics = () =>
  api.get<{ data: SellerAnalytics }>('/api/stats/my-analytics');
