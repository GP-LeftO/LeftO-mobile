import api from "../shared/api";
import type { AuthUser, SellerStatus } from "../../context/AuthContext";

export interface RegisterParams {
  name: string;
  phone: string;
  password: string;
  role: "BUYER" | "SELLER" | "CHARITY";
  email?: string;
  allergyPreferences?: string[];
}

export interface LoginResult {
  user: AuthUser;
  sellerStatus: SellerStatus;
  charityStatus: SellerStatus;
  accessToken: string;
  refreshToken: string;
}

export const sendOtp = (phone: string) =>
  api.post("/api/auth/send-otp", { phone });

export const verifyOtp = (phone: string, code: string) =>
  api.post("/api/auth/verify-otp", { phone, code });

export const register = (params: RegisterParams) =>
  api.post<{ data: { user: AuthUser; accessToken: string; refreshToken?: string } }>(
    "/api/auth/register",
    params
  );

export const login = (phone: string, password: string) =>
  api.post<{ data: LoginResult }>("/api/auth/login", { phone, password });

// Probes the login endpoint with a sentinel password to detect whether a phone is
// already registered — WITHOUT sending an OTP or creating a session.
//
// Expected backend contract (requires backend to return 404 for unknown phones):
//   401 "Invalid credentials" → user found, wrong password  → phone EXISTS
//   404                       → user not found              → phone is FREE
//   200                       → somehow authenticated       → phone EXISTS
//   5xx / network             → fail open, proceed to OTP   → return false
//
// ⚠️  Backend currently returns 401 for both cases. This will work correctly
//     once the backend returns 404 (NotFoundException) for unknown phones.
export const checkPhoneExists = async (phone: string): Promise<boolean> => {
  try {
    await api.post("/api/auth/login", { phone, password: "____probe____" });
    return true;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    const msg = ((err as { response?: { data?: { message?: string } } })
      .response?.data?.message ?? "").toLowerCase();
    if (status === 401 && msg.includes("invalid credentials")) return true;
    if (status === 404) return false;
    return false; // network error, 500, etc. — fail open
  }
};

export const logout = (refreshToken: string) =>
  api.post("/api/auth/logout", { refreshToken });

export const refreshToken = (token: string) =>
  api.post<{ data: { accessToken: string } }>("/api/auth/refresh", { refreshToken: token });

export const forgotPassword = (phone: string) =>
  api.post("/api/auth/forgot-password", { phone });

export const resetPassword = (phone: string, code: string, newPassword: string) =>
  api.post("/api/auth/reset-password", { phone, code, newPassword });

export const getMe = () =>
  api.get<{ data: { userId: string; role: string; hasSeller: boolean; sellerStatus: SellerStatus; sellerName: string | null } }>(
    "/api/auth/me"
  );

export const switchRole = (role: "BUYER" | "SELLER") =>
  api.patch<{ data: { accessToken: string; activeRole: string } }>(
    "/api/auth/switch-role",
    { role }
  );
