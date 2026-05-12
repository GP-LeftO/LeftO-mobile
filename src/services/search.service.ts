/**
 * search.service.ts
 * API call for listing search endpoint.
 * Follows the same pattern as all other services in this folder.
 */

import api from "../services/api";
import type { Listing } from "../types";

export interface SearchParams {
  q?:         string;
  lat?:       number;
  lng?:       number;
  radiusKm?:  number;
  radius?:    number;
  category?:  string;   // backend expects UPPERCASE enum: MEALS | BREAD_AND_PASTRIES | GROCERIES | MIXED
  freshness?: string[];
  minPrice?:  number;
  maxPrice?:  number;
  sortBy?:    string;
  page?:      number;
  limit?:     number;
}

export interface SearchResult {
  listings:   Listing[];
  pagination: {
    page:       number;
    limit:      number;
    total:      number;
    totalPages: number;
  };
}

export const searchListings = async (params: SearchParams): Promise<SearchResult> => {
  const { data } = await api.get("/api/listings/search", { params });
  const payload = data?.data ?? data;
  const listings: Listing[] = Array.isArray(payload?.listings)
    ? payload.listings
    : Array.isArray(payload) ? payload : [];
  const pagination = payload?.pagination ?? { page: 1, limit: 10, total: listings.length, totalPages: 1 };
  return { listings, pagination };
};
