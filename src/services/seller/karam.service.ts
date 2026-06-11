import api from '../shared/api';

export interface KaramTodayBalance {
  sponsored: number;
  claimed: number;
  available: number;
}

export interface KaramBalance {
  sellerId: string;
  participatesInKaram: boolean;
  today: KaramTodayBalance;
}

export const getKaramBalance = (sellerId: string): Promise<KaramBalance> =>
  api.get(`/api/sellers/${sellerId}/karam`).then((r) => r.data?.data ?? r.data);

export const toggleParticipation = (participatesInKaram: boolean): Promise<KaramBalance> =>
  api.patch('/api/sellers/me/karam', { participatesInKaram }).then((r) => r.data?.data ?? r.data);

export const sponsorMeal = (): Promise<unknown> =>
  api.post('/api/sellers/me/karam/sponsor').then((r) => r.data?.data ?? r.data);

export const claimMeal = (): Promise<unknown> =>
  api.post('/api/sellers/me/karam/claim').then((r) => r.data?.data ?? r.data);
