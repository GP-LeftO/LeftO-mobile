import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ─── Token management ─────────────────────────────────────────────────────────
// Set/clear the Authorization header on the shared axios instance.
// Called by AuthContext on login, logout, and cold-start restore.
// Using api.defaults ensures every request includes the header without
// relying on an async interceptor, which can silently drop header mutations
// in Axios 1.x.
export function setApiToken(token: string | null): void {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// ─── Response interceptor: silent token refresh on 401 ───────────────────────
let isRefreshing = false;
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void };
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  failedQueue = [];
};

// Auth endpoints that should NEVER be intercepted for token refresh
const AUTH_ENDPOINTS = ["/api/auth/login", "/api/auth/refresh", "/api/auth/forgot-password", "/api/auth/reset-password"];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    // Skip refresh for auth endpoints — a 401 here means bad credentials, not expired token
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => original?.url?.includes(path));
    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (!refreshToken) throw new Error("no_refresh_token");

      const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });
      const newAccess: string = data.data.accessToken;

      await AsyncStorage.setItem("accessToken", newAccess);
      setApiToken(newAccess);
      processQueue(null, newAccess);

      original.headers.Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch (err) {
      processQueue(err, null);
      await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
      setApiToken(null);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
