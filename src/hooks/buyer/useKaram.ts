import { useState, useCallback } from 'react';
import {
  getKaramBalance, sponsorMeal,
  type KaramBalance, type KaramSponsorResult,
} from '../../services/buyer/karam.service';

interface UseKaramReturn {
  balance:    KaramBalance | null;
  loading:    boolean;
  sponsoring: boolean;
  error:      string | null;
  loadBalance: (sellerId: string) => Promise<void>;
  sponsor:     (sellerId: string, listingId?: string) => Promise<KaramSponsorResult | null>;
}

export function useKaram(): UseKaramReturn {
  const [balance,    setBalance]    = useState<KaramBalance | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [sponsoring, setSponsoring] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const loadBalance = useCallback(async (sellerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const bal = await getKaramBalance(sellerId);
      setBalance(bal);
    } catch {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const sponsor = useCallback(async (sellerId: string, listingId?: string): Promise<KaramSponsorResult | null> => {
    setSponsoring(true);
    try {
      const res = await sponsorMeal(sellerId, listingId);
      return res.data.data;
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      if (status === 400) setError('not_participating');
      else setError('sponsor_failed');
      return null;
    } finally {
      setSponsoring(false);
    }
  }, []);

  return { balance, loading, sponsoring, error, loadBalance, sponsor };
}
