export interface Charity {
  id: string;
  orgName: string;
  description?: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  website?: string;
  logoUrl?: string;
  verifiedBadge?: boolean;
  rating?: number | null;
  createdAt?: string;
  _count?: { donations: number };
}
