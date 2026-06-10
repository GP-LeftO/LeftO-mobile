import api from "./api";

export type NotificationType =
  | "ORDER_RESERVED"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED"
  | "DONATION_RECEIVED"
  | "DONATION_CONFIRMED"
  | "SELLER_APPROVED"
  | "SELLER_REJECTED"
  | "CHARITY_APPROVED"
  | "NEW_LISTING_FROM_FAVORITE"
  | "LISTING_EXPIRING_SOON"
  | "WASTE_PATTERN_ALERT"
  | "DEAL_WINDOW_TIP"
  | "ACCOUNT_BLOCKED"
  | "LISTING_REPORTED"
  | "LISTING_REMOVED"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface NotificationsResult {
  notifications: AppNotification[];
  unreadCount: number;
}

export function fetchNotifications(): Promise<NotificationsResult> {
  return api.get("/api/notifications/me").then((r) => {
    // API returns { data: { notifications: [...], unreadCount: N, pagination: {...} } }
    const payload = r.data?.data ?? r.data;
    const notifications = Array.isArray(payload)
      ? payload
      : (payload?.notifications ?? payload?.items ?? []) as AppNotification[];
    const unreadCount = typeof payload?.unreadCount === "number"
      ? payload.unreadCount
      : notifications.filter((n: AppNotification) => !n.isRead).length;
    return { notifications, unreadCount };
  });
}

export function markAllRead(): Promise<void> {
  return api.patch("/api/notifications/me/read-all").then(() => undefined);
}

export function markOneRead(id: string): Promise<void> {
  return api.patch(`/api/notifications/${id}/read`).then(() => undefined);
}
