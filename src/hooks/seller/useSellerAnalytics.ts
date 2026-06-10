import { useState, useEffect, useCallback } from 'react';
import { getMyAnalytics, type SellerAnalytics } from '../../services/seller/analytics.service';

export function useSellerAnalytics() {
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyAnalytics();
      setData(res.data.data);
    } catch {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refresh: load };
}
