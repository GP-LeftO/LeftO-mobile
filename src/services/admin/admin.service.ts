import api from "../shared/api";
import type {
  PendingSeller,
  PendingCharity,
  AdminUserListItem,
  AdminUserDetail,
  AdminUsersPagination,
  AdminStats,
  AdminChartPoint,
  BestRatedData,
  AdminUserFilters,
} from "../../types/admin.types";

export async function fetchPendingSellers(): Promise<PendingSeller[]> {
  const res = await api.get("/api/admin/sellers/pending");
  return res.data.data;
}

export async function approveSeller(id: string): Promise<void> {
  await api.patch(`/api/admin/sellers/${id}/approve`);
}

export async function rejectSeller(id: string): Promise<void> {
  await api.patch(`/api/admin/sellers/${id}/reject`);
}

export async function fetchPendingCharities(): Promise<PendingCharity[]> {
  const res = await api.get("/api/admin/charities/pending");
  return res.data.data;
}

export async function approveCharity(id: string): Promise<void> {
  await api.patch(`/api/admin/charities/${id}/approve`);
}

export async function rejectCharity(id: string): Promise<void> {
  await api.patch(`/api/admin/charities/${id}/reject`);
}

export async function fetchAdminUsers(
  page = 1,
  limit = 20,
  filters?: AdminUserFilters,
): Promise<{ users: AdminUserListItem[]; pagination: AdminUsersPagination }> {
  const params: Record<string, unknown> = { page, limit };
  if (filters?.search)    params.search    = filters.search;
  if (filters?.role)      params.role      = filters.role;
  if (filters?.isBlocked !== undefined) params.isBlocked = filters.isBlocked;
  const res = await api.get("/api/admin/users", { params });
  return res.data.data;
}

export async function fetchAdminUserDetail(id: string): Promise<AdminUserDetail> {
  const res = await api.get(`/api/admin/users/${id}`);
  return res.data.data;
}

export async function unblockUser(id: string): Promise<void> {
  await api.patch(`/api/admin/users/${id}/unblock`);
}

export async function deleteAdminUser(id: string): Promise<void> {
  await api.delete(`/api/admin/users/${id}`);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await api.get("/api/admin/stats");
  return res.data.data;
}

export async function fetchAdminCharts(): Promise<AdminChartPoint[]> {
  const res = await api.get("/api/admin/stats/charts");
  return res.data.data.charts;
}

export async function fetchBestRated(): Promise<BestRatedData> {
  const res = await api.get("/api/admin/stats/best-rated");
  return res.data.data;
}
