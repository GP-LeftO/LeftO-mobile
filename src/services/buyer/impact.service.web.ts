// Web impact-certificate download — fetches the PDF with the auth header and
// triggers a normal browser download (expo-file-system / expo-sharing are native-only).
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "https://lefto-backend-production.up.railway.app";

export async function downloadImpactCertificate(month: string, accessToken: string): Promise<void> {
  const url = `${BASE_URL}/api/users/me/impact-certificate?month=${month}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error("فشل تحميل الشهادة");

  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = `lefto-impact-${month}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objUrl);
}
