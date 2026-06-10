import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setApiToken } from "../services/shared/api";
import * as AuthService from "../services/auth/auth.service";

export type UserRole = "BUYER" | "SELLER" | "CHARITY" | "ADMIN";
export type SellerStatus = "PENDING" | "APPROVED" | "REJECTED" | null;

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  language: "AR" | "EN";
  createdAt: string;
  co2Saved?: number;
  moneySaved?: number;
  donationCount?: number;
  bagCount?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  sellerStatus: SellerStatus;
  charityStatus: SellerStatus;
  hasSeller: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;
  viewMode: "seller" | "buyer";
  switchToBuyerMode: () => void;
  switchToSellerMode: () => void;
  saveSession: (params: {
    user: AuthUser;
    accessToken: string;
    refreshToken?: string;
    sellerStatus?: SellerStatus;
    charityStatus?: SellerStatus;
    hasSeller?: boolean;
  }) => Promise<void>;
  clearSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
  switchRoleToken: (role: "BUYER" | "SELLER") => Promise<void>;
  setHasSeller: (v: boolean) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus>(null);
  const [charityStatus, setCharityStatus] = useState<SellerStatus>(null);
  const [hasSeller, setHasSeller] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewMode, setViewMode] = useState<"seller" | "buyer">("seller");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.multiGet([
          "accessToken",
          "refreshToken",
          "authUser",
          "sellerStatus",
          "charityStatus",
          "hasSeller",
        ]);
        const access      = stored[0][1];
        const refresh     = stored[1][1];
        const userJson    = stored[2][1];
        const sellerSt    = stored[3][1] as SellerStatus;
        const charitySt   = stored[4][1] as SellerStatus;
        const hasSell     = stored[5][1] === "true";

        if (access && userJson) {
          setApiToken(access);
          setAccessToken(access);
          setRefreshToken(refresh);
          setUser(JSON.parse(userJson));
          setSellerStatus(sellerSt ?? null);
          setCharityStatus(charitySt ?? null);
          setHasSeller(hasSell);
        }
      } catch {
      } finally {
        setIsInitializing(false);
      }
    })();
  }, []);

  const saveSession: AuthContextValue["saveSession"] = async ({
    user,
    accessToken,
    refreshToken,
    sellerStatus = null,
    charityStatus = null,
    hasSeller: hasSell = false,
  }) => {
    const pairs: [string, string][] = [
      ["accessToken", accessToken],
      ["authUser", JSON.stringify(user)],
      ["hasSeller", String(hasSell)],
    ];
    if (refreshToken) pairs.push(["refreshToken", refreshToken]);
    if (sellerStatus)  pairs.push(["sellerStatus",  sellerStatus]);
    if (charityStatus) pairs.push(["charityStatus", charityStatus]);

    await AsyncStorage.multiSet(pairs);
    setApiToken(accessToken);
    setUser(user);
    setAccessToken(accessToken);
    if (refreshToken)  setRefreshToken(refreshToken);
    setSellerStatus(sellerStatus);
    setCharityStatus(charityStatus);
    setHasSeller(hasSell);
  };

  const clearSession = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "authUser", "sellerStatus", "charityStatus", "hasSeller"]);
    setApiToken(null);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSellerStatus(null);
    setCharityStatus(null);
    setHasSeller(false);
    setViewMode("seller");
  };

  const switchRoleToken = async (role: "BUYER" | "SELLER") => {
    const { data } = await AuthService.switchRole(role);
    const newToken = data.data.accessToken;
    setApiToken(newToken);
    setAccessToken(newToken);
    await AsyncStorage.setItem("accessToken", newToken);
    if (user) {
      const updatedUser = { ...user, role: role as UserRole };
      setUser(updatedUser);
      await AsyncStorage.setItem("authUser", JSON.stringify(updatedUser));
    }
  };

  const updateUser = (updated: AuthUser) => {
    setUser(updated);
    AsyncStorage.setItem("authUser", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        sellerStatus,
        charityStatus,
        hasSeller,
        isAuthenticated: !!user && !!accessToken,
        isInitializing,
        viewMode,
        switchToBuyerMode:  () => setViewMode("buyer"),
        switchToSellerMode: () => setViewMode("seller"),
        saveSession,
        clearSession,
        updateUser,
        switchRoleToken,
        setHasSeller: (v: boolean) => {
          setHasSeller(v);
          AsyncStorage.setItem("hasSeller", String(v));
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
