import { useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserProfile } from "../../../types";
import type { ProfileOrder, ReviewPayload, ToastKey } from "../../../types/profile";
import {
  fetchProfile,
  fetchMyOrders,
  submitReview as apiSubmitReview,
} from "../../../services/buyer/profile/profileService";

const REVIEWED_IDS_KEY = "@lefto_reviewed_order_ids";

export type ProfileTab = "orders" | "donations";

export interface UseProfileResult {
  profile: UserProfile | null;
  completedOrders: ProfileOrder[];
  donations: ProfileOrder[];
  activeTab: ProfileTab;
  setActiveTab: (tab: ProfileTab) => void;
  reviewedIds: Set<string>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  toast: ToastKey | null;
  onRefresh: () => void;
  submitReview: (payload: ReviewPayload) => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allOrders, setAllOrders] = useState<ProfileOrder[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("orders");
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastKey | null>(null);

  // Load persisted reviewed IDs from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(REVIEWED_IDS_KEY)
      .then((stored) => {
        if (stored) {
          const parsed: string[] = JSON.parse(stored);
          setReviewedIds(new Set(parsed));
        }
      })
      .catch(() => {});
  }, []);

  const showToast = useCallback((key: ToastKey) => {
    setToast(key);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [profileData, ordersData] = await Promise.all([
        fetchProfile(),
        fetchMyOrders(),
      ]);
      setProfile(profileData);
      setAllOrders(ordersData);
    } catch {
      setError("error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const onRefresh = useCallback(() => { fetchAll(true); }, [fetchAll]);

  const completedOrders = allOrders.filter(
    (o) => o.status === "COMPLETED" && o.type !== "DONATION"
  );
  const donations = allOrders.filter((o) => o.type === "DONATION");

  const markReviewed = useCallback((orderId: string) => {
    setReviewedIds((prev) => {
      const next = new Set([...prev, orderId]);
      AsyncStorage.setItem(REVIEWED_IDS_KEY, JSON.stringify([...next])).catch(() => {});
      return next;
    });
  }, []);

  const submitReview = useCallback(async (payload: ReviewPayload): Promise<void> => {
    try {
      await apiSubmitReview(payload);
      markReviewed(payload.orderId);
      showToast("reviewSuccess");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: unknown } };
      const status = axiosErr?.response?.status;
      if (status === 400 || status === 409) {
        markReviewed(payload.orderId);
        showToast("alreadyReviewed");
      } else {
        showToast("error");
      }
    }
  }, [markReviewed, showToast]);

  return {
    profile,
    completedOrders,
    donations,
    activeTab,
    setActiveTab,
    reviewedIds,
    loading,
    refreshing,
    error,
    toast,
    onRefresh,
    submitReview,
  };
}
