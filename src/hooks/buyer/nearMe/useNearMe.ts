import { useState, useCallback } from 'react';
import * as nearMeService from '../../../services/buyer/nearMe/nearMeService';
import type { NearMeMessage, NearMeCoords, NearMeListing } from '../../../types/nearMe';

const ERROR_TEXT = 'عذراً، حدث خطأ في البحث. تأكد من اتصالك بالإنترنت وحاول مجدداً 🙏';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildFallbackReply(count: number): string {
  if (count === 0) return 'ما لقينا محلات قريبة منك هلأ 🗺️ جرب توسيع نطاق البحث أو ارجع بعدين.';
  return `وجدنا ${count} عروض قريبة منك الآن! 🎉 إليك أفضل الخيارات:`;
}

export function useNearMe(coords: NearMeCoords) {
  const [messages, setMessages] = useState<NearMeMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const isLoadingRef = { current: false };

  const appendUserMessage = (text: string) => {
    const msg: NearMeMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, msg]);
  };

  const appendAiMessage = (text: string, listings: NearMeListing[]) => {
    const msg: NearMeMessage = {
      id: `ai-${Date.now()}`,
      role: 'ai',
      text,
      timestamp: new Date(),
      listings,
    };
    setMessages(prev => [...prev, msg]);
  };

  const sendNearMeQuery = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoadingRef.current) return;

      isLoadingRef.current = true;
      appendUserMessage(trimmed);
      setInputText('');
      setIsLoading(true);

      try {
        const [listings, reply] = await Promise.all([
          nearMeService.getNearbyListings({ coords, radius: 10, limit: 8 }),
          nearMeService.getChatbotNearMeReply(trimmed, coords),
        ]);

        const withDistance = listings.map(l => ({
          ...l,
          distanceKm: haversineKm(
            coords.latitude, coords.longitude,
            l.seller.latitude, l.seller.longitude,
          ),
        }));
        withDistance.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

        appendAiMessage(reply || buildFallbackReply(withDistance.length), withDistance);
      } catch {
        appendAiMessage(ERROR_TEXT, []);
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [coords],
  );

  return {
    messages,
    isLoading,
    inputText,
    setInputText,
    sendNearMeQuery,
  };
}
