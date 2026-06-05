import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, Platform, Switch,
  TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
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
  deleteListing, getSellerOrders, updateSellerProfile,
  createDonation, updateKaramParticipation,
  sponsorKaramMealAsSeller, claimKaramMeal,
  getMySellerDonations,
} from "../../services/seller/seller.service";
import type { SellerListing, SellerOrder, SellerDonation } from "../../services/seller/seller.service";
import { fetchSellerKaramBalance } from "../../services/shared/community.service";

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

interface KaramBalance { sponsored: number; claimed: number; available: number }
interface Charity { id: string; name: string }

type Tab = "overview" | "listings" | "orders" | "donations" | "settings";
type OrderFilter = "RESERVED" | "COMPLETED" | "CANCELLED";

// ─── Config ───────────────────────────────────────────────────────────────────

const ORDER_STATUS_CONFIG: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  RESERVED:  { en: "Reserved",  ar: "محجوز",       color: Colors.primaryOrange, bg: Colors.orangeLight },
  COMPLETED: { en: "Picked Up", ar: "تم الاستلام",  color: Colors.greenMain,     bg: Colors.greenLight  },
  CANCELLED: { en: "Cancelled", ar: "ملغى",          color: "#ef4444",            bg: "#fef2f2"          },
  DONATED:   { en: "Donated",   ar: "تبرع",         color: "#8b5cf6",            bg: "#ede9fe"          },
};

const DONATION_STATUS_CONFIG: Record<string, { en: string; ar: string; color: string; bg: string }> = {
  PENDING:   { en: "Pending",   ar: "قيد الانتظار", color: Colors.primaryOrange, bg: Colors.orangeLight },
  PICKED_UP: { en: "Picked Up", ar: "تم الاستلام",  color: "#8b5cf6",            bg: "#ede9fe"          },
  CONFIRMED: { en: "Confirmed", ar: "مؤكد",          color: Colors.greenMain,     bg: Colors.greenLight  },
  CANCELLED: { en: "Cancelled", ar: "ملغى",          color: "#ef4444",            bg: "#fef2f2"          },
};

const BIZ_TYPES = [
  { value: "RESTAURANT", en: "Restaurant", ar: "مطعم"   },
  { value: "BAKERY",     en: "Bakery",     ar: "مخبزة"  },
  { value: "MARKET",     en: "Market",     ar: "سوق"    },
  { value: "GROCERY",    en: "Grocery",    ar: "بقالة"  },
] as const;

const BUSINESS_TYPE_LABELS:    Record<string, string> = { RESTAURANT: "Restaurant", MARKET: "Market", BAKERY: "Bakery", GROCERY: "Grocery" };
const BUSINESS_TYPE_LABELS_AR: Record<string, string> = { RESTAURANT: "مطعم", MARKET: "سوق", BAKERY: "مخبزة", GROCERY: "بقالة" };

interface SellerDashboardScreenProps {
  onLogout?: () => void;
  onCreateListing?: () => void;
  onEditListing?: (listing: SellerListing) => void;
  refreshKey?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerDashboardScreen({
  onLogout,
  onCreateListing,
  onEditListing,
  refreshKey,
}: SellerDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();
  const { switchToBuyerMode } = useAuthContext();

  const [activeTab,       setActiveTab]       = useState<Tab>("overview");
  const [profile,         setProfile]         = useState<SellerProfile | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [fetchError,      setFetchError]      = useState("");

  // Listings
  const [listings,        setListings]        = useState<SellerListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError,   setListingsError]   = useState("");
  const [soldOutLoading,  setSoldOutLoading]  = useState<string | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState<string | null>(null);

  // Orders
  const [orders,          setOrders]          = useState<SellerOrder[]>([]);
  const [ordersLoading,   setOrdersLoading]   = useState(false);
  const [ordersError,     setOrdersError]     = useState("");
  const [ordersFilter,    setOrdersFilter]    = useState<OrderFilter>("RESERVED");

