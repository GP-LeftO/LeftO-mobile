export interface AdminDocument {
  id: string;
  documentType: "TRADE_LICENSE" | "HEALTH_CERTIFICATE" | "CHARITY_REGISTRATION";
  fileUrl: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
}

export interface AdminUserSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  documents: AdminDocument[];
}

export interface PendingSeller {
  id: string;
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY";
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  status: "PENDING";
  createdAt: string;
  user: AdminUserSummary;
}

export interface PendingCharity {
  id: string;
  orgName: string;
  description: string | null;
  region: string;
  status: "PENDING";
  createdAt: string;
  user: AdminUserSummary;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "BUYER" | "SELLER" | "CHARITY" | "ADMIN";
  createdAt: string;
  isBlocked?: boolean;
  cancellationCount?: number;
  deletedAt?: string | null;
}

export interface AdminUserDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "BUYER" | "SELLER" | "CHARITY" | "ADMIN";
  language: "AR" | "EN";
  createdAt: string;
  deletedAt: string | null;
  seller: {
    id: string;
    businessName: string;
    businessType: "RESTAURANT" | "MARKET" | "BAKERY";
    status: "PENDING" | "APPROVED" | "REJECTED";
    verifiedBadge: boolean;
  } | null;
  charity: {
    id: string;
    orgName: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    verifiedBadge: boolean;
  } | null;
  documents: AdminDocument[];
}

export interface AdminUsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminStats {
  users: { total: number; buyers: number; sellers: number; charities: number };
  listings: { active: number; soldOut: number; expired: number };
  orders: { total: number; completed: number; cancelled: number };
  donations: { total: number; confirmed: number };
  impact: { totalCo2SavedKg: number; totalItemsSaved: number };
}

export interface AdminChartPoint {
  month: string;
  completedOrders: number;
  listingsCreated: number;
  newUsers: number;
}

export interface BestRatedData {
  bestSeller: { id: string; businessName: string; rating: number; address: string } | null;
  bestCharity: { id: string; orgName: string; region: string; _count: { donations: number } } | null;
}

export interface AdminUserFilters {
  search?: string;
  role?: "BUYER" | "SELLER" | "CHARITY" | "ADMIN" | "";
  isBlocked?: boolean | undefined;
}
