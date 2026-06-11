import { useState, useCallback } from "react";
import { fetchAdminStats, fetchAdminCharts, fetchBestRated } from "../../services/admin/admin.service";
import type { AdminStats, AdminChartPoint, BestRatedData } from "../../types/admin.types";

export function useAdminStats() {
  const [stats, setStats]         = useState<AdminStats | null>(null);
  const [charts, setCharts]       = useState<AdminChartPoint[]>([]);
  const [bestRated, setBestRated] = useState<BestRatedData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, c, b] = await Promise.all([
        fetchAdminStats(),
        fetchAdminCharts(),
        fetchBestRated(),
      ]);
      setStats(s);
      setCharts(c);
      setBestRated(b);
    } catch {
      setError("Could not load stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { stats, charts, bestRated, loading, error, load };
}
