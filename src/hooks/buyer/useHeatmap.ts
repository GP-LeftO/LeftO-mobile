import { useState, useEffect, useCallback } from 'react';
import { getHeatmap } from '../../services/buyer/stats.service';
import type { HeatSpot } from '../../services/buyer/stats.service';

export function useHeatmap() {
  const [spots,   setSpots]   = useState<HeatSpot[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getHeatmap();
      const payload = res.data?.data ?? (res.data as unknown as HeatSpot[]);
      setSpots(Array.isArray(payload) ? payload : []);
    } catch {
      // non-critical — map still works without heat layer
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { spots, loading };
}
