import Constants from 'expo-constants';
import api from './api';

// Computed once at module load — only reads Constants, no API calls.
// Must be declared AFTER imports and never inside them.
export const isExpoGo: boolean =
  Constants.executionEnvironment === 'storeClient' ||
  Constants.appOwnership === 'expo';

// Call this inside a useEffect, never at module level.
export async function setupNotificationHandler(): Promise<void> {
  if (isExpoGo) {
    console.warn('[LeftO] Expo Go detected — skipping notification handler setup');
    return;
  }
  try {
    const { setNotificationHandler } = await import('expo-notifications');
    setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (e) {
    console.warn('[LeftO] setNotificationHandler failed:', e);
  }
}

// Returns the device FCM token string, or null in Expo Go / on error.
export async function getFcmToken(): Promise<string | null> {
  if (isExpoGo) {
    console.warn('[LeftO] Expo Go — skipping FCM token fetch');
    return null;
  }
  try {
    const { getDevicePushTokenAsync } = await import('expo-notifications');
    const token = await getDevicePushTokenAsync();
    return token.data;
  } catch (e) {
    console.warn('[LeftO] FCM token fetch failed:', e);
    return null;
  }
}

// Safe wrapper — returns an unsubscribe fn, or null in Expo Go / on error.
export async function addNotificationResponseListener(
  handler: (response: unknown) => void
): Promise<(() => void) | null> {
  if (isExpoGo) return null;
  try {
    const { addNotificationResponseReceivedListener } =
      await import('expo-notifications');
    const sub = addNotificationResponseReceivedListener(handler);
    return () => sub.remove();
  } catch (e) {
    console.warn('[LeftO] addNotificationResponseReceivedListener failed:', e);
    return null;
  }
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await api.put('/api/auth/fcm-token', { fcmToken: token });
  } catch {
    // Non-critical
  }
}

export async function clearPushToken(): Promise<void> {
  if (isExpoGo) return;
  try {
    await api.put('/api/auth/fcm-token', { fcmToken: null });
  } catch {
    // Non-critical
  }
}
