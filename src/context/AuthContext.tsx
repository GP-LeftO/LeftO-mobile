import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setApiToken } from "../services/shared/api";

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
  isAuthenticated: boolean;
  isInitializing: boolean;
  saveSession: (params: {
    user: AuthUser;
    accessToken: string;
    refreshToken?: string;
    sellerStatus?: SellerStatus;
    charityStatus?: SellerStatus;
  }) => Promise<void>;
  clearSession: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus>(null);
  const [charityStatus, setCharityStatus] = useState<SellerStatus>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.multiGet([
          "accessToken",
          "refreshToken",
          "authUser",
          "sellerStatus",
          "charityStatus",
        ]);
        const access      = stored[0][1];
        const refresh     = stored[1][1];
        const userJson    = stored[2][1];
        const sellerSt    = stored[3][1] as SellerStatus;
        const charitySt   = stored[4][1] as SellerStatus;

        if (access && userJson) {
          setApiToken(access);
          setAccessToken(access);
          setRefreshToken(refresh);
          setUser(JSON.parse(userJson));
          setSellerStatus(sellerSt ?? null);
          setCharityStatus(charitySt ?? null);
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
  }) => {
    const pairs: [string, string][] = [
      ["accessToken", accessToken],
      ["authUser", JSON.stringify(user)],
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
  };

  const clearSession = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "authUser", "sellerStatus", "charityStatus"]);
    setApiToken(null);
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    setSellerStatus(null);
    setCharityStatus(null);
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
        isAuthenticated: !!user && !!accessToken,
        isInitializing,
        saveSession,
        clearSession,
        updateUser,
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
