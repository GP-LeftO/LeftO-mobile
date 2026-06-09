import api from "../shared/api";

export type ReportReason =
  | "SPOILED_FOOD"
  | "WRONG_DESCRIPTION"
  | "WRONG_PRICE"
  | "INAPPROPRIATE_CONTENT"
  | "OTHER";

export const reportListing = (listingId: string, reason: ReportReason, details?: string) =>
  api.post(`/api/reports/listings/${listingId}`, { reason, details });
