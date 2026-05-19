import api from "../../shared/api";
import type { CreateOrderPayload, Order } from "../../../types/order.types";

export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const res = await api.post("/api/orders", payload);
  return res.data?.data ?? res.data;
}
