import { useState, useCallback } from "react";
import {
  fetchPendingSellers, approveSeller, rejectSeller,
  fetchPendingCharities, approveCharity, rejectCharity,
} from "../../services/admin/admin.service";
import type { PendingSeller, PendingCharity } from "../../types/admin.types";

export function useAdminSellers() {
  const [sellers, setSellers]     = useState<PendingSeller[]>([]);
  const [loading, setLoading]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState("");
  const [actionId, setActionId]   = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setSellers(await fetchPendingSellers());
    } catch {
      setError("Could not load pending sellers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await approveSeller(id);
      setSellers(prev => prev.filter(s => s.id !== id));
    } finally {
      setActionId(null);
    }
  }, []);

  const reject = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await rejectSeller(id);
      setSellers(prev => prev.filter(s => s.id !== id));
    } finally {
      setActionId(null);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { sellers, loading, refreshing, error, actionId, load, approve, reject, refresh };
}

export function useAdminCharities() {
  const [charities, setCharities]   = useState<PendingCharity[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState("");
  const [actionId, setActionId]     = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      setCharities(await fetchPendingCharities());
    } catch {
      setError("Could not load pending charities.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const approve = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await approveCharity(id);
      setCharities(prev => prev.filter(c => c.id !== id));
    } finally {
      setActionId(null);
    }
  }, []);

  const reject = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await rejectCharity(id);
      setCharities(prev => prev.filter(c => c.id !== id));
    } finally {
      setActionId(null);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { charities, loading, refreshing, error, actionId, load, approve, reject, refresh };
}
