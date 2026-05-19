import { useState, useEffect, useCallback } from "react";
import { getCharities } from "../../../services/buyer/reserve/donationService";
import type { Charity } from "../../../types/charity.types";

interface UseCharitiesResult {
  charities: Charity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCharities(): UseCharitiesResult {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCharities();
      setCharities(data);
    } catch {
      setError("Could not load charities. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharities();
  }, [fetchCharities]);

  return { charities, loading, error, refetch: fetchCharities };
}
