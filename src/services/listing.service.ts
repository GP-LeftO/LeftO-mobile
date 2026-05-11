/**
 * listing.service.ts
 * API calls for individual listing and seller detail endpoints.
 */

import api from "../services/api";
import type { ListingDetail, SellerDetail } from "../types";

export const getListingById = (id: string): Promise<ListingDetail> =>
  api.get(`/api/listings/${id}`).then((r) => r.data.data ?? r.data);

export const getSellerById = (id: string): Promise<SellerDetail> =>
  api.get(`/api/sellers/${id}`).then((r) => r.data.data ?? r.data);
