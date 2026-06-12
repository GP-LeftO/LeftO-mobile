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

export const getKaramBalance = (sellerId: string): Promise<KaramBalance> =>
  api.get(`/api/sellers/${sellerId}/karam`).then(r => (r.data?.data ?? r.data) as KaramBalance);

export const sponsorMeal = (sellerId: string, listingId?: string) =>
  api.post<{ data: KaramSponsorResult }>(`/api/sellers/${sellerId}/karam/sponsor`, listingId ? { listingId } : undefined);

export interface KaramQrResult {
  qrCodeUrl: string;
  qrToken:   string;
}

export const requestKaramQr = async (sellerId: string): Promise<KaramQrResult> => {
  const r = await api.post(`/api/sellers/${sellerId}/karam/request-qr`);
  return r.data?.data ?? r.data;
};
