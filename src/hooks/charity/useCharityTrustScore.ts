import { useState, useEffect, useCallback } from 'react';
import { getMyCharityProfile } from '../../services/charity/charity.service';
import { getCharityTrustScore } from '../../services/buyer/stats.service';
import type { CharityTrustScore } from '../../services/buyer/stats.service';

export function useCharityTrustScore() {
  const [trust,   setTrust]   = useState<CharityTrustScore | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await getMyCharityProfile();
      const res     = await getCharityTrustScore(profile.id);
      const data    = res.data?.data ?? (res.data as unknown as CharityTrustScore);
      setTrust(data);
    } catch {
      // silent — card simply won't render
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { trust, loading, refresh: load };
}
