import { useState, useEffect, useCallback } from 'react';
import {
  getCharities, getCharityById,
  type CharitySummary, type CharityDetail,
} from '../../services/buyer/charity.service';

export function useCharities() {
  const [charities, setCharities] = useState<CharitySummary[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCharities();
      setCharities(res.data.data ?? []);
    } catch {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { charities, loading, error, refresh: load };
}

export function useCharityDetail(id: string | null) {
  const [detail,  setDetail]  = useState<CharityDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getCharityById(id)
      .then(res => setDetail(res.data.data))
      .catch(() => setError('load_failed'))
      .finally(() => setLoading(false));
  }, [id]);

  return { detail, loading, error };
}
