import api from "../services/api";

export const getOrders = (status: string, params?: Record<string, string>) =>
  api.get("/api/orders/me", { params: { status, ...params } });

export const cancelOrder = (orderId: string) =>
  api.patch(`/api/orders/${orderId}/cancel`);

export const markOrderReceived = (orderId: string) =>
  api.patch(`/api/orders/${orderId}/received`);
