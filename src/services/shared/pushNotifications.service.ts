import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getDevicePushTokenAsync();
  return tokenData.data;
}

export async function savePushToken(token: string): Promise<void> {
  try {
    await api.put("/api/auth/fcm-token", { fcmToken: token });
  } catch {
    // Non-critical — push delivery degrades gracefully
  }
}

export async function clearPushToken(): Promise<void> {
  try {
    await api.put("/api/auth/fcm-token", { fcmToken: null });
  } catch {
    // Non-critical
  }
}
