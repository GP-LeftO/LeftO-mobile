import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, Platform, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import { useAuthContext } from "../../context/AuthContext";
import api from "../../services/shared/api";
import {
  deleteListing, updateKaramParticipation, sponsorKaramMealAsSeller,
  claimKaramMeal, getMySellerDonations,
} from "../../services/seller/seller.service";
import { fetchSellerKaramBalance } from "../../services/shared/community.service";
import { useSellerOrders } from "../../hooks/seller/useSellerOrders";
import type { SellerListing, SellerDonation } from "../../services/seller/seller.service";
import { getMyPerformance } from "../../services/seller/listingAI.service";
import type { PerformanceResult } from "../../services/seller/listingAI.service";
import type { SellerOrder } from "../../hooks/seller/useSellerOrders";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerProfile {
  id: string;
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY" | "GROCERY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  verifiedBadge?: boolean;
  description?: string;
  operatingHours?: string;
  location?: { latitude?: number; longitude?: number; address?: string };
  contactInfo?: { phone?: string; website?: string; socialMedia?: string };
  activeListingsCount?: number;
  totalOrdersCompleted?: number;
  currentMonthOrders?: number;
  totalRevenue?: number;
  totalItemsSaved?: number;
  totalDonations?: number;
  participatesInKaram?: boolean;
  rating?: number;
}

interface SettingsForm {
  businessName: string;
  description: string;
  phone: string;
  website: string;
  socialMedia: string;
  address: string;
}

type Tab = "overview" | "listings" | "orders" | "settings";

interface SellerDashboardScreenProps {
  onLogout?: () => void;
  onCreateListing?: () => void;
  onEditListing?: (listing: SellerListing) => void;
  onDonateFromListing?: (listing: SellerListing) => void;
  refreshKey?: number;
  openDonationsTab?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurant", MARKET: "Market", BAKERY: "Bakery",
};
const BUSINESS_TYPE_LABELS_AR: Record<string, string> = {
  RESTAURANT: "مطعم", MARKET: "سوق", BAKERY: "مخبزة",
};

const ORDER_STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; color: string }> = {
  RESERVED:  { labelEn: "Reserved",  labelAr: "محجوز",  color: Colors.primaryOrange },
  COMPLETED: { labelEn: "Completed", labelAr: "مكتمل",  color: Colors.greenMain     },
  CANCELLED: { labelEn: "Cancelled", labelAr: "ملغى",   color: Colors.grayMedium    },
};

const DONATION_STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; color: string }> = {
  PENDING:   { labelEn: "Pending",   labelAr: "قادم",        color: Colors.primaryOrange },
  PICKED_UP: { labelEn: "Picked Up", labelAr: "تم الاستلام",  color: "#7c3aed"            },
  CONFIRMED: { labelEn: "Confirmed", labelAr: "مكتمل",        color: Colors.greenMain     },
  CANCELLED: { labelEn: "Cancelled", labelAr: "ملغى",         color: Colors.grayMedium    },
};

