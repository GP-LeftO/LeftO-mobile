/**
 * search.service.ts
 * API call for listing search endpoint.
 * Follows the same pattern as all other services in this folder.
 */

import api from "../shared/api";
import type { Listing } from "../../types";

export interface SearchParams {
  q?:               string;
  lat?:             number;
  lng?:             number;
  radiusKm?:        number;
  radius?:          number;
  category?:        string;          // MEALS | BREAD_AND_PASTRIES | GROCERIES | MIXED
  freshnessBadge?:  string;          // eat_today | fresh_tonight | good_1_2_days
  excludeAllergens?: string;         // comma-separated, e.g. "nuts,gluten"
  minPrice?:        number;
  maxPrice?:        number;
  sortBy?:          string;          // distance | price | rating | freshness
  page?:            number;
  limit?:           number;
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
