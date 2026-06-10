import api from '../shared/api';

export interface CharitySummary {
  id: string;
  orgName: string;
  description: string;
  region: string;
  address: string;
  verifiedBadge: boolean;
  rating: number;
  trustScore: number;
  totalDonations: number;
}

export interface CharityDetail extends CharitySummary {
  breakdown: {
    volume: number;
    proofRate: number;
    rating: number;
    responseSpeed: number;
  };
  confirmedCount: number;
  avgRating: number;
}

export const getCharities = () =>
  api.get<{ data: CharitySummary[] }>('/api/charities');

export const getCharityById = (id: string) =>
  api.get<{ data: CharityDetail }>(`/api/charities/${id}`);
