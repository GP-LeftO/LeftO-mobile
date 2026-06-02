import { useState, useCallback } from "react";
import { fetchNotifications, markAllNotificationsRead } from "../../services/buyer/notifications.service";
import type { AppNotification } from "../../services/buyer/notifications.service";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [error,         setError]         = useState("");
  const [page,          setPage]          = useState(1);
  const [hasMore,       setHasMore]       = useState(true);

  const fetch = useCallback(async (reset = false) => {
    const nextPage = reset ? 1 : page;
    if (reset) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const { notifications: items, unreadCount: count, pagination } = await fetchNotifications(nextPage, 15);
      setNotifications(prev => reset ? items : [...prev, ...items]);
      setUnreadCount(count);
      setPage(nextPage + 1);
      setHasMore(nextPage < pagination.totalPages);
    } catch {
      setError("Could not load notifications");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return { notifications, unreadCount, loading, refreshing, error, hasMore, fetch, markAllRead };
}
