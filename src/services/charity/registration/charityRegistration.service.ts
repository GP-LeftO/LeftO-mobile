import api from "../../shared/api";
import { uploadDocument } from "../../shared/document.service";

export interface CharityRegisterBody {
  orgName: string;
  description?: string;
  region: string;
  registrationNumber: string;
  location?: { latitude: number; longitude: number; address?: string };
  contactInfo?: { phone?: string; website?: string };
  documentUrls: string[];
}

export const uploadCharityDocument = (
  uri: string,
  onProgress?: (percent: number) => void
): Promise<string> => uploadDocument(uri, "charity_registration", onProgress);

export const registerCharity = (body: CharityRegisterBody) =>
  api.post<{ data: { id: string; status: string; verifiedBadge: boolean } }>(
    "/api/charities/register",
    body
  );
