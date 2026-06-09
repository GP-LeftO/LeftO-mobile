import { downloadAsync } from "expo-file-system";
import * as Sharing from "expo-sharing";

const BASE_URL = "https://lefto-backend-production.up.railway.app";

const DOCS_DIR = "file:///data/user/0/com.lefto.app/files/";

export async function downloadImpactCertificate(month: string, accessToken: string): Promise<void> {
  const url  = `${BASE_URL}/api/users/me/impact-certificate?month=${month}`;
  const path = `${DOCS_DIR}lefto-impact-${month}.pdf`;

  const result = await downloadAsync(url, path, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (result.status !== 200) throw new Error("فشل تحميل الشهادة");

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("المشاركة غير مدعومة على هذا الجهاز");

  await Sharing.shareAsync(result.uri, {
    mimeType: "application/pdf",
    dialogTitle: "شهادتي البيئية من LeftO",
  });
}
