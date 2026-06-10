import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet, Text, View, Platform, TextInput, Image,
  TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert,
  KeyboardAvoidingView, Modal, Share, Linking,
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
import * as Location from "expo-location";
import { WebView } from "react-native-webview";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SellerProfile {
  id: string;
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY" | "GROCERY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  verifiedBadge?: boolean;
  description?: string;
  operatingHours?: string;
  // flat fields — actual backend response shape
  phone?: string;
  website?: string;
  socialMedia?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  // legacy nested fields (kept for backwards compat)
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

// ─── Location map HTML builder (WebView + Leaflet, no API key needed) ─────────

function buildLocationMapHtml(lat: number, lng: number): string {
  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%;background:#e8eaed}</style>
</head><body><div id="map"></div><script>
var marker=null;
var map=L.map('map',{center:[${lat},${lng}],zoom:15,zoomControl:false,attributionControl:false});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
function postPin(la,ln){window.ReactNativeWebView.postMessage(JSON.stringify({type:'pin',lat:la,lng:ln}));}
function placeMarker(la,ln){
  if(marker){marker.setLatLng([la,ln]);}
  else{marker=L.marker([la,ln],{draggable:true}).addTo(map);marker.on('dragend',function(){var p=marker.getLatLng();postPin(p.lat,p.lng);});}
  postPin(la,ln);
}
placeMarker(${lat},${lng});
map.on('click',function(e){placeMarker(e.latlng.lat,e.latlng.lng);map.panTo([e.latlng.lat,e.latlng.lng]);});
window.moveTo=function(la,ln){map.setView([la,ln],15,{animate:true});placeMarker(la,ln);};
</script></body></html>`;
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
  const [toastMessage,    setToastMessage]    = useState<string | null>(null);

  // ── Settings form state ───────────────────────────────────────────────────
  const [settingsForm,    setSettingsForm]    = useState<SettingsForm>({
    businessName: "", description: "", phone: "", website: "", socialMedia: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved,   setSettingsSaved]   = useState(false);
  const [settingsError,   setSettingsError]   = useState("");

  // ── Location editor state ─────────────────────────────────────────────────
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [editLatitude,     setEditLatitude]     = useState<number>(32.2211);
  const [editLongitude,    setEditLongitude]    = useState<number>(35.2544);
  const [editAddress,      setEditAddress]      = useState<string>("");
  const [savingLocation,   setSavingLocation]   = useState(false);
  const locationMapRef  = useRef<WebView>(null);
  const locationMapHtml = useRef<string>("");

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
        phone:        p.phone ?? p.contactInfo?.phone ?? "",
        website:      p.website ?? p.contactInfo?.website ?? "",
        socialMedia:  p.socialMedia ?? p.contactInfo?.socialMedia ?? "",
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
      setKaramBalance(bal as unknown as { sponsored: number; claimed: number; available: number });
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
  // fetchOrders omitted from deps intentionally — fetchOrders is stable (no page dep)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "orders") fetchOrders(true); }, [activeTab]);
  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { if (refreshKey && activeTab === "listings") fetchListings(); }, [refreshKey, activeTab, fetchListings]);

  // Pre-populate settings on first profile load
  useEffect(() => {
    if (profile) {
      setSettingsForm({
        businessName: profile.businessName ?? "",
        description:  profile.description  ?? "",
        phone:        profile.phone ?? profile.contactInfo?.phone ?? "",
        website:      profile.website ?? profile.contactInfo?.website ?? "",
        socialMedia:  profile.socialMedia ?? profile.contactInfo?.socialMedia ?? "",
      });
      setSettingsKaram(profile.participatesInKaram ?? false);
      const lat = profile.latitude ?? profile.location?.latitude ?? 32.2211;
      const lng = profile.longitude ?? profile.location?.longitude ?? 35.2544;
      setEditLatitude(lat);
      setEditLongitude(lng);
      setEditAddress(profile.address ?? profile.location?.address ?? "");
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

  // ─── Listing actions ───────────────────────────────────────────────────────

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleMarkSoldOut = (listingId: string) => {
    Alert.alert(
      "تحديد كنفد؟",
      "سيتم تحديد هذا الإدراج كنافد الكمية وسيظهر للمشترين كـ 'نفد'.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تأكيد",
          onPress: async () => {
            setSoldOutLoading(listingId);
            try {
              await api.patch(`/api/listings/${listingId}/sold-out`);
              setListings(prev =>
                prev.map(l => l.id === listingId ? { ...l, status: "SOLD_OUT" } : l)
              );
              showToast("تم تحديد الإدراج كنافد");
            } catch {
              Alert.alert(
                rtl ? "خطأ" : "Error",
                rtl ? "تعذّر تحديث حالة القائمة" : "Could not update listing status"
              );
            } finally {
              setSoldOutLoading(null);
            }
          },
        },
      ]
    );
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
        phone:        settingsForm.phone.trim()         || undefined,
        website:      settingsForm.website.trim()       || undefined,
        socialMedia:  settingsForm.socialMedia.trim()   || undefined,
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

  // ─── Location editor actions ───────────────────────────────────────────────

  const handleToggleLocationEditor = () => {
    if (!locationExpanded) {
      locationMapHtml.current = buildLocationMapHtml(editLatitude, editLongitude);
    }
    setLocationExpanded(prev => !prev);
  };

  const handleUseCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showToast(rtl ? "يرجى السماح بالوصول للموقع" : "Please allow location access");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setEditLatitude(lat);
      setEditLongitude(lng);
      locationMapRef.current?.injectJavaScript(`window.moveTo(${lat}, ${lng}); true;`);
    } catch {
      showToast(rtl ? "تعذّر تحديد موقعك الحالي" : "Could not detect your location");
    }
  };

  const handleSaveLocation = async () => {
    setSavingLocation(true);
    try {
      await api.patch("/api/sellers/me", {
        location: {
          latitude: editLatitude,
          longitude: editLongitude,
          address: editAddress.trim() || undefined,
        },
      });
      setProfile(prev => prev ? {
        ...prev,
        latitude:  editLatitude,
        longitude: editLongitude,
        address:   editAddress.trim() || prev.address,
      } : prev);
      setLocationExpanded(false);
      showToast(rtl ? "تم حفظ الموقع بنجاح 📍" : "Location saved 📍");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      showToast(apiErr.response?.data?.message ?? (rtl ? "فشل حفظ الموقع" : "Failed to save location"));
    } finally {
      setSavingLocation(false);
    }
  };

  // ─── Tabs config ───────────────────────────────────────────────────────────

  const TABS: { key: Tab; labelEn: string; labelAr: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "overview",  labelEn: "Overview",  labelAr: "عام",       icon: "grid"         },
    { key: "listings",  labelEn: "Listings",  labelAr: "القوائم",   icon: "package"      },
    { key: "orders",    labelEn: "Orders",    labelAr: "الطلبات",   icon: "shopping-bag" },
    { key: "settings",  labelEn: "Settings",  labelAr: "الإعدادات", icon: "settings"     },
  ];

  const confirmedDonationsCount = donations.filter(d => d.status === "CONFIRMED").length;

  const STATS = [
    { icon: "package" as const,  color: Colors.primaryOrange, label: rtl ? "الإعلانات النشطة" : "Active Listings",    value: profile?.activeListingsCount ?? 0 },
    { icon: "heart" as const,    color: Colors.greenMain,     label: rtl ? "إجمالي التبرعات"  : "Total Donations",     value: profile?.totalDonations ?? confirmedDonationsCount },
  ];

  const sellerLocation = (() => {
    if (!profile) return null;
    const lat = profile.latitude ?? profile.location?.latitude;
    const lng = profile.longitude ?? profile.location?.longitude;
    if (lat == null || lng == null) return null;
    return {
      address: profile.address ?? profile.location?.address ?? null,
      latitude: lat,
      longitude: lng,
    };
  })();

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
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { fetchProfile(true); fetchDonations(); }} tintColor={Colors.primaryOrange} />}
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
                <SellerLocationDisplay location={sellerLocation} />
                {(profile?.phone ?? profile?.contactInfo?.phone) ? (
                  <View style={[styles.metaRow, rtl && styles.metaRowRTL]}>
                    <Feather name="phone" size={14} color={Colors.primaryOrange} />
                    <Text style={[styles.metaText, rtl && styles.rtl]}>
                      {profile?.phone ?? profile?.contactInfo?.phone}
                    </Text>
                  </View>
                ) : null}
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
                    <SellerListingCard
                      key={listing.id}
                      listing={listing}
                      rtl={rtl}
                      onEdit={onEditListing}
                      onDelete={handleDeleteListing}
                      onDonate={onDonateFromListing}
                      onSoldOut={handleMarkSoldOut}
                      soldOutLoading={soldOutLoading}
                      deleteLoading={deleteLoading}
                    />
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
                    label={rtl ? "اسم المتجر" : "Store Name"}
                    value={settingsForm.businessName}
                    onChangeText={v => setSettingsForm(f => ({ ...f, businessName: v }))}
                    placeholder={rtl ? "مثال: مخبزة الفجر" : "e.g. Al-Fajr Bakery"}
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

                  {/* ── Location editor ── */}
                  <View style={styles.locationEditorCard}>
                    <TouchableOpacity
                      style={[styles.locationEditorHeader, rtl && { flexDirection: "row-reverse" }]}
                      onPress={handleToggleLocationEditor}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.locationEditorHeaderLeft, rtl && { flexDirection: "row-reverse" }]}>
                        <Feather name="map-pin" size={16} color={Colors.primaryOrange} />
                        <Text style={[styles.locationEditorLabel, rtl && styles.rtl]}>
                          {rtl ? "الموقع" : "Location"}
                        </Text>
                      </View>
                      <Text style={styles.locationEditorToggleBtn}>
                        {locationExpanded ? (rtl ? "↑ إغلاق" : "↑ Close") : (rtl ? "← تعديل" : "Edit →")}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.locationEditorCurrentAddr, rtl && styles.rtl]} numberOfLines={1}>
                      {editAddress || `${editLatitude.toFixed(4)}, ${editLongitude.toFixed(4)}`}
                    </Text>

                    {locationExpanded && (
                      <>
                        <View style={styles.locationEditorMapWrap}>
                          <WebView
                            ref={locationMapRef}
                            style={styles.locationEditorMap}
                            source={{ html: locationMapHtml.current }}
                            javaScriptEnabled
                            originWhitelist={["*"]}
                            onMessage={(event) => {
                              try {
                                const msg = JSON.parse(event.nativeEvent.data) as { type: string; lat: number; lng: number };
                                if (msg.type === "pin") {
                                  setEditLatitude(msg.lat);
                                  setEditLongitude(msg.lng);
                                }
                              } catch {}
                            }}
                            scrollEnabled={false}
                          />
                        </View>

                        <Text style={[styles.settingsFieldLabel, rtl && styles.rtl]}>
                          {rtl ? "العنوان" : "Address"}
                        </Text>
                        <TextInput
                          style={[styles.settingsInput, rtl && styles.rtl]}
                          value={editAddress}
                          onChangeText={setEditAddress}
                          placeholder={rtl ? "مثال: شارع فيصل، نابلس" : "e.g. Faisal Street, Nablus"}
                          placeholderTextColor={Colors.grayMedium}
                          textAlign={rtl ? "right" : "left"}
                        />

                        <TouchableOpacity
                          style={[styles.locationEditorGpsBtn, rtl && { flexDirection: "row-reverse" }]}
                          onPress={handleUseCurrentLocation}
                          activeOpacity={0.8}
                        >
                          <Feather name="navigation" size={15} color={Colors.primaryOrange} />
                          <Text style={styles.locationEditorGpsText}>
                            {rtl ? "استخدم موقعي الحالي" : "Use My Current Location"}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.locationEditorSaveBtn, savingLocation && { opacity: 0.6 }]}
                          onPress={handleSaveLocation}
                          disabled={savingLocation}
                          activeOpacity={0.85}
                        >
                          {savingLocation
                            ? <ActivityIndicator size="small" color={Colors.white} />
                            : (
                              <>
                                <Feather name="check" size={16} color={Colors.white} />
                                <Text style={styles.locationEditorSaveBtnText}>
                                  {rtl ? "حفظ الموقع" : "Save Location"}
                                </Text>
                              </>
                            )}
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

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

      {/* Toast overlay */}
      {toastMessage && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastContainer}>
            <Feather name="check-circle" size={16} color={Colors.white} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
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

// ─── SellerListingCard ────────────────────────────────────────────────────────

const CATEGORY_THEME: Record<string, { bg: string; emoji: string }> = {
  MEALS:              { bg: "#FFF3E0", emoji: "🍱" },
  BREAD_AND_PASTRIES: { bg: "#FFF8E1", emoji: "🥖" },
  GROCERIES:          { bg: "#E8F5E9", emoji: "🛒" },
  MIXED:              { bg: "#F3E5F5", emoji: "🎁" },
};

const FRESHNESS_THEME: Record<string, { bg: string; color: string; en: string; ar: string }> = {
  eat_today:     { bg: "#FEF3C7", color: "#D97706", en: "Eat Today",     ar: "كل اليوم"    },
  fresh_tonight: { bg: "#DBEAFE", color: "#2563EB", en: "Fresh Tonight", ar: "طازج الليلة" },
  good_1_2_days: { bg: "#D1FAE5", color: "#059669", en: "1-2 Days",      ar: "يوم-يومين"   },
};

const LISTING_STATUS_THEME: Record<string, { bg: string; color: string; en: string; ar: string }> = {
  ACTIVE:   { bg: "#D1FAE5", color: "#059669", en: "Active",   ar: "نشط"    },
  SOLD_OUT: { bg: "#F3F4F6", color: "#6B7280", en: "Sold Out ●", ar: "نفد ●" },
  EXPIRED:  { bg: "#F3F4F6", color: "#9CA3AF", en: "Expired",  ar: "منتهي"  },
};

function SellerListingCard({
  listing, rtl, onEdit, onDelete, onDonate, onSoldOut, soldOutLoading, deleteLoading,
}: {
  listing: SellerListing;
  rtl: boolean;
  onEdit?: (l: SellerListing) => void;
  onDelete?: (id: string, title: string) => void;
  onDonate?: (l: SellerListing) => void;
  onSoldOut?: (id: string) => void;
  soldOutLoading: string | null;
  deleteLoading: string | null;
}) {
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const cat     = CATEGORY_THEME[listing.category ?? "MIXED"] ?? CATEGORY_THEME.MIXED;
  const fresh   = listing.freshnessBadge ? FRESHNESS_THEME[listing.freshnessBadge] : null;
  const statusT = listing.status ? LISTING_STATUS_THEME[listing.status] : null;
  const isSoldOut = listing.status === "SOLD_OUT";

  const discountPct = listing.originalPrice && listing.discountedPrice && listing.originalPrice > listing.discountedPrice
    ? Math.round((1 - listing.discountedPrice / listing.originalPrice) * 100)
    : null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `رمز استلام إدراج: ${listing.title}\nاستخدمه في تطبيق LeftO لتأكيد الاستلام.`,
      });
    } catch { /* share cancelled */ }
  };

  return (
    <>
      <View style={[lcStyles.card, isSoldOut && lcStyles.cardSoldOut]}>
        {/* ── Photo / placeholder ── */}
        <View style={[lcStyles.imageBlock, { backgroundColor: cat.bg }]}>
          {listing.photoUrl
            ? <Image source={{ uri: listing.photoUrl }} style={lcStyles.image} />
            : <Text style={lcStyles.emoji}>{cat.emoji}</Text>
          }
          {statusT && (
            <View style={[lcStyles.badge, lcStyles.badgeLeft, { backgroundColor: statusT.bg }]}>
              <Text style={[lcStyles.badgeText, { color: statusT.color }]}>{rtl ? statusT.ar : statusT.en}</Text>
            </View>
          )}
          {fresh && !isSoldOut && (
            <View style={[lcStyles.badge, lcStyles.badgeRight, { backgroundColor: fresh.bg }]}>
              <Text style={[lcStyles.badgeText, { color: fresh.color }]}>{rtl ? fresh.ar : fresh.en}</Text>
            </View>
          )}
        </View>

        {/* ── Content ── */}
        <View style={lcStyles.content}>
          <View style={[lcStyles.row, rtl && lcStyles.rowRTL]}>
            <Text style={[lcStyles.title, rtl && lcStyles.rtl]} numberOfLines={1}>{listing.title}</Text>
            {listing.type && (
              <View style={lcStyles.typeChip}>
                <Text style={lcStyles.typeChipText}>
                  {listing.type === "MEAL_BAG" ? (rtl ? "حقيبة" : "Bag") : (rtl ? "محدد" : "Parcel")}
                </Text>
              </View>
            )}
          </View>

          {listing.pickupStart && listing.pickupEnd && (
            <View style={[lcStyles.metaRow, rtl && lcStyles.rowRTL]}>
              <Feather name="clock" size={12} color={Colors.grayMedium} />
              <Text style={lcStyles.metaText}>{formatPickup(listing.pickupStart, listing.pickupEnd)}</Text>
            </View>
          )}

          <View style={[lcStyles.metaRow, rtl && lcStyles.rowRTL]}>
            <Feather name="layers" size={12} color={Colors.grayMedium} />
            <Text style={lcStyles.metaText}>{rtl ? `المتبقي: ${listing.quantity}` : `Qty: ${listing.quantity}`}</Text>
          </View>

          <View style={[lcStyles.priceRow, rtl && lcStyles.rowRTL]}>
            {listing.originalPrice != null && listing.discountedPrice != null && listing.originalPrice > listing.discountedPrice && (
              <Text style={lcStyles.originalPrice}>₪{listing.originalPrice}</Text>
            )}
            <Text style={lcStyles.discountedPrice}>₪{listing.discountedPrice ?? listing.price ?? "—"}</Text>
            {discountPct && discountPct > 0 && (
              <View style={lcStyles.discountPill}>
                <Text style={lcStyles.discountPillText}>-{discountPct}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View style={[lcStyles.actions, rtl && lcStyles.rowRTL]}>
          <TouchableOpacity
            style={lcStyles.actionBtn}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="maximize" size={14} color={Colors.grayMedium} />
            <Text style={lcStyles.actionText}>QR</Text>
          </TouchableOpacity>
          <View style={lcStyles.actionDivider} />
          <TouchableOpacity style={lcStyles.actionBtn} onPress={() => onEdit?.(listing)} activeOpacity={0.8}>
            <Feather name="edit-2" size={14} color={Colors.primaryOrange} />
            <Text style={[lcStyles.actionText, { color: Colors.primaryOrange }]}>{rtl ? "تعديل" : "Edit"}</Text>
          </TouchableOpacity>
          {!isSoldOut && (
            <>
              <View style={lcStyles.actionDivider} />
              <TouchableOpacity
                style={lcStyles.actionBtn}
                onPress={() => onSoldOut?.(listing.id)}
                disabled={soldOutLoading === listing.id}
                activeOpacity={0.8}
              >
                {soldOutLoading === listing.id
                  ? <ActivityIndicator size="small" color="#6B7280" />
                  : <>
                      <Feather name="x-circle" size={14} color="#6B7280" />
                      <Text style={[lcStyles.actionText, { color: "#6B7280" }]}>{rtl ? "نفد" : "Out"}</Text>
                    </>
                }
              </TouchableOpacity>
            </>
          )}
          <View style={lcStyles.actionDivider} />
          <TouchableOpacity
            style={lcStyles.actionBtn}
            onPress={() => onDelete?.(listing.id, listing.title)}
            disabled={deleteLoading === listing.id}
            activeOpacity={0.8}
          >
            {deleteLoading === listing.id
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <Feather name="trash-2" size={14} color="#EF4444" />
            }
          </TouchableOpacity>
          {onDonate && (
            <>
              <View style={lcStyles.actionDivider} />
              <TouchableOpacity style={lcStyles.actionBtn} onPress={() => onDonate(listing)} activeOpacity={0.8}>
                <Feather name="gift" size={14} color={Colors.greenMain} />
                <Text style={[lcStyles.actionText, { color: Colors.greenMain }]}>{rtl ? "تبرع" : "Donate"}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── QR Modal ── */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={qrStyles.overlay}>
          <View style={qrStyles.card}>
            {/* Header */}
            <View style={qrStyles.header}>
              <TouchableOpacity onPress={() => setQrModalVisible(false)} style={qrStyles.closeBtn} activeOpacity={0.8}>
                <Feather name="x" size={20} color={Colors.grayDark} />
              </TouchableOpacity>
              <Text style={qrStyles.title}>رمز الاستلام</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* QR image */}
            {listing.qrCodeUrl ? (
              <View style={qrStyles.qrWrap}>
                <Image
                  source={{ uri: listing.qrCodeUrl }}
                  style={qrStyles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={qrStyles.qrPlaceholder}>
                <Feather name="alert-circle" size={36} color={Colors.grayMedium} />
                <Text style={qrStyles.qrPlaceholderText}>رمز QR غير متاح — قد يكون الإدراج قديماً</Text>
                <Text style={qrStyles.qrPlaceholderSub}>أعد نشر الإدراج للحصول على رمز جديد</Text>
              </View>
            )}

            {/* Instructions */}
            <View style={qrStyles.instructionsBox}>
              <Text style={qrStyles.instructionsTitle}>كيف يعمل رمز QR؟</Text>
              <View style={qrStyles.step}>
                <Text style={qrStyles.stepNum}>١</Text>
                <Text style={qrStyles.stepText}>اعرض هذا الرمز في محلك</Text>
              </View>
              <View style={qrStyles.step}>
                <Text style={qrStyles.stepNum}>٢</Text>
                <Text style={qrStyles.stepText}>المشتري يمسح الرمز عند الاستلام</Text>
              </View>
              <View style={qrStyles.step}>
                <Text style={qrStyles.stepNum}>٣</Text>
                <Text style={qrStyles.stepText}>يتم تأكيد الاستلام تلقائياً</Text>
              </View>
            </View>

            {/* Expiry warning */}
            <View style={qrStyles.warningRow}>
              <Feather name="alert-triangle" size={14} color="#D97706" />
              <Text style={qrStyles.warningText}>الرمز صالح لمدة 24 ساعة من وقت النشر</Text>
            </View>

            {/* Actions */}
            <View style={qrStyles.actions}>
              <TouchableOpacity style={qrStyles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
                <Feather name="share-2" size={16} color={Colors.white} />
                <Text style={qrStyles.shareBtnText}>مشاركة الرمز</Text>
              </TouchableOpacity>
              <TouchableOpacity style={qrStyles.closeActionBtn} onPress={() => setQrModalVisible(false)} activeOpacity={0.85}>
                <Text style={qrStyles.closeActionBtnText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const lcStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardSoldOut: { opacity: 0.7 },
  imageBlock: { height: 110, alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%", resizeMode: "cover" },
  emoji: { fontSize: 44 },
  badge: {
    position: "absolute", top: 8, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeLeft: { left: 8 },
  badgeRight: { right: 8 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: 4, gap: 5 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowRTL: { flexDirection: "row-reverse" },
  rtl: { textAlign: "right" },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  typeChip: { backgroundColor: Colors.orangeLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  typeChipText: { fontSize: 10, fontWeight: "700", color: Colors.primaryOrange },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 },
  originalPrice: { fontSize: 12, color: Colors.grayMedium, textDecorationLine: "line-through" },
  discountedPrice: { fontSize: 17, fontWeight: "800", color: Colors.primaryOrange },
  discountPill: { backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountPillText: { fontSize: 11, fontWeight: "700", color: "#059669" },
  actions: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: Colors.grayLight,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, paddingVertical: 12,
  },
  actionText: { fontSize: 11, fontWeight: "600", color: Colors.grayMedium },
  actionDivider: { width: 1, backgroundColor: Colors.grayLight },
});

// ─── QR Modal styles ──────────────────────────────────────────────────────────

const qrStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center", padding: 24,
  },
  card: {
    backgroundColor: Colors.white, borderRadius: 24,
    width: "100%", maxWidth: 360, padding: Spacing.xl, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 20, elevation: 12,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },
  qrWrap: {
    alignItems: "center", padding: Spacing.md,
    backgroundColor: "#F9FAFB", borderRadius: 16,
  },
  qrImage: { width: 220, height: 220 },
  qrPlaceholder: {
    alignItems: "center", gap: 8, padding: Spacing.xl,
    backgroundColor: "#F9FAFB", borderRadius: 16,
  },
  qrPlaceholderText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium, textAlign: "center" },
  qrPlaceholderSub: { fontSize: 12, color: Colors.grayMedium, textAlign: "center" },
  instructionsBox: {
    backgroundColor: "#F9FAFB", borderRadius: 14, padding: Spacing.md, gap: 10,
  },
  instructionsTitle: { fontSize: 13, fontWeight: "700", color: Colors.grayDark, marginBottom: 2, textAlign: "right" },
  step: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  stepNum: { fontSize: 14, fontWeight: "800", color: Colors.primaryOrange, width: 22, textAlign: "center" },
  stepText: { flex: 1, fontSize: 13, color: Colors.grayDark, textAlign: "right" },
  warningRow: {
    flexDirection: "row-reverse", alignItems: "center", gap: 8,
    backgroundColor: "#FFFBEB", borderRadius: 10, padding: Spacing.sm,
  },
  warningText: { flex: 1, fontSize: 12, color: "#92400E", textAlign: "right" },
  actions: { flexDirection: "row", gap: 10 },
  shareBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingVertical: 13,
  },
  shareBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  closeActionBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 13,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  closeActionBtnText: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
});

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

// ─── SellerLocationDisplay ────────────────────────────────────────────────────

function SellerLocationDisplay({
  location,
}: {
  location: { address?: string | null; latitude: number; longitude: number } | null;
}) {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  useEffect(() => {
    if (location?.address) {
      setResolvedAddress(location.address);
      return;
    }
    if (!location?.latitude || !location?.longitude) return;

    const reverseGeocode = async () => {
      setLoadingAddress(true);
      try {
        const results = await Location.reverseGeocodeAsync({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        if (results && results.length > 0) {
          const r = results[0];
          const parts = [r.street, r.district, r.city, r.region].filter(Boolean);
          setResolvedAddress(parts.length > 0 ? parts.join("، ") : null);
        }
      } catch {
        setResolvedAddress(null);
      } finally {
        setLoadingAddress(false);
      }
    };

    reverseGeocode();
  }, [location?.latitude, location?.longitude, location?.address]);

  const openInMaps = () => {
    if (!location) return;
    const url =
      Platform.OS === "ios"
        ? `maps:0,0?q=${location.latitude},${location.longitude}`
        : `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://maps.google.com/?q=${location.latitude},${location.longitude}`);
    });
  };

  if (!location) {
    return (
      <View style={styles.locationContainer}>
        <View style={styles.locationRow}>
          <Feather name="map-pin" size={16} color="#9CA3AF" />
          <Text style={styles.locationEmpty}>الموقع غير محدد</Text>
        </View>
      </View>
    );
  }

  const coordText = `${Math.abs(location.latitude).toFixed(4)}° ${location.latitude >= 0 ? "ش" : "ج"}،  ${Math.abs(location.longitude).toFixed(4)}° ${location.longitude >= 0 ? "ط" : "غ"}`;

  return (
    <View style={styles.locationContainer}>
      <View style={styles.locationHeaderRow}>
        <Feather name="map-pin" size={16} color="#DE985A" />
        <Text style={styles.locationLabel}>الموقع</Text>
      </View>

      {loadingAddress ? (
        <View style={styles.locationLoadingRow}>
          <ActivityIndicator size="small" color="#DE985A" />
          <Text style={styles.locationLoadingText}>جاري تحديد الموقع...</Text>
        </View>
      ) : resolvedAddress ? (
        <Text style={styles.locationAddress}>{resolvedAddress}</Text>
      ) : (
        <Text style={styles.locationAddress}>نابلس، فلسطين</Text>
      )}

      {!resolvedAddress && !loadingAddress && (
        <Text style={styles.locationCoords}>{coordText}</Text>
      )}

      <TouchableOpacity
        style={styles.openMapsButton}
        onPress={openInMaps}
        activeOpacity={0.7}
      >
        <Feather name="navigation" size={13} color="#DE985A" />
        <Text style={styles.openMapsText}>افتح في الخريطة</Text>
      </TouchableOpacity>
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
  stateText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },

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

  // Toast
  toastOverlay: {
    position: "absolute", bottom: 96, left: 0, right: 0,
    alignItems: "center", zIndex: 99,
  },
  toastContainer: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.grayDark, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 6,
  },
  toastText: { fontSize: 13, fontWeight: "600", color: Colors.white },

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

  // Location display
  locationContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  locationHeaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
  },
  locationLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    textAlign: "right",
  },
  locationAddress: {
    fontSize: 15,
    fontWeight: "600",
    color: "#404040",
    textAlign: "right",
    lineHeight: 22,
    marginBottom: 4,
  },
  locationCoords: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "right",
    marginBottom: 8,
  },
  locationLoadingRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  locationLoadingText: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  locationEmpty: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "right",
    marginRight: 6,
  },
  openMapsButton: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFE8D6",
    borderRadius: 20,
    marginTop: 6,
  },
  openMapsText: {
    fontSize: 13,
    color: "#DE985A",
    fontWeight: "600",
  },

  // ── Location editor (settings tab) ─────────────────────────────────────────
  locationEditorCard: {
    backgroundColor: Colors.white,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.grayLight,
    padding: Spacing.md, gap: 8,
  },
  locationEditorHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  locationEditorHeaderLeft: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  locationEditorLabel: {
    fontSize: 13, fontWeight: "700", color: Colors.grayDark,
  },
  locationEditorToggleBtn: {
    fontSize: 13, fontWeight: "600", color: Colors.primaryOrange,
  },
  locationEditorCurrentAddr: {
    fontSize: 14, color: Colors.grayMedium, marginBottom: 2,
  },
  locationEditorMapWrap: {
    height: 260, borderRadius: 12, overflow: "hidden",
    borderWidth: 1, borderColor: Colors.grayLight,
  },
  locationEditorMap: {
    flex: 1,
  },
  locationEditorGpsBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: Colors.orangeLight, borderRadius: 10,
    alignSelf: "flex-start",
  },
  locationEditorGpsText: {
    fontSize: 13, fontWeight: "600", color: Colors.primaryOrange,
  },
  locationEditorSaveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.primaryOrange,
    borderRadius: 14, paddingVertical: 13,
  },
  locationEditorSaveBtnText: {
    fontSize: 15, fontWeight: "700", color: Colors.white,
  },

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
