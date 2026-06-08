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
