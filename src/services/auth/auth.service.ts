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

export const logout = (refreshToken: string) =>
  api.post("/api/auth/logout", { refreshToken });

export const refreshToken = (token: string) =>
  api.post<{ data: { accessToken: string } }>("/api/auth/refresh", { refreshToken: token });
