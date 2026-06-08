import api from "../shared/api";
import type {
  PendingSeller,
  PendingCharity,
  AdminUserListItem,
  AdminUserDetail,
  AdminUsersPagination,
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
  limit = 20
): Promise<{ users: AdminUserListItem[]; pagination: AdminUsersPagination }> {
  const res = await api.get("/api/admin/users", { params: { page, limit } });
  return res.data.data;
}

export async function fetchAdminUserDetail(id: string): Promise<AdminUserDetail> {
  const res = await api.get(`/api/admin/users/${id}`);
  return res.data.data;
}
