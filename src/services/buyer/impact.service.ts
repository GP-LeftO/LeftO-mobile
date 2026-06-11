import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

const BASE_URL = 'https://lefto-backend-production.up.railway.app';

export async function downloadImpactCertificate(month: string, accessToken: string): Promise<void> {
  const url     = `${BASE_URL}/api/users/me/impact-certificate?month=${month}`;
  const fileUri = `${FileSystem.documentDirectory}lefto-impact-${month}.pdf`;

  // Delete stale cached file to avoid serving a corrupted previous download.
  const existing = await FileSystem.getInfoAsync(fileUri);
  if (existing.exists) {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/pdf',
    },
  });

  if (result.status !== 200) {
    throw new Error('فشل التحميل، الرمز: ' + result.status);
  }

  const info = await FileSystem.getInfoAsync(result.uri);
  if (!info.exists) throw new Error('الملف فارغ');
  if ('size' in info && info.size === 0) throw new Error('الملف فارغ');

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(result.uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'شهادة التأثير البيئي — LeftO',
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert('تم التحميل', `تم حفظ الشهادة في:\n${result.uri}`);
  }
}
