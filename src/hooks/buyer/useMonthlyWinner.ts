import { useState, useEffect, useCallback } from 'react';
import { getMonthlyWinner } from '../../services/buyer/stats.service';
import type { MonthlyWinner } from '../../services/buyer/stats.service';

export function useMonthlyWinner() {
  const [winner,  setWinner]  = useState<MonthlyWinner | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMonthlyWinner();
      const data = res.data?.data ?? (res.data as unknown as { winner: MonthlyWinner | null });
      setWinner(data?.winner ?? null);
    } catch {
      // silent — banner just won't show
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { winner, loading, refresh: load };
}