function formatPickup(start?: string, end?: string): string {
  if (!start || !end) return "—";
  try {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch {
    return "—";
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
  } catch { return ""; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerDashboardScreen({
  onLogout,
  onCreateListing,
  onEditListing,
  onDonateFromListing,
  refreshKey,
  openDonationsTab,
}: SellerDashboardScreenProps) {
  const insets     = useSafeAreaInsets();
  const rtl        = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { switchToBuyerMode } = useAuthContext();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [activeTab,       setActiveTab]       = useState<Tab>("overview");
  const [profile,         setProfile]         = useState<SellerProfile | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [fetchError,      setFetchError]      = useState("");

  // ── Listings state ────────────────────────────────────────────────────────
  const [listings,        setListings]        = useState<SellerListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError,   setListingsError]   = useState("");
  const [soldOutLoading,  setSoldOutLoading]  = useState<string | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState<string | null>(null);

  // ── Settings form state ───────────────────────────────────────────────────
  const [settingsForm,    setSettingsForm]    = useState<SettingsForm>({
    businessName: "", description: "", phone: "", website: "", socialMedia: "", address: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved,   setSettingsSaved]   = useState(false);
  const [settingsError,   setSettingsError]   = useState("");

  // ── Donations state ───────────────────────────────────────────────────────
  const [donations,        setDonations]        = useState<SellerDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError,   setDonationsError]   = useState("");

  // ── Charities state (for donation flow) ──────────────────────────────────
  const [charities,        setCharities]        = useState<{ id: string; name: string }[]>([]);
  const [charitiesLoading, setCharitiesLoading] = useState(false);

  // ── Karam state ───────────────────────────────────────────────────────────
  const [karamBalance,  setKaramBalance]  = useState<{ sponsored: number; claimed: number; available: number } | null>(null);
  const [settingsKaram, setSettingsKaram] = useState(false);
  const [karamToggling, setKaramToggling] = useState(false);
  const [karamActing,   setKaramActing]   = useState<"sponsor" | "claim" | null>(null);

  // ── Orders filter state ───────────────────────────────────────────────────
  const [ordersFilter, setOrdersFilter] = useState<string>("");

  // ── AI Performance state ──────────────────────────────────────────────────
  const [performance, setPerformance] = useState<PerformanceResult | null>(null);

  // ── Orders hook ───────────────────────────────────────────────────────────
  const {
    orders, loading: ordersLoading, refreshing: ordersRefreshing,
    error: ordersError, hasMore: ordersHasMore, fetchOrders,
  } = useSellerOrders();

  const filteredOrders = ordersFilter
    ? orders.filter((o) => o.status === ordersFilter)
    : orders;

  // ─── Data fetching ─────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError("");
    try {
      const { data } = await api.get("/api/sellers/me");
      const p = data.data as SellerProfile;
      setProfile(p);
      setSettingsForm({
        businessName: p.businessName ?? "",
        description:  p.description  ?? "",
        phone:        p.contactInfo?.phone        ?? "",
        website:      p.contactInfo?.website      ?? "",
        socialMedia:  p.contactInfo?.socialMedia  ?? "",
        address:      p.location?.address         ?? "",
      });
    } catch {
      setFetchError(rtl ? "تعذّر تحميل بيانات المتجر" : "Could not load store data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rtl]);

  const fetchKaramBalance = useCallback(async (sellerId: string) => {
    try {
      const bal = await fetchSellerKaramBalance(sellerId);
      setKaramBalance(bal as { sponsored: number; claimed: number; available: number });
    } catch {
      // Karam balance is non-critical, silently fail
    }
  }, []);

  const fetchListings = useCallback(async () => {
    const sellerId = profile?.id ?? user?.id;
    if (!sellerId) return;
    setListingsLoading(true);
    setListingsError("");
    try {
      let items: SellerListing[] = [];
      try {
        const { data } = await api.get("/api/sellers/me/listings");
        const payload = data?.data ?? data;
        items = Array.isArray(payload) ? payload : (payload?.listings ?? payload?.items ?? payload?.data ?? []);
      } catch {
        const { data } = await api.get("/api/listings", { params: { sellerId } });
        const payload = data?.data ?? data;
        items = Array.isArray(payload) ? payload : (payload?.listings ?? payload?.items ?? payload?.data ?? []);
      }
      setListings(items);
    } catch {
      setListingsError(rtl ? "تعذّر تحميل القوائم" : "Could not load listings");
    } finally {
      setListingsLoading(false);
    }
  }, [profile?.id, user?.id, rtl]);

  const fetchDonations = useCallback(async () => {
    setDonationsLoading(true);
    setDonationsError("");
    try {
      const data = await getMySellerDonations();
      setDonations(data);
    } catch {
      setDonationsError(rtl ? "تعذّر تحميل التبرعات" : "Could not load donations");
    } finally {
      setDonationsLoading(false);
    }
  }, [rtl]);

  const fetchCharities = useCallback(async () => {
    setCharitiesLoading(true);
    try {
      const { data } = await api.get("/api/charities");
      const payload = data?.data ?? data;
      const arr = Array.isArray(payload) ? payload : payload?.charities ?? payload?.items ?? [];
      setCharities(arr.map((c: { id: string; name?: string; orgName?: string; organizationName?: string }) => ({
        id: c.id,
        name: c.name ?? c.orgName ?? c.organizationName ?? "Charity",
      })));
    } catch {
      setCharities([]);
    } finally {
      setCharitiesLoading(false);
    }
  }, []);

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProfile();
    getMyPerformance().then(setPerformance).catch(() => {});
  }, [fetchProfile]);

  useEffect(() => {
    if (profile?.participatesInKaram && profile?.id) {
      fetchKaramBalance(profile.id);
    }
  }, [profile?.id, profile?.participatesInKaram, fetchKaramBalance]);

  useEffect(() => { if (activeTab === "listings") fetchListings(); }, [activeTab, fetchListings]);
  useEffect(() => { if (activeTab === "orders") fetchOrders(); }, [activeTab, fetchOrders]);
  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { if (refreshKey && activeTab === "listings") fetchListings(); }, [refreshKey, activeTab, fetchListings]);

  // Pre-populate settings on first profile load
  useEffect(() => {
    if (profile) {
      setSettingsForm({
        businessName: profile.businessName ?? "",
        description:  profile.description ?? "",
        phone:        profile.contactInfo?.phone ?? "",
        website:      profile.contactInfo?.website ?? "",
        socialMedia:  profile.contactInfo?.socialMedia ?? "",
        address:      profile.location?.address ?? "",
      });
      setSettingsKaram(profile.participatesInKaram ?? false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!profile]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const handleKaramToggle = async (value: boolean) => {
    setSettingsKaram(value);
    setKaramToggling(true);
    try {
      await updateKaramParticipation(value);
      setProfile((prev) => prev ? { ...prev, participatesInKaram: value } : prev);
      if (value && profile?.id) fetchKaramBalance(profile.id);
    } catch {
      setSettingsKaram(!value); // revert on error
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تحديث برنامج كرم" : "Could not update Karam setting");
    } finally {
      setKaramToggling(false);
    }
  };

  const handleSponsorKaram = async () => {
    setKaramActing("sponsor");
    try {
      const updated = await sponsorKaramMealAsSeller();
      setKaramBalance(updated);
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تمويل وجبة" : "Could not sponsor a meal");
    } finally {
      setKaramActing(null);
    }
  };

  const handleClaimKaram = async () => {
    setKaramActing("claim");
    try {
      const updated = await claimKaramMeal();
      setKaramBalance(updated);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      Alert.alert(
        rtl ? "تنبيه" : "Note",
        msg ?? (rtl ? "لا توجد وجبات متاحة اليوم" : "No sponsored meals available today")
      );
    } finally {
      setKaramActing(null);
    }
  };

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (activeTab === "listings") fetchListings(); }, [activeTab, fetchListings]);
  useEffect(() => { if (activeTab === "orders") fetchOrders(true); }, [activeTab]);
  useEffect(() => { if (refreshKey && activeTab === "listings") fetchListings(); }, [refreshKey]);

  // ─── Listing actions ───────────────────────────────────────────────────────

  const handleMarkSoldOut = async (listingId: string) => {
    setSoldOutLoading(listingId);
    try {
      await api.patch(`/api/listings/${listingId}/sold-out`);
      await fetchListings();
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تحديث حالة القائمة" : "Could not update listing status");
    } finally {
      setSoldOutLoading(null);
    }
  };

  const handleDeleteListing = (listingId: string, title: string) => {
    Alert.alert(
      rtl ? "حذف القائمة" : "Delete Listing",
      rtl ? `هل أنت متأكد أنك تريد حذف "${title}"؟` : `Are you sure you want to delete "${title}"?`,
      [
        { text: rtl ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: rtl ? "حذف" : "Delete", style: "destructive",
          onPress: async () => {
            setDeleteLoading(listingId);
            try {
              await deleteListing(listingId);
              await fetchListings();
            } catch {
              Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر حذف القائمة" : "Could not delete listing");
            } finally {
              setDeleteLoading(null);
            }
          },
        },
      ]
    );
  };

  // ─── Settings actions ──────────────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    setSettingsError("");
    setSettingsSaved(false);
    try {
      await api.patch("/api/sellers/me", {
        businessName: settingsForm.businessName.trim() || undefined,
        description:  settingsForm.description.trim()  || undefined,
        contactInfo: {
          phone:       settingsForm.phone.trim()       || undefined,
          website:     settingsForm.website.trim()     || undefined,
          socialMedia: settingsForm.socialMedia.trim() || undefined,
        },
        location: settingsForm.address.trim()
          ? { address: settingsForm.address.trim() }
          : undefined,
      });
      setSettingsSaved(true);
      await fetchProfile();
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch {
      setSettingsError(rtl ? "تعذّر حفظ التغييرات" : "Could not save changes. Please try again.");
    } finally {
      setSettingsLoading(false);
    }
  };

  // ─── Tabs config ───────────────────────────────────────────────────────────

  const TABS: { key: Tab; labelEn: string; labelAr: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "overview",  labelEn: "Overview",  labelAr: "عام",       icon: "grid"         },
    { key: "listings",  labelEn: "Listings",  labelAr: "القوائم",   icon: "package"      },
    { key: "orders",    labelEn: "Orders",    labelAr: "الطلبات",   icon: "shopping-bag" },
    { key: "settings",  labelEn: "Settings",  labelAr: "الإعدادات", icon: "settings"     },
  ];

  const STATS = [
    { icon: "package" as const,  color: Colors.primaryOrange, label: rtl ? "الإعلانات النشطة" : "Active Listings",    value: profile?.activeListings ?? 0 },
    { icon: "heart" as const,    color: Colors.greenMain,     label: rtl ? "إجمالي التبرعات"  : "Total Donations",     value: profile?.totalDonations  ?? 0 },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>

      {/* ── Header ── */}
      <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.storeIconWrap}>
            <Text style={styles.storeIconText}>🏪</Text>
          </View>
          <View>
            {loading
              ? <View style={styles.skeletonName} />
              : <Text style={[styles.storeName, rtl && styles.rtl]} numberOfLines={1}>
                  {profile?.businessName ?? user?.name ?? "My Store"}
                </Text>
            }
            <View style={[styles.badgeRow, rtl && styles.badgeRowRTL]}>
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={11} color={Colors.greenMain} />
                <Text style={styles.verifiedText}>{rtl ? "موثّق" : "Verified"}</Text>
              </View>
              {profile && (
                <Text style={styles.bizType}>
                  {rtl ? BUSINESS_TYPE_LABELS_AR[profile.businessType] : BUSINESS_TYPE_LABELS[profile.businessType]}
                </Text>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={Colors.grayMedium} />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Tab bar ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(500).springify()} style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.8}
          >
            <Feather name={tab.icon} size={14} color={activeTab === tab.key ? Colors.primaryOrange : Colors.grayMedium} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {rtl ? tab.labelAr : tab.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── Loading / error ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
        </View>
      ) : fetchError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProfile()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tabContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor={Colors.primaryOrange} />}
            >
              <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
                <View style={styles.statsGrid}>
                  {STATS.map((stat, i) => (
                    <View key={i} style={styles.statCard}>
                      <View style={[styles.statIcon, { backgroundColor: stat.color + "18" }]}>
                        <Feather name={stat.icon} size={18} color={stat.color} />
                      </View>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={[styles.statLabel, rtl && styles.rtl]}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
                {/* AI Performance Score card */}
                {performance && (
                  <PerformanceCard perf={performance} rtl={rtl} />
                )}

                {profile?.description && (
                  <View style={styles.infoCard}>
                    <Text style={[styles.infoCardTitle, rtl && styles.rtl]}>{rtl ? "عن المتجر" : "About"}</Text>
                    <Text style={[styles.infoCardBody, rtl && styles.rtl]}>{profile.description}</Text>
                  </View>
                )}
                {profile?.location?.address && (
                  <View style={[styles.metaRow, rtl && styles.metaRowRTL]}>
                    <Feather name="map-pin" size={14} color={Colors.primaryOrange} />
                    <Text style={[styles.metaText, rtl && styles.rtl]} numberOfLines={2}>{profile.location.address}</Text>
                  </View>
                )}
                {profile?.contactInfo?.phone && (
                  <View style={[styles.metaRow, rtl && styles.metaRowRTL]}>
                    <Feather name="phone" size={14} color={Colors.primaryOrange} />
                    <Text style={[styles.metaText, rtl && styles.rtl]}>{profile.contactInfo.phone}</Text>
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          )}

          {/* ══════════ LISTINGS TAB ══════════ */}
          {activeTab === "listings" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
                {listingsLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={Colors.primaryOrange} size="large" />
                  </View>
                ) : listingsError ? (
                  <View style={styles.centered}>
                    <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
                    <Text style={[styles.errorText, rtl && styles.rtl]}>{listingsError}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchListings} activeOpacity={0.8}>
                      <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : listings.length === 0 ? (
                  <View style={styles.emptyPane}>
                    <Text style={styles.emptyEmoji}>📦</Text>
                    <Text style={[styles.emptyTitle, rtl && styles.rtl]}>{rtl ? "لا توجد قوائم" : "No listings yet"}</Text>
                    <Text style={[styles.emptySub, rtl && styles.rtl]}>
                      {rtl ? "اضغط على + لإضافة أول قائمة" : "Tap + to add your first listing"}
                    </Text>
                  </View>
                ) : (
                  listings.map((listing) => (
                    <View key={listing.id} style={styles.listingCard}>
                      <View style={[styles.listingCardInner, rtl && styles.listingCardInnerRTL]}>
                        <View style={styles.listingIconWrap}>
                          <Feather name="package" size={18} color={Colors.primaryOrange} />
                        </View>
                        <View style={styles.listingBody}>
                          <Text style={[styles.listingTitle, rtl && styles.rtl]} numberOfLines={1}>{listing.title}</Text>
                          {listing.pickupStart && listing.pickupEnd && (
                            <View style={[styles.listingMeta, rtl && styles.listingMetaRTL]}>
                              <Feather name="clock" size={12} color={Colors.grayMedium} />
                              <Text style={styles.listingMetaText}>{formatPickup(listing.pickupStart, listing.pickupEnd)}</Text>
                            </View>
                          )}
                          <View style={[styles.listingMeta, rtl && styles.listingMetaRTL]}>
                            <Feather name="layers" size={12} color={Colors.grayMedium} />
                            <Text style={styles.listingMetaText}>{rtl ? `المتبقي: ${listing.quantity}` : `Qty: ${listing.quantity}`}</Text>
                          </View>
                        </View>
                        <View style={styles.listingActions}>
                          <Text style={styles.listingPrice}>₪{listing.discountedPrice ?? listing.price ?? "—"}</Text>
                          <TouchableOpacity style={styles.actionIconBtn} onPress={() => onEditListing?.(listing)} activeOpacity={0.8}>
                            <Feather name="edit-2" size={14} color={Colors.primaryOrange} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.soldOutBtn}
                            onPress={() => handleMarkSoldOut(listing.id)}
                            disabled={soldOutLoading === listing.id}
                            activeOpacity={0.8}
                          >
                            {soldOutLoading === listing.id
                              ? <ActivityIndicator size="small" color="#ef4444" />
                              : <Text style={styles.soldOutBtnText}>{rtl ? "نفد" : "Sold Out"}</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteIconBtn}
                            onPress={() => handleDeleteListing(listing.id, listing.title)}
                            disabled={deleteLoading === listing.id}
                            activeOpacity={0.8}
                          >
                            {deleteLoading === listing.id
                              ? <ActivityIndicator size="small" color="#ef4444" />
                              : <Feather name="trash-2" size={14} color="#ef4444" />}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </Animated.View>
            </ScrollView>
          )}

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tabContent}
              refreshControl={
                <RefreshControl
                  refreshing={ordersRefreshing}
                  onRefresh={() => fetchOrders(true)}
                  tintColor={Colors.primaryOrange}
                />
              }
            >
              <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
                {ordersLoading && orders.length === 0 ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={Colors.primaryOrange} size="large" />
                  </View>
                ) : ordersError ? (
                  <View style={styles.centered}>
                    <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
                    <Text style={[styles.errorText, rtl && styles.rtl]}>{ordersError}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders(true)} activeOpacity={0.8}>
                      <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : orders.length === 0 ? (
                  <View style={styles.emptyPane}>
                    <Text style={styles.emptyEmoji}>🛍️</Text>
                    <Text style={[styles.emptyTitle, rtl && styles.rtl]}>{rtl ? "لا توجد طلبات" : "No orders yet"}</Text>
                    <Text style={[styles.emptySub, rtl && styles.rtl]}>
                      {rtl ? "ستظهر هنا طلبات المشترين" : "Buyer reservations will appear here"}
                    </Text>
                  </View>
                ) : (
                  <>
                    {orders.map((order) => <SellerOrderCard key={order.id} order={order} rtl={rtl} />)}
                    {ordersHasMore && (
                      <TouchableOpacity
                        style={styles.loadMoreBtn}
                        onPress={() => fetchOrders(false)}
                        disabled={ordersLoading}
                        activeOpacity={0.8}
                      >
                        {ordersLoading
                          ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                          : <Text style={styles.loadMoreText}>{rtl ? "تحميل المزيد" : "Load more"}</Text>}
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </Animated.View>
            </ScrollView>
          )}

          {/* ══════════ ORDERS TAB ══════════ */}
          {activeTab === "orders" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
              {/* Status filter */}
              <View style={[styles.filterRow, rtl && styles.filterRowRTL]}>
                {(["RESERVED", "COMPLETED", "CANCELLED"] as OrderFilter[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.filterPill, ordersFilter === f && styles.filterPillActive]}
                    onPress={() => setOrdersFilter(f)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterPillText, ordersFilter === f && styles.filterPillTextActive]}>
                      {rtl
                        ? f === "RESERVED" ? "نشطة" : f === "COMPLETED" ? "مكتملة" : "ملغاة"
                        : f === "RESERVED" ? "Active" : f === "COMPLETED" ? "Completed" : "Cancelled"
                      }
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {ordersLoading ? (
                <View style={styles.centeredState}>
                  <ActivityIndicator color={Colors.primaryOrange} size="large" />
                </View>
              ) : ordersError ? (
                <View style={styles.centeredState}>
                  <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
                  <Text style={[styles.stateText, rtl && styles.rtl]}>{ordersError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchOrders} activeOpacity={0.8}>
                    <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                  </TouchableOpacity>
                </View>
              ) : filteredOrders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📋</Text>
                  <Text style={[styles.emptyTitle, rtl && styles.rtl]}>
                    {rtl ? "لا توجد طلبات" : "No orders"}
                  </Text>
                </View>
              ) : (
                filteredOrders.map((order) => {
                  const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.RESERVED;
                  const date = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString(rtl ? "ar-PS" : "en-GB", { day: "numeric", month: "short" })
                    : null;
                  return (
                    <View key={order.id} style={styles.orderCard}>
                      <View style={[styles.orderInner, rtl && styles.orderInnerRTL]}>
                        <View style={styles.orderIconWrap}>
                          <Feather name="shopping-bag" size={16} color={Colors.primaryOrange} />
                        </View>
                        <View style={styles.orderBody}>
                          <Text style={[styles.orderTitle, rtl && styles.rtl]} numberOfLines={1}>
                            {order.listing?.title ?? (rtl ? "طلب" : "Order")}
                          </Text>
                          <Text style={[styles.orderSub, rtl && styles.rtl]}>
                            {order.buyer?.name ?? (rtl ? "مشترٍ" : "Buyer")}
                            {order.quantity ? ` · ${rtl ? "الكمية" : "Qty"}: ${order.quantity}` : ""}
                            {date ? ` · ${date}` : ""}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.statusPillText, { color: cfg.color }]}>{rtl ? cfg.ar : cfg.en}</Text>
                        </View>
                      </View>
                      {order.totalPrice != null && (
                        <Text style={[styles.orderPrice, rtl && styles.rtl]}>₪{order.totalPrice}</Text>
                      )}
                    </View>
                  );
                })
              )}
            </Animated.View>
          )}

          {/* ══════════ DONATIONS TAB ══════════ */}
          {activeTab === "donations" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
              {donationsLoading ? (
                <View style={styles.centeredState}>
                  <ActivityIndicator color={Colors.primaryOrange} size="large" />
                </View>
              ) : donationsError ? (
                <View style={styles.centeredState}>
                  <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
                  <Text style={[styles.stateText, rtl && styles.rtl]}>{donationsError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchDonations} activeOpacity={0.8}>
                    <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                  </TouchableOpacity>
                </View>
              ) : donations.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎁</Text>
                  <Text style={[styles.emptyTitle, rtl && styles.rtl]}>{rtl ? "لا توجد تبرعات بعد" : "No donations yet"}</Text>
                  <Text style={[styles.emptySub, rtl && styles.rtl]}>
                    {rtl ? "اضغط \"تبرع بالفائض\" من نظرة عامة" : "Use \"Donate Surplus\" from the Overview tab"}
                  </Text>
                </View>
              ) : (
                donations.map((don) => {
                  const cfg = DONATION_STATUS_CONFIG[don.status] ?? DONATION_STATUS_CONFIG.PENDING;
                  const charityName = don.charity?.orgName ?? don.charity?.name ?? (rtl ? "جمعية" : "Charity");
                  const date = don.createdAt
                    ? new Date(don.createdAt).toLocaleDateString(rtl ? "ar-PS" : "en-GB", { day: "numeric", month: "short" })
                    : null;
                  return (
                    <View key={don.id} style={styles.donationCard}>
                      <View style={[styles.donationInner, rtl && styles.donationInnerRTL]}>
                        <View style={styles.donationIconWrap}>
                          <Feather name="gift" size={16} color={Colors.greenMain} />
                        </View>
                        <View style={styles.donationBody}>
                          <Text style={[styles.donationTitle, rtl && styles.rtl]} numberOfLines={1}>
                            {don.listing?.title ?? (rtl ? "تبرع" : "Donation")}
                          </Text>
                          <Text style={[styles.donationSub, rtl && styles.rtl]}>
                            {rtl ? `إلى: ${charityName}` : `To: ${charityName}`}
                            {` · ${rtl ? "كمية" : "Qty"}: ${don.quantity}`}
                            {date ? ` · ${date}` : ""}
                          </Text>
                        </View>
                        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.statusPillText, { color: cfg.color }]}>{rtl ? cfg.ar : cfg.en}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </Animated.View>
          )}

          {/* ══════════ SETTINGS TAB ══════════ */}
          {activeTab === "settings" && (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent} keyboardShouldPersistTaps="handled">
                <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>

                  {settingsSaved && (
                    <View style={styles.successBanner}>
                      <Feather name="check-circle" size={16} color={Colors.greenMain} />
                      <Text style={styles.successBannerText}>{rtl ? "تم حفظ التغييرات بنجاح" : "Changes saved successfully"}</Text>
                    </View>
                  )}
                  {settingsError !== "" && (
                    <View style={styles.errorBanner}>
                      <Feather name="alert-circle" size={16} color="#ef4444" />
                      <Text style={styles.errorBannerText}>{settingsError}</Text>
                    </View>
                  )}

                  <SettingsField
                    label={rtl ? "اسم المتجر" : "Business Name"}
                    value={settingsForm.businessName}
                    onChangeText={v => setSettingsForm(f => ({ ...f, businessName: v }))}
                    placeholder={rtl ? "اسم متجرك" : "Your store name"}
                    rtl={rtl}
                  />
                  <SettingsField
                    label={rtl ? "وصف المتجر" : "Description"}
                    value={settingsForm.description}
                    onChangeText={v => setSettingsForm(f => ({ ...f, description: v }))}
                    placeholder={rtl ? "صِف متجرك ومنتجاتك…" : "Describe your store and products…"}
                    multiline
                    rtl={rtl}
                  />
                  <SettingsField
                    label={rtl ? "رقم الهاتف" : "Phone"}
                    value={settingsForm.phone}
                    onChangeText={v => setSettingsForm(f => ({ ...f, phone: v }))}
                    placeholder="+970-5-XXXXXXX"
                    keyboardType="phone-pad"
                    rtl={rtl}
                  />
                  <SettingsField
                    label={rtl ? "الموقع الإلكتروني" : "Website"}
                    value={settingsForm.website}
                    onChangeText={v => setSettingsForm(f => ({ ...f, website: v }))}
                    placeholder="https://..."
                    keyboardType="url"
                    rtl={rtl}
                  />
                  <SettingsField
                    label={rtl ? "وسائل التواصل الاجتماعي" : "Social Media"}
                    value={settingsForm.socialMedia}
                    onChangeText={v => setSettingsForm(f => ({ ...f, socialMedia: v }))}
                    placeholder={rtl ? "@حساب_انستغرام" : "@instagram_handle"}
                    rtl={rtl}
                  />
                  <SettingsField
                    label={rtl ? "العنوان" : "Address"}
                    value={settingsForm.address}
                    onChangeText={v => setSettingsForm(f => ({ ...f, address: v }))}
                    placeholder={rtl ? "مثال: شارع النزهة، رام الله" : "e.g. 14 Al-Nuzha St, Ramallah"}
                    rtl={rtl}
                  />

                  <TouchableOpacity
                    style={[styles.saveBtn, settingsLoading && styles.saveBtnDisabled]}
                    onPress={handleSaveSettings}
                    disabled={settingsLoading}
                    activeOpacity={0.85}
                  >
                    {settingsLoading
                      ? <ActivityIndicator color={Colors.white} size="small" />
                      : <Text style={styles.saveBtnText}>{rtl ? "حفظ التغييرات" : "Save Changes"}</Text>}
                  </TouchableOpacity>

                </Animated.View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}
        </>
      )}

      {/* FAB: Add listing */}
      {activeTab === "listings" && onCreateListing && (
        <TouchableOpacity
          style={[styles.fab, rtl ? styles.fabRTL : styles.fabLTR]}
          onPress={onCreateListing}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={24} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── SellerOrderCard ──────────────────────────────────────────────────────────

function SellerOrderCard({ order, rtl }: { order: SellerOrder; rtl: boolean }) {
  const cfg = ORDER_STATUS_CONFIG[order.status] ?? ORDER_STATUS_CONFIG.CANCELLED;
  return (
    <View style={styles.orderCard}>
      <View style={[styles.orderCardInner, rtl && styles.orderCardInnerRTL]}>
        <View style={[styles.orderStatusDot, { backgroundColor: cfg.color }]} />
        <View style={styles.orderBody}>
          <Text style={[styles.orderTitle, rtl && styles.rtl]} numberOfLines={1}>
            {order.listing?.title ?? (rtl ? "طلب" : "Order")}
          </Text>
          <Text style={[styles.orderMeta, rtl && styles.rtl]}>
            {order.buyer?.name ?? (rtl ? "مشترٍ" : "Buyer")}
            {" · "}
            {rtl ? `الكمية: ${order.quantity}` : `Qty: ${order.quantity}`}
          </Text>
          <Text style={[styles.orderMeta, rtl && styles.rtl]}>
            {formatPickup(order.pickupStart, order.pickupEnd)}
            {"  ·  "}
            {formatDate(order.createdAt)}
          </Text>
        </View>
        <View style={[styles.orderStatusBadge, { backgroundColor: cfg.color + "18" }]}>
          <Text style={[styles.orderStatusText, { color: cfg.color }]}>
            {rtl ? cfg.labelAr : cfg.labelEn}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── SettingsField ────────────────────────────────────────────────────────────

function SettingsField({
  label, value, onChangeText, placeholder, multiline, keyboardType, rtl,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "url";
  rtl: boolean;
}) {
  return (
    <View style={styles.settingsField}>
      <Text style={[styles.settingsFieldLabel, rtl && styles.rtl]}>{label}</Text>
      <TextInput
        style={[styles.settingsInput, multiline && styles.settingsInputMulti, rtl && styles.rtl]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.grayMedium}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType ?? "default"}
        textAlign={rtl ? "right" : "left"}
        textAlignVertical={multiline ? "top" : "center"}
        autoCapitalize="none"
      />
    </View>
  );
}

// ─── Performance Card sub-component ──────────────────────────────────────────

function PerformanceCard({ perf, rtl }: { perf: PerformanceResult; rtl: boolean }) {
  const score = perf.performanceScore;
  const barColor = score >= 70 ? Colors.greenMain : score >= 40 ? Colors.primaryOrange : "#EF4444";
  const label = score >= 70
    ? (rtl ? "ممتاز" : "Excellent")
    : score >= 40 ? (rtl ? "مقبول" : "Good") : (rtl ? "ضعيف" : "Weak");

  const insightParts = perf.weeklyInsight
    ? perf.weeklyInsight.split("|").map(s => s.trim())
    : [];

  return (
    <View style={perfStyles.card}>
      {/* Score row */}
      <View style={[perfStyles.titleRow, rtl && { flexDirection: "row-reverse" }]}>
        <Text style={[perfStyles.title, rtl && { textAlign: "right" }]}>
          {rtl ? "أداء متجرك" : "Store Performance"}
        </Text>
        <Text style={[perfStyles.scoreNum, { color: barColor }]}>{score}/100 · {label}</Text>
      </View>

      {/* Progress bar */}
      <View style={perfStyles.barBg}>
        <View style={[perfStyles.barFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
      </View>

      {/* Breakdown pills */}
      {perf.stats && (
        <View style={[perfStyles.pillRow, rtl && { flexDirection: "row-reverse" }]}>
          <StatPill label={rtl ? "معدل البيع" : "Sell-through"} value={`${perf.stats.sellThroughRate}%`} />
          <StatPill label={rtl ? "التقييم" : "Rating"} value={perf.stats.avgRating > 0 ? `⭐ ${perf.stats.avgRating.toFixed(1)}` : "—"} />
          <StatPill label={rtl ? "أسبوعياً" : "Weekly"} value={`${perf.stats.listingsPerWeek.toFixed(1)}`} />
        </View>
      )}

      {/* Weekly sentiment insight */}
      {insightParts.length > 0 && (
        <View style={perfStyles.insightBox}>
          <Text style={[perfStyles.insightTitle, rtl && { textAlign: "right" }]}>
            {rtl ? "ملخص آراء العملاء" : "Customer Insight"}
          </Text>
          {insightParts.map((part, i) => (
            <View key={i} style={[perfStyles.insightRow, { backgroundColor: part.startsWith("💪") ? "#D1FAE5" : "#FFE8D6" }, rtl && { flexDirection: "row-reverse" }]}>
              <Text style={[perfStyles.insightText, rtl && { textAlign: "right" }]}>{part}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={perfStyles.pill}>
      <Text style={perfStyles.pillVal}>{value}</Text>
      <Text style={perfStyles.pillLabel}>{label}</Text>
    </View>
  );
}

const perfStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    gap: 10,
  },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  scoreNum: { fontSize: 13, fontWeight: "800" },
  barBg: { height: 7, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  pillRow: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1, backgroundColor: "#F9FAFB", borderRadius: 10,
    alignItems: "center", paddingVertical: 8,
  },
  pillVal: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  pillLabel: { fontSize: 10, color: Colors.grayMedium, marginTop: 2 },
  insightBox: { gap: 6 },
  insightTitle: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },
  insightRow: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  insightText: { fontSize: 12, fontWeight: "500", color: Colors.grayDark },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  storeIconWrap: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  storeIconText: { fontSize: 26 },
  storeName: { fontSize: 17, fontWeight: "800", color: Colors.grayDark, maxWidth: 180 },
  skeletonName: { height: 18, width: 120, borderRadius: 8, backgroundColor: Colors.grayLight, marginBottom: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  badgeRowRTL: { flexDirection: "row-reverse" },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#f0fdf4", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: Colors.greenMain },
  bizType: { fontSize: 12, color: Colors.grayMedium, fontWeight: "500" },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },

  tabBar: {
    flexDirection: "row", marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.grayLight, overflow: "hidden",
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 10,
  },
  tabItemActive: { backgroundColor: Colors.orangeLight },
  tabLabel: { fontSize: 11, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange },

  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  tabContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100, gap: Spacing.md },
  tabPane: { gap: Spacing.md },

  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 18,
    padding: Spacing.md, gap: 4, alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  statLabel: { fontSize: 11, color: Colors.grayMedium, lineHeight: 14 },

  // Karam card
  karamCard: {
    backgroundColor: "#f0fdf4", borderRadius: 18, padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.greenLight,
  },
  karamHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  karamHeaderRTL: { flexDirection: "row-reverse" },
  karamIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.greenLight,
    alignItems: "center", justifyContent: "center",
  },
  karamTitle: { fontSize: 15, fontWeight: "800", color: Colors.greenMain },
  karamStats: { flexDirection: "row", alignItems: "center" },
  karamStatsRTL: { flexDirection: "row-reverse" },
  karamStat: { flex: 1, alignItems: "center", gap: 2 },
  karamStatValue: { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  karamStatLabel: { fontSize: 11, color: Colors.grayMedium },
  karamStatDivider: { width: 1, height: 32, backgroundColor: Colors.greenLight },
  karamActions: { flexDirection: "row", gap: 10 },
  karamActionsRTL: { flexDirection: "row-reverse" },
  karamBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  karamBtnSponsor: { backgroundColor: Colors.greenMain },
  karamBtnClaim: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.greenMain },
  karamBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },

  infoCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: Spacing.lg, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoCardTitle: { fontSize: 13, fontWeight: "700", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.6 },
  infoCardBody: { fontSize: 14, color: Colors.grayDark, lineHeight: 21 },

  metaRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  metaRowRTL: { flexDirection: "row-reverse" },
  metaText: { flex: 1, fontSize: 13, color: Colors.grayDark, lineHeight: 18 },

  emptyPane: { alignItems: "center", paddingTop: 48, gap: Spacing.md },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },

  listingCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  listingInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: 12 },
  listingInnerRTL: { flexDirection: "row-reverse" },
  listingIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  listingBody: { flex: 1, gap: 4 },
  listingTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  listingMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  listingMetaRTL: { flexDirection: "row-reverse" },
  listingMetaText: { fontSize: 12, color: Colors.grayMedium },
  listingPrice: { fontSize: 15, fontWeight: "800", color: Colors.primaryOrange },
  listingActions: { alignItems: "center", gap: 6 },
  actionIconBtn: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  soldOutBtn: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    minWidth: 60, alignItems: "center",
  },
  soldOutBtnText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  deleteIconBtn: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: "#fef2f2", alignItems: "center", justifyContent: "center",
  },

  orderCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  orderCardInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: 12 },
  orderCardInnerRTL: { flexDirection: "row-reverse" },
  orderStatusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  orderBody: { flex: 1, gap: 3 },
  orderTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  orderMeta: { fontSize: 12, color: Colors.grayMedium, lineHeight: 16 },
  orderStatusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  orderStatusText: { fontSize: 11, fontWeight: "700" },

  loadMoreBtn: {
    alignItems: "center", paddingVertical: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  loadMoreText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },

  settingsField: { gap: 6, marginBottom: 4 },
  settingsFieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  settingsInput: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    borderRadius: 14, paddingHorizontal: Spacing.md, paddingVertical: 13,
    fontSize: 15, color: Colors.grayDark,
  },
  settingsInputMulti: { minHeight: 90, paddingTop: 12 },

  successBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f0fdf4", borderRadius: 12, padding: Spacing.md,
  },
  successBannerText: { fontSize: 13, fontWeight: "600", color: Colors.greenMain },
  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 12, padding: Spacing.md,
  },
  errorBannerText: { fontSize: 13, color: "#ef4444", flex: 1 },

  saveBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 16,
    paddingVertical: 16, alignItems: "center", marginTop: Spacing.md,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },

  // Status pill (shared)
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  // Settings
  settingsField: { gap: 6 },
  settingsLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  settingsInput: {
    backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.grayLight, paddingHorizontal: Spacing.md,
    height: 48, fontSize: 14, color: Colors.grayDark,
  },
  settingsTextArea: { height: 88, paddingTop: 12 },
  rtlInput: { textAlign: "right" },

  bizTypeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bizTypeRowRTL: { flexDirection: "row-reverse" },
  bizTypeChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  bizTypeChipActive: { backgroundColor: Colors.orangeLight, borderColor: Colors.primaryOrange },
  bizTypeChipText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  bizTypeChipTextActive: { color: Colors.primaryOrange },

  settingsMsg: { borderRadius: 10, padding: 12 },
  settingsMsgSuccess: { backgroundColor: Colors.greenLight },
  settingsMsgError: { backgroundColor: "#fef2f2" },
  settingsMsgText: { fontSize: 13, fontWeight: "600", color: Colors.grayDark },

  saveBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  saveBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  karamToggleCard: {
    backgroundColor: "#f0fdf4", borderRadius: 16, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.greenLight,
  },
  karamToggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  karamToggleRowRTL: { flexDirection: "row-reverse" },
  karamToggleInfo: { flex: 1, gap: 2 },
  karamToggleTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  karamToggleSub: { fontSize: 12, color: Colors.grayMedium, lineHeight: 17 },

  switchBuyerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
  },
  switchBuyerBtnText: { fontSize: 14, fontWeight: "700", color: Colors.primaryOrange },

  // FAB
  fab: {
    position: "absolute", bottom: 28,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  fabLTR: { right: 24 },
  fabRTL: { left: 24 },

  // Donate modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    backgroundColor: Colors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalHeaderRTL: { flexDirection: "row-reverse" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  modalSub: { fontSize: 13, color: Colors.grayMedium },
  modalLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  chipScroll: { flexGrow: 0 },
  chip: {
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, backgroundColor: Colors.white,
  },
  chipSelected: { borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight },
  chipText: { fontSize: 13, color: Colors.grayMedium, fontWeight: "600" },
  chipTextSelected: { color: Colors.primaryOrange },
  donateConfirmBtn: {
    backgroundColor: Colors.greenMain, borderRadius: 14, paddingVertical: 14,
    alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 4,
  },
  donateConfirmBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});
