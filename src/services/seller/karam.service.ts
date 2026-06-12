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

export const toggleParticipation = (enable: boolean): Promise<KaramBalance> =>
  api.patch('/api/sellers/me/karam', { participatesInKaram: enable }).then((r) => r.data?.data ?? r.data);

export const sponsorMeal = async (): Promise<KaramTodayBalance> => {
  const r = await api.post('/api/sellers/me/karam/sponsor');
  const d = r.data?.data ?? r.data;
  return { sponsored: d?.sponsored ?? 0, claimed: d?.claimed ?? 0, available: d?.available ?? 0 };
};

export const scanKaramQr = async (qrToken: string): Promise<KaramTodayBalance> => {
  const r = await api.post('/api/sellers/me/karam/scan-qr', { qrToken });
  const d = r.data?.data ?? r.data;
  return { sponsored: d?.sponsored ?? 0, claimed: d?.claimed ?? 0, available: d?.available ?? 0 };
};
