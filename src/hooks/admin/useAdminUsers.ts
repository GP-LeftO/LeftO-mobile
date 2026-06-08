import { useState, useCallback } from "react";
import { fetchAdminUsers, fetchAdminUserDetail } from "../../services/admin/admin.service";
import type { AdminUserListItem, AdminUserDetail } from "../../types/admin.types";

export function useAdminUsers() {
  const [users, setUsers]           = useState<AdminUserListItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError]           = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const data = await fetchAdminUsers(1, 20);
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
      const data = await fetchAdminUsers(next, 20);
      setUsers(prev => [...prev, ...data.users]);
      setPage(next);
    } catch {
      // silently ignore — user can pull-to-refresh
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, page, totalPages]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  return { users, loading, refreshing, loadingMore, error, load, loadMore, refresh };
}

export function useAdminUserDetail(userId: string) {
  const [user, setUser]     = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

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