  // Donations history
  const [donations,       setDonations]       = useState<SellerDonation[]>([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError,  setDonationsError]  = useState("");

  // Karam
  const [karamBalance,    setKaramBalance]    = useState<KaramBalance | null>(null);
  const [karamActing,     setKaramActing]     = useState<"sponsor" | "claim" | null>(null);
  const [karamToggling,   setKaramToggling]   = useState(false);

  // Settings
  const [settingsDesc,    setSettingsDesc]    = useState("");
  const [settingsBizType, setSettingsBizType] = useState<SellerProfile["businessType"]>("RESTAURANT");
  const [settingsPhone,   setSettingsPhone]   = useState("");
  const [settingsWebsite, setSettingsWebsite] = useState("");
  const [settingsSocial,  setSettingsSocial]  = useState("");
  const [settingsAddress, setSettingsAddress] = useState("");
  const [settingsHours,   setSettingsHours]   = useState("");
  const [settingsKaram,   setSettingsKaram]   = useState(false);
  const [settingsSaving,  setSettingsSaving]  = useState(false);
  const [settingsMsg,     setSettingsMsg]     = useState("");

  // Donate surplus modal
  const [donateModal,     setDonateModal]     = useState(false);
  const [charities,       setCharities]       = useState<Charity[]>([]);
  const [charitiesLoading, setCharitiesLoading] = useState(false);
  const [selectedCharity, setSelectedCharity] = useState<Charity | null>(null);
  const [selectedListing, setSelectedListing] = useState<SellerListing | null>(null);
  const [donateQty,       setDonateQty]       = useState("1");
  const [donating,        setDonating]        = useState(false);

  // ─── Data fetchers ──────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError("");
    try {
      const { data } = await api.get("/api/sellers/me");
      setProfile(data.data as SellerProfile);
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
      setKaramBalance(bal.today ?? bal as unknown as KaramBalance);
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

  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError("");
    try {
      const data = await getSellerOrders();
      setOrders(data);
    } catch {
      setOrdersError(rtl ? "تعذّر تحميل الطلبات" : "Could not load orders");
    } finally {
      setOrdersLoading(false);
    }
  }, [rtl]);

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

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (profile?.participatesInKaram && profile?.id) {
      fetchKaramBalance(profile.id);
    }
  }, [profile?.id, profile?.participatesInKaram, fetchKaramBalance]);

  useEffect(() => { if (activeTab === "listings") fetchListings(); }, [activeTab, fetchListings]);
  useEffect(() => { if (activeTab === "orders") fetchOrders(); }, [activeTab, fetchOrders]);
  useEffect(() => { if (activeTab === "donations") fetchDonations(); }, [activeTab, fetchDonations]);
  useEffect(() => { if (refreshKey && activeTab === "listings") fetchListings(); }, [refreshKey, activeTab, fetchListings]);

  // Pre-populate settings on first profile load
  useEffect(() => {
    if (profile) {
      setSettingsDesc(profile.description ?? "");
      setSettingsBizType(profile.businessType ?? "RESTAURANT");
      setSettingsPhone(profile.contactInfo?.phone ?? "");
      setSettingsWebsite(profile.contactInfo?.website ?? "");
      setSettingsSocial(profile.contactInfo?.socialMedia ?? "");
      setSettingsAddress(profile.location?.address ?? "");
      setSettingsHours(profile.operatingHours ?? "");
      setSettingsKaram(profile.participatesInKaram ?? false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!profile]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    setSettingsMsg("");
    try {
      const body: Parameters<typeof updateSellerProfile>[0] = {};
      if (settingsDesc)    body.description    = settingsDesc;
      if (settingsBizType) body.businessType   = settingsBizType;
      if (settingsHours)   body.operatingHours = settingsHours;

      const contactInfo: NonNullable<typeof body.contactInfo> = {};
      if (settingsPhone)   contactInfo.phone       = settingsPhone;
      if (settingsWebsite) contactInfo.website     = settingsWebsite;
      if (settingsSocial)  contactInfo.socialMedia = settingsSocial;
      if (Object.keys(contactInfo).length > 0) body.contactInfo = contactInfo;

      if (settingsAddress) {
        body.location = {
          address:   settingsAddress,
          latitude:  profile?.location?.latitude  ?? 0,
          longitude: profile?.location?.longitude ?? 0,
        };
      }

      await updateSellerProfile(body);
      setProfile((prev) =>
        prev ? {
          ...prev,
          description:    settingsDesc || prev.description,
          businessType:   settingsBizType,
          operatingHours: settingsHours || prev.operatingHours,
          contactInfo: {
            ...prev.contactInfo,
            phone:       settingsPhone   || prev.contactInfo?.phone,
            website:     settingsWebsite || prev.contactInfo?.website,
            socialMedia: settingsSocial  || prev.contactInfo?.socialMedia,
          },
          location: settingsAddress ? {
            ...prev.location,
            address: settingsAddress,
          } : prev.location,
        } : prev
      );
      setSettingsMsg(rtl ? "✓ تم حفظ الإعدادات!" : "✓ Settings saved!");
      setTimeout(() => setSettingsMsg(""), 3000);
    } catch {
      setSettingsMsg(rtl ? "تعذّر حفظ الإعدادات. يرجى المحاولة مجدداً." : "Could not save settings. Please try again.");
    } finally {
      setSettingsSaving(false);
    }
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

  const handleDonate = async () => {
    if (!selectedCharity || !selectedListing) return;
    const qty = parseInt(donateQty, 10);
    if (!qty || qty < 1) return;
    setDonating(true);
    try {
      await createDonation({ listingId: selectedListing.id, charityId: selectedCharity.id, quantity: qty });
      setDonateModal(false);
      setSelectedCharity(null);
      setSelectedListing(null);
      setDonateQty("1");
      Alert.alert(rtl ? "تم!" : "Done!", rtl ? "تم إرسال التبرع بنجاح!" : "Donation sent successfully!");
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر إرسال التبرع" : "Could not send donation");
    } finally {
      setDonating(false);
    }
  };

  // ─── Tabs + stats ────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string; labelAr: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "overview",   label: "Overview",  labelAr: "نظرة عامة", icon: "grid"         },
    { key: "listings",   label: "Listings",  labelAr: "القوائم",   icon: "package"      },
    { key: "orders",     label: "Orders",    labelAr: "الطلبات",   icon: "shopping-bag" },
    { key: "donations",  label: "Donated",   labelAr: "التبرعات",  icon: "gift"         },
    { key: "settings",   label: "Settings",  labelAr: "الإعدادات", icon: "settings"     },
  ];

  const STATS = [
    { icon: "package"       as const, color: Colors.primaryOrange, label: rtl ? "الإعلانات النشطة" : "Active Listings",    value: profile?.activeListingsCount  ?? 0 },
    { icon: "shopping-bag"  as const, color: "#8b5cf6",            label: rtl ? "طلبات هذا الشهر"  : "This Month",         value: profile?.currentMonthOrders   ?? 0 },
    { icon: "check-circle"  as const, color: Colors.greenMain,     label: rtl ? "طلبات مكتملة"     : "Completed Orders",   value: profile?.totalOrdersCompleted ?? 0 },
  ];

  const filteredOrders = orders.filter((o) => o.status === ordersFilter);

  // ─── Render ──────────────────────────────────────────────────────────────────

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
            <Feather
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? Colors.primaryOrange : Colors.grayMedium}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]} numberOfLines={1}>
              {rtl ? tab.labelAr : tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── Loading / error ── */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{rtl ? "جاري التحميل…" : "Loading…"}</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.centeredState}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProfile()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor={Colors.primaryOrange} />}
        >

          {/* ══════════ OVERVIEW TAB ══════════ */}
          {activeTab === "overview" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
              {/* Stats */}
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

              {/* Karam card */}
              {profile?.participatesInKaram && (
                <View style={styles.karamCard}>
                  <View style={[styles.karamHeader, rtl && styles.karamHeaderRTL]}>
                    <View style={styles.karamIconWrap}>
                      <Feather name="heart" size={16} color={Colors.greenMain} />
                    </View>
                    <Text style={[styles.karamTitle, rtl && styles.rtl]}>
                      {rtl ? "برنامج كرم 🤝" : "Karam Program 🤝"}
                    </Text>
                  </View>
                  <View style={[styles.karamStats, rtl && styles.karamStatsRTL]}>
                    <View style={styles.karamStat}>
                      <Text style={styles.karamStatValue}>{karamBalance?.sponsored ?? 0}</Text>
                      <Text style={[styles.karamStatLabel, rtl && styles.rtl]}>{rtl ? "ممولة" : "Sponsored"}</Text>
                    </View>
                    <View style={styles.karamStatDivider} />
                    <View style={styles.karamStat}>
                      <Text style={styles.karamStatValue}>{karamBalance?.claimed ?? 0}</Text>
                      <Text style={[styles.karamStatLabel, rtl && styles.rtl]}>{rtl ? "مُستلمة" : "Claimed"}</Text>
                    </View>
                    <View style={styles.karamStatDivider} />
                    <View style={styles.karamStat}>
                      <Text style={[styles.karamStatValue, { color: Colors.greenMain }]}>{karamBalance?.available ?? 0}</Text>
                      <Text style={[styles.karamStatLabel, rtl && styles.rtl]}>{rtl ? "متاحة" : "Available"}</Text>
                    </View>
                  </View>
                  <View style={[styles.karamActions, rtl && styles.karamActionsRTL]}>
                    <TouchableOpacity
                      style={[styles.karamBtn, styles.karamBtnSponsor]}
                      onPress={handleSponsorKaram}
                      disabled={karamActing !== null}
                      activeOpacity={0.8}
                    >
                      {karamActing === "sponsor"
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Text style={styles.karamBtnText}>{rtl ? "مول وجبة 💚" : "Sponsor Meal 💚"}</Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.karamBtn, styles.karamBtnClaim]}
                      onPress={handleClaimKaram}
                      disabled={karamActing !== null}
                      activeOpacity={0.8}
                    >
                      {karamActing === "claim"
                        ? <ActivityIndicator size="small" color={Colors.greenMain} />
                        : <Text style={[styles.karamBtnText, { color: Colors.greenMain }]}>{rtl ? "وجبة مُستلمة" : "Mark Claimed"}</Text>
                      }
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* About card */}
              {profile?.description && (
                <View style={styles.infoCard}>
                  <Text style={[styles.infoCardTitle, rtl && styles.rtl]}>{rtl ? "عن المتجر" : "About"}</Text>
                  <Text style={[styles.infoCardBody, rtl && styles.rtl]}>{profile.description}</Text>
                </View>
              )}

              {/* Location */}
              {profile?.location?.address && (
                <View style={[styles.metaRow, rtl && styles.metaRowRTL]}>
                  <Feather name="map-pin" size={14} color={Colors.primaryOrange} />
                  <Text style={[styles.metaText, rtl && styles.rtl]} numberOfLines={2}>{profile.location.address}</Text>
                </View>
              )}

              {/* Phone */}
              {profile?.contactInfo?.phone && (
                <View style={[styles.metaRow, rtl && styles.metaRowRTL]}>
                  <Feather name="phone" size={14} color={Colors.primaryOrange} />
                  <Text style={[styles.metaText, rtl && styles.rtl]}>{profile.contactInfo.phone}</Text>
                </View>
              )}

              {/* Donate surplus button */}
              <TouchableOpacity
                style={styles.donateSurplusBtn}
                onPress={() => { fetchCharities(); setDonateModal(true); }}
                activeOpacity={0.85}
              >
                <Feather name="gift" size={18} color={Colors.white} />
                <Text style={styles.donateSurplusBtnText}>{rtl ? "تبرع بالفائض" : "Donate Surplus Food"}</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* ══════════ LISTINGS TAB ══════════ */}
          {activeTab === "listings" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
              {listingsLoading ? (
                <View style={styles.centeredState}>
                  <ActivityIndicator color={Colors.primaryOrange} size="large" />
                </View>
              ) : listingsError ? (
                <View style={styles.centeredState}>
                  <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
                  <Text style={[styles.stateText, rtl && styles.rtl]}>{listingsError}</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={fetchListings} activeOpacity={0.8}>
                    <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                  </TouchableOpacity>
                </View>
              ) : listings.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>📦</Text>
                  <Text style={[styles.emptyTitle, rtl && styles.rtl]}>{rtl ? "لا توجد قوائم" : "No listings yet"}</Text>
                  <Text style={[styles.emptySub, rtl && styles.rtl]}>
                    {rtl ? "اضغط على + لإضافة أول قائمة" : "Tap + to add your first listing"}
                  </Text>
                </View>
              ) : (
                listings.map((listing) => (
                  <View key={listing.id} style={styles.listingCard}>
                    <View style={[styles.listingInner, rtl && styles.listingInnerRTL]}>
                      <View style={styles.listingIconWrap}>
                        <Feather name="package" size={18} color={Colors.primaryOrange} />
                      </View>
                      <View style={styles.listingBody}>
                        <Text style={[styles.listingTitle, rtl && styles.rtl]} numberOfLines={1}>{listing.title}</Text>
                        {listing.pickupStart && listing.pickupEnd && (
                          <View style={[styles.listingMeta, rtl && styles.listingMetaRTL]}>
                            <Feather name="clock" size={12} color={Colors.grayMedium} />
                            <Text style={styles.listingMetaText}>{listing.pickupStart} – {listing.pickupEnd}</Text>
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
                            : <Text style={styles.soldOutBtnText}>{rtl ? "نفد" : "Sold Out"}</Text>
                          }
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteIconBtn}
                          onPress={() => handleDeleteListing(listing.id, listing.title)}
                          disabled={deleteLoading === listing.id}
                          activeOpacity={0.8}
                        >
                          {deleteLoading === listing.id
                            ? <ActivityIndicator size="small" color="#ef4444" />
                            : <Feather name="trash-2" size={14} color="#ef4444" />
                          }
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </Animated.View>
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
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>

              {/* Business name — read-only */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "اسم المتجر" : "Business Name"}</Text>
                <View style={[styles.settingsInput, { justifyContent: "center", opacity: 0.7 }]}>
                  <Text style={[{ fontSize: 14, color: Colors.grayMedium }, rtl && styles.rtl]}>{profile?.businessName ?? "—"}</Text>
                </View>
                <Text style={[{ fontSize: 11, color: Colors.grayMedium, marginTop: 3 }, rtl && styles.rtl]}>
                  {rtl ? "لا يمكن تغيير اسم المتجر. تواصل مع الدعم." : "Business name cannot be changed. Contact support."}
                </Text>
              </View>

              {/* Business type */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "نوع المتجر" : "Business Type"}</Text>
                <View style={[styles.bizTypeRow, rtl && styles.bizTypeRowRTL]}>
                  {BIZ_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt.value}
                      style={[styles.bizTypeChip, settingsBizType === bt.value && styles.bizTypeChipActive]}
                      onPress={() => setSettingsBizType(bt.value)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.bizTypeChipText, settingsBizType === bt.value && styles.bizTypeChipTextActive]}>
                        {rtl ? bt.ar : bt.en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "الوصف" : "Description"}</Text>
                <TextInput
                  style={[styles.settingsInput, styles.settingsTextArea, rtl && styles.rtlInput]}
                  value={settingsDesc}
                  onChangeText={setSettingsDesc}
                  placeholder={rtl ? "صف متجرك…" : "Describe your store…"}
                  placeholderTextColor={Colors.grayMedium}
                  multiline
                  numberOfLines={3}
                  textAlign={rtl ? "right" : "left"}
                  textAlignVertical="top"
                />
              </View>

              {/* Phone */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "رقم التواصل" : "Contact Phone"}</Text>
                <TextInput
                  style={[styles.settingsInput, rtl && styles.rtlInput]}
                  value={settingsPhone}
                  onChangeText={setSettingsPhone}
                  placeholder="0590000000"
                  placeholderTextColor={Colors.grayMedium}
                  keyboardType="phone-pad"
                  textAlign={rtl ? "right" : "left"}
                />
              </View>

              {/* Website */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "الموقع الإلكتروني" : "Website"}</Text>
                <TextInput
                  style={[styles.settingsInput, rtl && styles.rtlInput]}
                  value={settingsWebsite}
                  onChangeText={setSettingsWebsite}
                  placeholder="https://..."
                  placeholderTextColor={Colors.grayMedium}
                  keyboardType="url"
                  autoCapitalize="none"
                  textAlign={rtl ? "right" : "left"}
                />
              </View>

              {/* Social Media */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "السوشيال ميديا" : "Social Media"}</Text>
                <TextInput
                  style={[styles.settingsInput, rtl && styles.rtlInput]}
                  value={settingsSocial}
                  onChangeText={setSettingsSocial}
                  placeholder="@handle"
                  placeholderTextColor={Colors.grayMedium}
                  autoCapitalize="none"
                  textAlign={rtl ? "right" : "left"}
                />
              </View>

              {/* Address */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "العنوان" : "Address"}</Text>
                <TextInput
                  style={[styles.settingsInput, rtl && styles.rtlInput]}
                  value={settingsAddress}
                  onChangeText={setSettingsAddress}
                  placeholder={rtl ? "شارع، مدينة" : "Street, City"}
                  placeholderTextColor={Colors.grayMedium}
                  textAlign={rtl ? "right" : "left"}
                />
              </View>

              {/* Operating Hours */}
              <View style={styles.settingsField}>
                <Text style={[styles.settingsLabel, rtl && styles.rtl]}>{rtl ? "ساعات العمل" : "Operating Hours"}</Text>
                <TextInput
                  style={[styles.settingsInput, rtl && styles.rtlInput]}
                  value={settingsHours}
                  onChangeText={setSettingsHours}
                  placeholder={rtl ? "9 ص – 10 م يومياً" : "9 AM – 10 PM daily"}
                  placeholderTextColor={Colors.grayMedium}
                  textAlign={rtl ? "right" : "left"}
                />
              </View>

              {/* Save message */}
              {settingsMsg ? (
                <View style={[styles.settingsMsg, settingsMsg.startsWith("✓") ? styles.settingsMsgSuccess : styles.settingsMsgError]}>
                  <Text style={[styles.settingsMsgText, rtl && styles.rtl]}>{settingsMsg}</Text>
                </View>
              ) : null}

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, settingsSaving && { opacity: 0.6 }]}
                onPress={handleSaveSettings}
                disabled={settingsSaving}
                activeOpacity={0.85}
              >
                {settingsSaving
                  ? <ActivityIndicator size="small" color={Colors.white} />
                  : <Text style={styles.saveBtnText}>{rtl ? "حفظ التغييرات" : "Save Changes"}</Text>
                }
              </TouchableOpacity>

              {/* Karam toggle */}
              <View style={styles.karamToggleCard}>
                <View style={[styles.karamToggleRow, rtl && styles.karamToggleRowRTL]}>
                  <View style={[styles.karamToggleInfo, rtl && { alignItems: "flex-end" }]}>
                    <Text style={[styles.karamToggleTitle, rtl && styles.rtl]}>
                      {rtl ? "أشارك في برنامج كرم" : "Participate in Karam"}
                    </Text>
                    <Text style={[styles.karamToggleSub, rtl && styles.rtl]}>
                      {rtl
                        ? "يتيح للمشترين تمويل وجبات لمن يحتاج"
                        : "Let buyers sponsor meals for those in need"}
                    </Text>
                  </View>
                  {karamToggling
                    ? <ActivityIndicator size="small" color={Colors.greenMain} />
                    : <Switch
                        value={settingsKaram}
                        onValueChange={handleKaramToggle}
                        trackColor={{ false: Colors.grayLight, true: Colors.greenMain }}
                        thumbColor={Colors.white}
                      />
                  }
                </View>
              </View>

              {/* Switch to buyer mode */}
              <TouchableOpacity
                style={styles.switchBuyerBtn}
                onPress={switchToBuyerMode}
                activeOpacity={0.85}
              >
                <Feather name="shopping-bag" size={18} color={Colors.primaryOrange} />
                <Text style={styles.switchBuyerBtnText}>{rtl ? "تصفح كمشتري 🛍️" : "Browse as Buyer 🛍️"}</Text>
              </TouchableOpacity>

            </Animated.View>
          )}

        </ScrollView>
      )}

      {/* ── Donate Surplus Modal ── */}
      <Modal visible={donateModal} transparent animationType="slide" onRequestClose={() => setDonateModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDonateModal(false)} />
        <View style={styles.modalSheet}>
          <View style={[styles.modalHeader, rtl && styles.modalHeaderRTL]}>
            <Text style={[styles.modalTitle, rtl && styles.rtl]}>{rtl ? "تبرع بالفائض" : "Donate Surplus Food"}</Text>
            <TouchableOpacity onPress={() => setDonateModal(false)}>
              <Feather name="x" size={22} color={Colors.grayDark} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSub, rtl && styles.rtl]}>{rtl ? "اختر جمعية خيرية وقائمة للتبرع" : "Select a charity and listing"}</Text>

          <Text style={[styles.modalLabel, rtl && styles.rtl]}>{rtl ? "القائمة" : "Listing"}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {listings.map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.chip, selectedListing?.id === l.id && styles.chipSelected]}
                onPress={() => setSelectedListing(l)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, selectedListing?.id === l.id && styles.chipTextSelected]} numberOfLines={1}>{l.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.modalLabel, rtl && styles.rtl]}>{rtl ? "الجمعية الخيرية" : "Charity"}</Text>
          {charitiesLoading ? (
            <ActivityIndicator color={Colors.primaryOrange} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {charities.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.chip, selectedCharity?.id === c.id && styles.chipSelected]}
                  onPress={() => setSelectedCharity(c)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, selectedCharity?.id === c.id && styles.chipTextSelected]} numberOfLines={1}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <Text style={[styles.modalLabel, rtl && styles.rtl]}>{rtl ? "الكمية" : "Quantity"}</Text>
          <TextInput
            style={[styles.settingsInput, rtl && styles.rtlInput]}
            value={donateQty}
            onChangeText={setDonateQty}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={Colors.grayMedium}
            textAlign={rtl ? "right" : "left"}
          />

          <TouchableOpacity
            style={[styles.donateConfirmBtn, (!selectedCharity || !selectedListing || donating) && { opacity: 0.5 }]}
            onPress={handleDonate}
            disabled={!selectedCharity || !selectedListing || donating}
            activeOpacity={0.85}
          >
            {donating
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <>
                  <Feather name="gift" size={16} color={Colors.white} />
                  <Text style={styles.donateConfirmBtnText}>{rtl ? "تبرع الآن" : "Donate Now"}</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── FAB: Add listing ── */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  // Header
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

  // Tab bar
  tabBar: {
    flexDirection: "row", marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.grayLight, overflow: "hidden",
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 3, paddingVertical: 10,
  },
  tabItemActive: { backgroundColor: Colors.orangeLight },
  tabLabel: { fontSize: 10, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange },

  // States
  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 60 },
  stateText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  tabContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.md },
  tabPane: { gap: Spacing.md },

  emptyState: { paddingTop: 60, alignItems: "center", gap: Spacing.sm },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },

  // Overview
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 18, padding: Spacing.md, gap: 4,
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

  donateSurplusBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.greenMain, borderRadius: 14, paddingVertical: 13, marginTop: 4,
  },
  donateSurplusBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  // Listings
  listingCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  listingInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: 12 },
  listingInnerRTL: { flexDirection: "row-reverse" },
  listingIconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  listingBody: { flex: 1, gap: 4 },
  listingTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  listingMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  listingMetaRTL: { flexDirection: "row-reverse" },
  listingMetaText: { fontSize: 12, color: Colors.grayMedium },
  listingPrice: { fontSize: 15, fontWeight: "800", color: Colors.primaryOrange },
  listingActions: { alignItems: "center", gap: 6 },
  actionIconBtn: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  soldOutBtn: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    minWidth: 60, alignItems: "center",
  },
  soldOutBtnText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  deleteIconBtn: {
    width: 30, height: 30, borderRadius: 9, backgroundColor: "#fef2f2",
    alignItems: "center", justifyContent: "center",
  },

  // Orders
  filterRow: { flexDirection: "row", gap: 8 },
  filterRowRTL: { flexDirection: "row-reverse" },
  filterPill: {
    flex: 1, borderRadius: 12, paddingVertical: 9, alignItems: "center",
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  filterPillActive: { backgroundColor: Colors.orangeLight, borderColor: Colors.primaryOrange },
  filterPillText: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },
  filterPillTextActive: { color: Colors.primaryOrange },

  orderCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  orderInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  orderInnerRTL: { flexDirection: "row-reverse" },
  orderIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  orderBody: { flex: 1, gap: 2 },
  orderTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  orderSub: { fontSize: 12, color: Colors.grayMedium },
  orderPrice: { fontSize: 14, fontWeight: "800", color: Colors.primaryOrange, marginTop: 6 },

  // Donations history
  donationCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  donationInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  donationInnerRTL: { flexDirection: "row-reverse" },
  donationIconWrap: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.greenLight,
    alignItems: "center", justifyContent: "center",
  },
  donationBody: { flex: 1, gap: 2 },
  donationTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  donationSub: { fontSize: 12, color: Colors.grayMedium },

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
