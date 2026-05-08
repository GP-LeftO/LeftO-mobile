import api from "../services/api";

export type DocumentType = "trade_license" | "health_certificate" | "charity_registration";

export const uploadDocument = async (
  uri: string,
  documentType: DocumentType,
  onUploadProgress?: (percent: number) => void
): Promise<string> => {
  const filename = uri.split("/").pop() ?? "document.jpg";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeType = ext === "pdf" ? "application/pdf" : `image/${ext}`;

  const formData = new FormData();
  formData.append("file", { uri, name: filename, type: mimeType } as unknown as Blob);
  formData.append("documentType", documentType);

  const { data } = await api.post("/api/documents/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: onUploadProgress
      ? (e) => {
          const percent = Math.min(100, Math.max(0, Math.round((e.loaded / (e.total ?? e.loaded)) * 100)));
          onUploadProgress(percent);
        }
      : undefined,
  });
  return data.data.fileUrl as string;
};
