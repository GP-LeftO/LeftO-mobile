import { uploadDocument as uploadDocumentService } from "../../services/shared/document.service";
import * as SellerService from "../../services/seller/seller.service";
import type { RegisterSellerParams } from "../../services/seller/seller.service";

export function useSeller() {
  const uploadDocument = async (
    uri: string,
    documentType: "trade_license" | "health_certificate" | "charity_registration",
    onUploadProgress?: (percent: number) => void
  ): Promise<string> => {
    return uploadDocumentService(uri, documentType, onUploadProgress);
  };

  const registerSeller = async (params: RegisterSellerParams) => {
    return SellerService.registerSeller(params);
  };

  return { uploadDocument, registerSeller };
}