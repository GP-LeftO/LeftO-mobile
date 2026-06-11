import { useState, useCallback, useRef } from "react";
import {
  fetchAdminUsers,
  fetchAdminUserDetail,
  unblockUser,
  deleteAdminUser,
} from "../../services/admin/admin.service";
import type { AdminUserListItem, AdminUserDetail, AdminUserFilters } from "../../types/admin.types";

export function useAdminUsers() {
  const [users, setUsers]             = useState<AdminUserListItem[]>([]);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [error, setError]             = useState("");
  const [filters, setFilters]         = useState<AdminUserFilters>({});
  const [actionId, setActionId]       = useState<string | null>(null);
  const filtersRef = useRef<AdminUserFilters>({});

  const load = useCallback(async (silent = false, overrideFilters?: AdminUserFilters) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const active = overrideFilters ?? filtersRef.current;
      const data = await fetchAdminUsers(1, 20, active);
      setUsers(data.users);
      setPage(1);
      setTotalPages(data.pagination.totalPages);
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await fetchAdminUsers(next, 20, filtersRef.current);
      setUsers(prev => [...prev, ...data.users]);
      setPage(next);
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const applyFilters = useCallback((next: AdminUserFilters) => {
    filtersRef.current = next;
    setFilters(next);
    load(false, next);
  }, [load]);

  const unblock = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await unblockUser(id);
      setUsers(prev =>
        prev.map(u => u.id === id ? { ...u, isBlocked: false, cancellationCount: 0 } : u)
      );
    } finally {
      setActionId(null);
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    setActionId(id);
    try {
      await deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally {
      setActionId(null);
    }
  }, []);

  return {
    users, loading, refreshing, loadingMore, error,
    filters, actionId,
    load, loadMore, refresh, applyFilters, unblock, remove,
  };
}

export function useAdminUserDetail(userId: string) {
  const [user, setUser]       = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUser(await fetchAdminUserDetail(userId));
    } catch {
      setError("Could not load user details.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { user, loading, error, load };
}
