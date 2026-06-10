import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard } from '../../services/buyer/stats.service';
import type { Leaderboard } from '../../services/buyer/stats.service';

export function useLeaderboard() {
  const [data,    setData]    = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLeaderboard();
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
