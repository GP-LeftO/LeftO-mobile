import { uploadDocument } from "../../shared/document.service";

export const uploadCharityDocument = (
  uri: string,
  onProgress?: (percent: number) => void
): Promise<string> => uploadDocument(uri, "charity_registration", onProgress);
