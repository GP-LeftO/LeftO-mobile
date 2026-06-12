// Web push via Firebase Cloud Messaging (Web). Mirrors the native + new named exports.
// Registers the FCM service worker, obtains a web FCM token, and posts it to the
// SAME backend endpoint the mobile app uses (PUT /api/auth/fcm-token).
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import api from "./api";
import { firebaseConfig, VAPID_KEY } from "../../config/firebase.web";

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (typeof window === "undefined") return null;
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;
    if (!(await isSupported())) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    if (getApps().length === 0) initializeApp(firebaseConfig);

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token ?? null;
  } catch {
    return null;
  }
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

// ── Stubs for exports used by App.tsx on native (no-ops on web) ──────────────

export const isExpoGo = false;

export async function setupNotificationHandler(): Promise<void> {}

export async function getFcmToken(): Promise<string | null> {
  return registerForPushNotifications();
}

export function addNotificationResponseListener(_handler: (response: unknown) => void): null {
  return null;
}
