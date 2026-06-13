import { Platform } from "react-native";
import api from "./api";

export type DocumentType = "trade_license" | "health_certificate" | "charity_registration";

export const uploadDocument = async (
  uri: string,
  documentType: DocumentType,
  onUploadProgress?: (percent: number) => void
): Promise<string> => {
  const formData = new FormData();

  if (Platform.OS === "web") {
    // On web, expo-image-picker returns a blob: or data: URL.
    // Browsers require a real File/Blob — the { uri, name, type } object is React Native only.
    const response = await fetch(uri);
    const blob = await response.blob();
    const ext = blob.type.split("/")[1] ?? "jpg";
    formData.append("file", new File([blob], `document.${ext}`, { type: blob.type }));
  } else {
    const filename = uri.split("/").pop() ?? "document.jpg";
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mimeType = ext === "pdf" ? "application/pdf" : `image/${ext}`;
    formData.append("file", { uri, name: filename, type: mimeType } as unknown as Blob);
  }

  formData.append("documentType", documentType);

  const { data } = await api.post("/api/documents/upload", formData, {
    // On web the browser must set Content-Type (with boundary) automatically.
    // On native axios needs the explicit header.
    headers: Platform.OS === "web" ? {} : { "Content-Type": "multipart/form-data" },
    onUploadProgress: onUploadProgress
      ? (e) => {
          const percent = Math.min(100, Math.max(0, Math.round((e.loaded / (e.total ?? e.loaded)) * 100)));
          onUploadProgress(percent);
        }
      : undefined,
  });
  return data.data.fileUrl as string;
};
