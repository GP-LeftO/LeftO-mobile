import { useState } from "react";
import api from "../services/api";
import { useAuthContext, AuthUser, SellerStatus } from "../context/AuthContext";
import { isRTL } from "../i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegisterParams {
  name: string;
  phone: string;
  password: string;
  role: "BUYER" | "SELLER" | "CHARITY";
  email?: string;
}

export interface RegisterSellerParams {
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY";
  location: { latitude: number; longitude: number; address?: string };
  description?: string;
  contactInfo?: { phone?: string; website?: string; socialMedia?: string };
  documentUrls?: string[];
}

export interface LoginResult {
  user: AuthUser;
  sellerStatus: SellerStatus;
  charityStatus: SellerStatus;
  accessToken: string;
  refreshToken: string;
}

interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

function initState<T>(): AsyncState<T> {
  return { loading: false, error: null, data: null };
}

// ─── Error message helpers ────────────────────────────────────────────────────

function parseError(err: unknown, rtl: boolean): string {
  const fallback = rtl
    ? "حدث خطأ في الشبكة، يرجى المحاولة مجدداً"
    : "Network error, please try again";

  if (!err || typeof err !== "object") return fallback;
  const axiosErr = err as {
    response?: { data?: { message?: string }; status?: number };
  };

  const status = axiosErr.response?.status;
  const serverMsg = axiosErr.response?.data?.message;

  if (!status) return fallback;

  if (rtl) {
    switch (status) {
      case 400: return serverMsg === "Invalid or expired OTP"
        ? "رمز التحقق غير صحيح أو منتهي الصلاحية"
        : "طلب غير صالح";
      case 401: return "رقم الهاتف أو كلمة المرور غير صحيحة";
      case 403: return "يرجى التحقق من رقم هاتفك أولاً";
      case 409: return "رقم الهاتف مسجّل مسبقاً";
      case 413: return "حجم الملف كبير جداً (الحد الأقصى 5 ميغابايت)";
      case 422: return "يرجى التحقق من البيانات المدخلة";
      case 429: return "لقد تجاوزت الحد المسموح، انتظر قليلاً";
      default: return serverMsg ?? fallback;
    }
  } else {
    switch (status) {
      case 400: return serverMsg === "Invalid or expired OTP"
        ? "OTP code is invalid or expired"
        : "Bad request";
      case 401: return "Invalid phone number or password";
      case 403: return "Please verify your phone number first";
      case 409: return "This phone number is already registered";
      case 413: return "File is too large (max 5 MB)";
      case 422: return "Please check the information you entered";
      case 429: return "Too many requests, please wait a moment";
      default: return serverMsg ?? fallback;
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useAuthContext();
  const rtl = isRTL();

  const [sendOtpState,    setSendOtpState]    = useState<AsyncState<void>>(initState());
  const [verifyOtpState,  setVerifyOtpState]  = useState<AsyncState<void>>(initState());
  const [registerState,   setRegisterState]   = useState<AsyncState<AuthUser>>(initState());
  const [loginState,      setLoginState]      = useState<AsyncState<LoginResult>>(initState());
  const [logoutState,     setLogoutState]     = useState<AsyncState<void>>(initState());

  // ── sendOtp ────────────────────────────────────────────────────────────────
  const sendOtp = async (phone: string) => {
    setSendOtpState({ loading: true, error: null, data: null });
    try {
      await api.post("/api/auth/send-otp", { phone });
      setSendOtpState({ loading: false, error: null, data: undefined });
    } catch (err) {
      setSendOtpState({ loading: false, error: parseError(err, rtl), data: null });
      throw err;
    }
  };

  // ── verifyOtp ──────────────────────────────────────────────────────────────
  const verifyOtp = async (phone: string, code: string) => {
    setVerifyOtpState({ loading: true, error: null, data: null });
    try {
      await api.post("/api/auth/verify-otp", { phone, code });
      setVerifyOtpState({ loading: false, error: null, data: undefined });
    } catch (err) {
      setVerifyOtpState({ loading: false, error: parseError(err, rtl), data: null });
      throw err;
    }
  };

  // ── register ───────────────────────────────────────────────────────────────
  const register = async (params: RegisterParams) => {
    setRegisterState({ loading: true, error: null, data: null });
    try {
      const { data } = await api.post("/api/auth/register", params);
      const { user, accessToken, refreshToken } = data.data as {
        user: AuthUser;
        accessToken: string;
        refreshToken?: string;
      };
      await ctx.saveSession({ user, accessToken, refreshToken });
      setRegisterState({ loading: false, error: null, data: user });
      return user;
    } catch (err) {
      setRegisterState({ loading: false, error: parseError(err, rtl), data: null });
      throw err;
    }
  };

  // ── uploadDocument ─────────────────────────────────────────────────────────
  const uploadDocument = async (
    uri: string,
    documentType: "trade_license" | "health_certificate" | "charity_registration",
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

  // ── registerSeller ─────────────────────────────────────────────────────────
  const registerSeller = async (params: RegisterSellerParams) => {
    const { data } = await api.post("/api/sellers/register", params);
    return data.data;
  };

  // ── login ──────────────────────────────────────────────────────────────────
  const login = async (phone: string, password: string) => {
    setLoginState({ loading: true, error: null, data: null });
    try {
      const { data } = await api.post("/api/auth/login", { phone, password });
      const result = data.data as LoginResult;
      await ctx.saveSession({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sellerStatus: result.sellerStatus,
        charityStatus: result.charityStatus,
      });
      setLoginState({ loading: false, error: null, data: result });
      return result;
    } catch (err) {
      setLoginState({ loading: false, error: parseError(err, rtl), data: null });
      throw err;
    }
  };

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    setLogoutState({ loading: true, error: null, data: null });
    try {
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      if (refreshToken) await api.post("/api/auth/logout", { refreshToken });
    } catch {
    } finally {
      await ctx.clearSession();
      setLogoutState({ loading: false, error: null, data: undefined });
    }
  };

  return {
    // ── Auth state
    user:            ctx.user,
    isAuthenticated: ctx.isAuthenticated,
    isInitializing:  ctx.isInitializing,
    sellerStatus:    ctx.sellerStatus,
    charityStatus:   ctx.charityStatus,

    // ── Functions + their states
    sendOtp,       sendOtpState,
    verifyOtp,     verifyOtpState,
    register,      registerState,
    uploadDocument,
    registerSeller,
    login,         loginState,
    logout,        logoutState,
  };
}
