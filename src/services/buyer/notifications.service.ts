import api from "../shared/api";

export interface AppNotification {
  id: string;
  type: "ORDER_RESERVED" | "ORDER_CANCELLED" | "ORDER_RECEIVED" | "DONATION_RESERVED" | string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  data?: Record<string, string>;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
  pagination: { page: number; totalPages: number; total: number };
}

export const fetchNotifications = (page = 1, limit = 15): Promise<NotificationsResponse> =>
  api.get("/api/notifications/me", { params: { page, limit } }).then((r) => {
    const payload = r.data.data ?? r.data;
    return {
      notifications: payload?.notifications ?? payload?.data ?? (Array.isArray(payload) ? payload : []),
      unreadCount:   payload?.unreadCount ?? 0,
      pagination:    payload?.pagination  ?? { page, totalPages: 1, total: 0 },
    };
  });

export const markAllNotificationsRead = (): Promise<void> =>
  api.patch("/api/notifications/me/read-all").then(() => undefined);

export const saveFcmToken = (fcmToken: string | null): Promise<void> =>
  api.put("/api/auth/fcm-token", { fcmToken }).then(() => undefined);
