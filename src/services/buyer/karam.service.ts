import api from '../shared/api';

export interface KaramBalance {
  sponsored: number;
  claimed:   number;
  available: number;
}

export interface KaramSponsorResult {
  clientSecret: string;
  amountNIS:    number;
  sellerName:   string;
}

export const getKaramBalance = (sellerId: string) =>
  api.get<{ data: KaramBalance }>(`/api/sellers/${sellerId}/karam`);

export const sponsorMeal = (sellerId: string) =>
  api.post<{ data: KaramSponsorResult }>(`/api/sellers/${sellerId}/karam/sponsor`);
