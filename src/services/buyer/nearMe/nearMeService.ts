import api from '../../shared/api';
import type { NearMeListing, NearMeListingsResponse, NearMeQueryParams } from '../../../types/nearMe';

export async function getNearbyListings(params: NearMeQueryParams): Promise<NearMeListing[]> {
  const { coords, radius = 10, category, limit = 8 } = params;

  const queryParams: Record<string, string | number> = {
    latitude: coords.latitude,
    longitude: coords.longitude,
    radius,
    status: 'ACTIVE',
    limit,
  };

  if (category) queryParams.category = category;

  const res = await api.get<NearMeListingsResponse>('/api/listings', { params: queryParams });

  // Handle both wrapped { data: { listings } } and unwrapped { listings } shapes
  const data = res.data?.data ?? res.data as { listings?: NearMeListing[] };
  return (data as { listings?: NearMeListing[] })?.listings ?? [];
}

export async function getChatbotNearMeReply(
  message: string,
  coords: { latitude: number; longitude: number },
): Promise<string> {
  const res = await api.post('/api/chatbot/message', {
    message,
    lat: coords.latitude,
    lng: coords.longitude,
  });
  return ((res.data?.data ?? res.data) as { reply?: string })?.reply ?? '';
}
