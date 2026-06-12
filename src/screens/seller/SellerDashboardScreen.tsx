import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet, Text, View, Platform, TextInput, Image,
  TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert,
  KeyboardAvoidingView, Modal, Share, Linking, Switch,
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
  deleteListing, getMySellerDonations,
} from "../../services/seller/seller.service";
import { useKaram } from "../../hooks/seller/useKaram";
import { useSellerOrders } from "../../hooks/seller/useSellerOrders";
import type { SellerListing, SellerDonation } from "../../services/seller/seller.service";
import { getMyPerformance } from "../../services/seller/listingAI.service";
import type { PerformanceResult } from "../../services/seller/listingAI.service";
import type { SellerOrder } from "../../hooks/seller/useSellerOrders";
import { getCharityBasket } from "../../services/charity/charity.service";
import type { BasketCategory } from "../../services/charity/charity.service";
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

type Tab = "overview" | "listings" | "orders" | "donations" | "settings";

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

const ORDER_STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; color: string; bg: string; ar: string; en: string }> = {
  RESERVED:  { labelEn: "Reserved",  labelAr: "محجوز",  color: Colors.primaryOrange, bg: Colors.orangeLight, ar: "محجوز",         en: "Reserved"  },
  COMPLETED: { labelEn: "Completed", labelAr: "مكتمل",  color: Colors.greenMain,     bg: Colors.greenLight,  ar: "مكتمل",         en: "Completed" },
  CANCELLED: { labelEn: "Cancelled", labelAr: "ملغى",   color: Colors.grayMedium,    bg: Colors.grayLight,   ar: "ملغى",          en: "Cancelled" },
};

const DONATION_STATUS_CONFIG: Record<string, { labelEn: string; labelAr: string; color: string; bg: string; ar: string; en: string }> = {
  PENDING:   { labelEn: "Pending",   labelAr: "قادم",        color: Colors.primaryOrange, bg: Colors.orangeLight, ar: "قادم",         en: "Pending"   },
  PICKED_UP: { labelEn: "Picked Up", labelAr: "تم الاستلام",  color: "#7c3aed",            bg: "#ede9fe",          ar: "تم الاستلام",  en: "Picked Up" },
  CONFIRMED: { labelEn: "Confirmed", labelAr: "مكتمل",        color: Colors.greenMain,     bg: Colors.greenLight,  ar: "مكتمل",        en: "Confirmed" },
  CANCELLED: { labelEn: "Cancelled", labelAr: "ملغى",         color: Colors.grayMedium,    bg: Colors.grayLight,   ar: "ملغى",         en: "Cancelled" },
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

  // ── Charities state (for donation flow + basket display) ─────────────────
  const [charities,        setCharities]        = useState<{ id: string; name: string; region?: string; basket: BasketCategory[] }[]>([]);
  const [charitiesLoading, setCharitiesLoading] = useState(false);

  // ── Donate-to-charity modal ───────────────────────────────────────────────
  const [donateTarget,      setDonateTarget]      = useState<{ id: string; name: string } | null>(null);
  const [donateListingId,   setDonateListingId]   = useState<string>("");
  const [donateQty,         setDonateQty]         = useState("1");
  const [donateSubmitting,  setDonateSubmitting]  = useState(false);

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

  // ── Toast helper (stable ref so it can be passed to hooks) ────────────────
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // ── Karam hook ────────────────────────────────────────────────────────────
  const karam = useKaram({
    sellerId: profile?.id ?? '',
    initialParticipates: profile?.participatesInKaram ?? false,
    onToast: showToast,
  });

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
      const arr: { id: string; name?: string; orgName?: string; organizationName?: string; region?: string }[] =
        Array.isArray(payload) ? payload : payload?.charities ?? payload?.items ?? [];
      const withBaskets = await Promise.allSettled(
        arr.map(async c => {
          let basket: BasketCategory[] = [];
          try { basket = await getCharityBasket(c.id); } catch { /* skip */ }
          return {
            id: c.id,
            name: c.name ?? c.orgName ?? c.organizationName ?? "Charity",
            region: c.region,
            basket,
          };
        })
      );
      setCharities(
        withBaskets
          .filter(r => r.status === "fulfilled")
          .map(r => (r as PromiseFulfilledResult<{ id: string; name: string; region?: string; basket: BasketCategory[] }>).value)
      );
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

  useEffect(() => { if (activeTab === "listings") fetchListings(); }, [activeTab, fetchListings]);
  // fetchOrders omitted from deps intentionally — fetchOrders is stable (no page dep)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (activeTab === "orders") fetchOrders(true); }, [activeTab]);
  useEffect(() => { fetchDonations(); }, [fetchDonations]);
  useEffect(() => { if (activeTab === "donations") fetchCharities(); }, [activeTab, fetchCharities]);
  useEffect(() => {
    if (!refreshKey) return;
    setActiveTab("listings");
    fetchListings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, fetchListings]);

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

  // ─── Listing actions ───────────────────────────────────────────────────────

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

  const handleDonateSubmit = async () => {
    if (!donateTarget || !donateListingId) return;
    const qty = Math.max(1, parseInt(donateQty, 10) || 1);
    const listing = listings.find(l => l.id === donateListingId);
    if (!listing) return;
    setDonateSubmitting(true);
    try {
      const { createSellerDonation } = await import("../../services/seller/donation.service");
      await createSellerDonation({
        listingId: donateListingId,
        charityId: donateTarget.id,
        quantity: qty,
        pickupStart: listing.pickupStart ?? new Date().toISOString(),
        pickupEnd:   listing.pickupEnd   ?? new Date(Date.now() + 3600000).toISOString(),
      });
      setDonateTarget(null);
      setDonateListingId("");
      setDonateQty("1");
      await fetchDonations();
      Alert.alert(
        rtl ? "شكراً جزيلاً!" : "Thank you!",
        rtl ? `تم إرسال تبرعك إلى ${donateTarget.name}` : `Donation sent to ${donateTarget.name}`
      );
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر إتمام التبرع" : "Could not complete donation");
    } finally {
      setDonateSubmitting(false);
    }
  };

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
    { key: "donations", labelEn: "Donate",    labelAr: "تبرع",      icon: "gift"         },
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

                {/* Karam balance card — only when seller participates */}
                {karam.participatesInKaram && (
                  <View style={styles.karamCard}>
                    <View style={[styles.karamHeader, rtl && styles.karamHeaderRTL]}>
                      <View style={styles.karamIconWrap}>
                        <Text style={{ fontSize: 16 }}>🤝</Text>
                      </View>
                      <Text style={styles.karamTitle}>برنامج كرم</Text>
                      <View style={{ flex: 1 }} />
                      <View style={styles.karamActivePill}>
                        <Text style={styles.karamActivePillText}>نشط</Text>
                      </View>
                    </View>

                    <Text style={[styles.karamDayLabel, rtl && styles.rtl]}>اليوم</Text>

                    <View style={[styles.karamStats, rtl && styles.karamStatsRTL]}>
                      <View style={styles.karamStat}>
                        <Text style={styles.karamStatValue}>
                          {karam.loading ? '—' : String(karam.balance.sponsored)}
                        </Text>
                        <Text style={styles.karamStatLabel}>ممولة</Text>
                      </View>
                      <View style={styles.karamStatDivider} />
                      <View style={styles.karamStat}>
                        <Text style={styles.karamStatValue}>
                          {karam.loading ? '—' : String(karam.balance.claimed)}
                        </Text>
                        <Text style={styles.karamStatLabel}>مُستلمة</Text>
                      </View>
                      <View style={styles.karamStatDivider} />
                      <View style={styles.karamStat}>
                        <Text style={styles.karamStatValue}>
                          {karam.loading ? '—' : String(karam.balance.available)}
                        </Text>
                        <Text style={styles.karamStatLabel}>متاحة</Text>
                      </View>
                    </View>

                    <View style={[styles.karamActions, rtl && styles.karamActionsRTL]}>
                      <TouchableOpacity
                        style={[styles.karamBtn, styles.karamBtnSponsor, karam.sponsorLoading && { opacity: 0.6 }]}
                        onPress={karam.sponsor}
                        disabled={karam.sponsorLoading}
                        activeOpacity={0.85}
                      >
                        {karam.sponsorLoading
                          ? <ActivityIndicator size="small" color={Colors.white} />
                          : (
                            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                              <Feather name="heart" size={14} color={Colors.white} />
                              <Text style={styles.karamBtnText}>مول وجبة</Text>
                            </View>
                          )
                        }
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.karamBtn, styles.karamBtnClaim,
                          (karam.balance.available === 0 || karam.claimLoading) && { opacity: 0.4 },
                        ]}
                        onPress={karam.claim}
                        disabled={karam.balance.available === 0 || karam.claimLoading}
                        activeOpacity={0.85}
                      >
                        {karam.claimLoading
                          ? <ActivityIndicator size="small" color={Colors.greenMain} />
                          : (
                            <View style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }}>
                              <Feather name="check-circle" size={14} color={Colors.greenMain} />
                              <Text style={[styles.karamBtnText, { color: Colors.greenMain }]}>وجبة مُستلمة</Text>
                            </View>
                          )
                        }
                      </TouchableOpacity>
                    </View>
                  </View>
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

          {/* ══════════ ORDERS TAB ══════════ */}
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
                {/* Status filter chips */}
                <View style={[styles.filterRow, rtl && styles.filterRowRTL]}>
                  {(["RESERVED", "COMPLETED", "CANCELLED"] as const).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterPill, ordersFilter === f && styles.filterPillActive]}
                      onPress={() => setOrdersFilter(ordersFilter === f ? "" : f)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterPillText, ordersFilter === f && styles.filterPillTextActive]}>
                        {rtl
                          ? f === "RESERVED" ? "نشطة" : f === "COMPLETED" ? "مكتملة" : "ملغاة"
                          : f === "RESERVED" ? "Active" : f === "COMPLETED" ? "Completed" : "Cancelled"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {ordersLoading && filteredOrders.length === 0 ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={Colors.primaryOrange} size="large" />
                  </View>
                ) : ordersError ? (
                  <View style={styles.centered}>
                    <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
                    <Text style={[styles.stateText, rtl && styles.rtl]}>{ordersError}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders(true)} activeOpacity={0.8}>
                      <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : filteredOrders.length === 0 ? (
                  <View style={styles.emptyPane}>
                    <Text style={styles.emptyEmoji}>📋</Text>
                    <Text style={[styles.emptyTitle, rtl && styles.rtl]}>
                      {rtl ? "لا توجد طلبات" : "No orders"}
                    </Text>
                  </View>
                ) : (
                  <>
                    {filteredOrders.map((order) => (
                      <SellerOrderCard key={order.id} order={order} rtl={rtl} />
                    ))}
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

          {/* ══════════ DONATIONS TAB ══════════ */}
          {activeTab === "donations" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>

                {/* ── Browse charity needs ── */}
                <Text style={[styles.sectionHeader, rtl && styles.rtl]}>
                  {rtl ? "احتياجات الجمعيات" : "Charity Needs"}
                </Text>
                {charitiesLoading ? (
                  <ActivityIndicator color={Colors.primaryOrange} style={{ marginVertical: 12 }} />
                ) : charities.length === 0 ? (
                  <View style={styles.emptyPane}>
                    <Text style={styles.emptyEmoji}>🤝</Text>
                    <Text style={[styles.emptyTitle, rtl && styles.rtl]}>{rtl ? "لا توجد جمعيات" : "No charities found"}</Text>
                  </View>
                ) : (() => {
                  const myCategories = new Set(listings.map(l => l.category).filter(Boolean));
                  return charities.map(charity => {
                    const hasBasket = charity.basket.length > 0;
                    const isMatch = hasBasket && charity.basket.some(c => myCategories.has(c));
                    const LABELS: Record<string, string> = {
                      MEALS: rtl ? "وجبات" : "Meals",
                      BREAD_AND_PASTRIES: rtl ? "خبز" : "Bread",
                      GROCERIES: rtl ? "بقالة" : "Groceries",
                      MIXED: rtl ? "متنوع" : "Mixed",
                    };
                    return (
                      <View key={charity.id} style={[styles.charityCard, isMatch && styles.charityCardMatch]}>
                        <View style={[styles.charityCardRow, rtl && { flexDirection: "row-reverse" as const }]}>
                          <View style={{ flex: 1, gap: 4 }}>
                            <View style={[styles.charityNameRow, rtl && { flexDirection: "row-reverse" }]}>
                              <Text style={[styles.charityName, rtl && styles.rtl]} numberOfLines={1}>{charity.name}</Text>
                              {isMatch && (
                                <View style={styles.matchBadge}>
                                  <Text style={styles.matchBadgeText}>{rtl ? "✓ يطابق" : "✓ Match"}</Text>
                                </View>
                              )}
                            </View>
                            {charity.region && (
                              <Text style={[styles.charityRegion, rtl && styles.rtl]}>{charity.region}</Text>
                            )}
                            {hasBasket ? (
                              <View style={[styles.charityChips, rtl && { flexDirection: "row-reverse" }]}>
                                {charity.basket.map(cat => (
                                  <View
                                    key={cat}
                                    style={[styles.charityChip, myCategories.has(cat) && styles.charityChipMatch]}
                                  >
                                    <Text style={[styles.charityChipText, myCategories.has(cat) && styles.charityChipTextMatch]}>
                                      {LABELS[cat] ?? cat}
                                    </Text>
                                  </View>
                                ))}
                              </View>
                            ) : (
                              <Text style={styles.charityNoBasket}>{rtl ? "لم تحدد احتياجاتها" : "No needs specified"}</Text>
                            )}
                          </View>
                          <TouchableOpacity
                            style={styles.donateToBtn}
                            onPress={() => {
                              setDonateTarget({ id: charity.id, name: charity.name });
                              setDonateListingId(listings[0]?.id ?? "");
                              setDonateQty("1");
                            }}
                            activeOpacity={0.85}
                          >
                            <Feather name="gift" size={14} color={Colors.white} />
                            <Text style={styles.donateToBtnText}>{rtl ? "تبرع" : "Donate"}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  });
                })()}

                {/* ── Past donations ── */}
                {donations.length > 0 && (
                  <>
                    <Text style={[styles.sectionHeader, rtl && styles.rtl, { marginTop: 20 }]}>
                      {rtl ? "تبرعاتي السابقة" : "My Donations"}
                    </Text>
                    {donations.map((don) => {
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
                    })}
                  </>
                )}
              </Animated.View>
            </ScrollView>
          )}

          {/* ── Donate-to-charity modal ── */}
          <Modal
            visible={!!donateTarget}
            transparent
            animationType="slide"
            onRequestClose={() => setDonateTarget(null)}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => setDonateTarget(null)} activeOpacity={1} />
              <View style={styles.modalSheet}>
                <View style={[styles.modalHeader, rtl && styles.modalHeaderRTL]}>
                  <View>
                    <Text style={styles.modalTitle}>{rtl ? "تبرع بالفائض" : "Donate Surplus"}</Text>
                    <Text style={styles.modalSub}>{rtl ? `إلى: ${donateTarget?.name}` : `To: ${donateTarget?.name}`}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setDonateTarget(null)} activeOpacity={0.8}>
                    <Feather name="x" size={22} color={Colors.grayMedium} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>{rtl ? "اختر القائمة" : "Select Listing"}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {listings.map(l => (
                    <TouchableOpacity
                      key={l.id}
                      style={[styles.chip, donateListingId === l.id && styles.chipSelected]}
                      onPress={() => setDonateListingId(l.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.chipText, donateListingId === l.id && styles.chipTextSelected]} numberOfLines={1}>
                        {l.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.modalLabel}>{rtl ? "الكمية" : "Quantity"}</Text>
                <View style={[styles.donationInner, rtl && styles.donationInnerRTL, { alignItems: "center" }]}>
                  <TouchableOpacity
                    style={styles.donationQtyBtn}
                    onPress={() => setDonateQty(q => String(Math.max(1, parseInt(q, 10) - 1)))}
                  >
                    <Feather name="minus" size={18} color={Colors.primaryOrange} />
                  </TouchableOpacity>
                  <Text style={styles.donationQtyText}>{donateQty}</Text>
                  <TouchableOpacity
                    style={styles.donationQtyBtn}
                    onPress={() => setDonateQty(q => String(parseInt(q, 10) + 1))}
                  >
                    <Feather name="plus" size={18} color={Colors.primaryOrange} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.donateConfirmBtn, (!donateListingId || donateSubmitting) && { opacity: 0.6 }]}
                  onPress={handleDonateSubmit}
                  disabled={!donateListingId || donateSubmitting}
                  activeOpacity={0.85}
                >
                  {donateSubmitting
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <>
                        <Feather name="heart" size={16} color={Colors.white} />
                        <Text style={styles.donateConfirmBtnText}>
                          {rtl ? "تأكيد التبرع" : "Confirm Donation"}
                        </Text>
                      </>
                  }
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

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

                  {/* ── Karam program toggle ── */}
                  <Text style={[styles.karamSectionHeader, rtl && styles.rtl]}>
                    برنامج كرم
                  </Text>
                  <View style={styles.karamSettingsCard}>
                    <View style={[styles.karamToggleRow, rtl && styles.karamToggleRowRTL]}>
                      <View style={styles.karamToggleInfo}>
                        <Text style={[styles.karamToggleTitle, rtl && styles.rtl]}>أشارك في برنامج كرم</Text>
                        <Text style={[styles.karamToggleSub, rtl && styles.rtl]}>
                          يتيح للمشترين تمويل وجبات لمن يحتاج
                        </Text>
                      </View>
                      {karam.actionLoading
                        ? <ActivityIndicator size="small" color={Colors.greenMain} />
                        : (
                          <Switch
                            value={karam.participatesInKaram}
                            onValueChange={(val) => karam.toggleParticipation(val).catch(() => showToast('حدث خطأ، حاول مرة أخرى'))}
                            trackColor={{ false: Colors.grayMedium, true: Colors.greenMain }}
                            thumbColor={Colors.white}
                          />
                        )
                      }
                    </View>
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

                  {/* ── Switch to Buyer Mode ── */}
                  <TouchableOpacity
                    style={[styles.switchToBuyerBtn, { flexDirection: rtl ? "row-reverse" : "row" }]}
                    onPress={switchToBuyerMode}
                    activeOpacity={0.85}
                  >
                    <Feather name="shopping-bag" size={18} color={Colors.primaryOrange} />
                    <Text style={styles.switchToBuyerText}>
                      {rtl ? "تصفح كمشتري 🛍️" : "Browse as Buyer 🛍️"}
                    </Text>
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

  const pickupWindow = order.pickupStart && order.pickupEnd
    ? formatPickup(order.pickupStart, order.pickupEnd)
    : null;

  let countdown: string | null = null;
  if (order.status === "RESERVED" && order.expiresAt) {
    const minsLeft = Math.round((new Date(order.expiresAt).getTime() - Date.now()) / 60000);
    if (minsLeft > 0) countdown = `ينتهي خلال ${minsLeft} دقيقة`;
  }

  return (
    <View style={ocStyles.card}>
      {/* Row 1: title + status badge */}
      <View style={[ocStyles.row1, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <Text style={[ocStyles.title, { textAlign: rtl ? "right" : "left" }]} numberOfLines={1}>
          {order.listing?.title ?? (rtl ? "طلب" : "Order")}
        </Text>
        <View style={[ocStyles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[ocStyles.badgeText, { color: cfg.color }]}>
            {rtl ? cfg.labelAr : cfg.labelEn}
          </Text>
        </View>
      </View>

      {/* Row 2: buyer name + qty × price + pickup */}
      <View style={[ocStyles.row2, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <View style={[ocStyles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
          <Feather name="user" size={12} color="#6B7280" />
          <Text style={[ocStyles.metaText, { textAlign: rtl ? "right" : "left" }]}>
            {order.buyer?.name ?? "مجهول الهوية"}
          </Text>
        </View>
        <View style={[ocStyles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
          <Feather name="shopping-bag" size={12} color="#6B7280" />
          <Text style={ocStyles.metaText}>
            ×{order.quantity}{order.totalPrice != null ? ` — ${order.totalPrice} ₪` : ""}
          </Text>
        </View>
        {pickupWindow && (
          <View style={[ocStyles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
            <Feather name="clock" size={12} color="#6B7280" />
            <Text style={ocStyles.metaText}>{pickupWindow}</Text>
          </View>
        )}
      </View>

      {/* Row 3: countdown (RESERVED only) */}
      {countdown && (
        <Text style={[ocStyles.countdown, { textAlign: rtl ? "right" : "left" }]}>
          {countdown}
        </Text>
      )}
    </View>
  );
}

const ocStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row1: { justifyContent: "space-between", alignItems: "center" },
  title: { flex: 1, fontSize: 15, fontWeight: "700", color: "#404040", marginEnd: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: "600" },
  row2: { marginTop: 8, alignItems: "center", flexWrap: "wrap", gap: 12 },
  metaItem: { alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, color: "#6B7280" },
  countdown: { marginTop: 8, fontSize: 12, color: "#EF4444" },
});

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
        : Platform.OS === "android"
          ? `geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`
          : `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    Linking.openURL(url).catch(() => {});
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
  stateText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },

  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  filterRowRTL: { flexDirection: "row-reverse" },
  filterPill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  filterPillActive: { backgroundColor: Colors.primaryOrange, borderColor: Colors.primaryOrange },
  filterPillText: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  filterPillTextActive: { color: Colors.white },
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

  // Karam card (overview tab)
  karamCard: {
    backgroundColor: Colors.greenLight, borderRadius: 12, padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.greenMain,
    marginBottom: 4,
  },
  karamHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  karamHeaderRTL: { flexDirection: "row-reverse" },
  karamIconWrap: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.white + "80",
    alignItems: "center", justifyContent: "center",
  },
  karamTitle: { fontSize: 15, fontWeight: "800", color: Colors.greenMain },
  karamActivePill: {
    backgroundColor: Colors.greenMain, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3,
  },
  karamActivePillText: { fontSize: 11, fontWeight: "700", color: Colors.white },
  karamDayLabel: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },
  karamStats: { flexDirection: "row", alignItems: "center" },
  karamStatsRTL: { flexDirection: "row-reverse" },
  karamStat: { flex: 1, alignItems: "center", gap: 2 },
  karamStatValue: { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  karamStatLabel: { fontSize: 11, color: Colors.grayMedium },
  karamStatDivider: { width: 1, height: 32, backgroundColor: Colors.greenMain + "40" },
  karamActions: { flexDirection: "row", gap: 10 },
  karamActionsRTL: { flexDirection: "row-reverse" },
  karamBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center", justifyContent: "center" },
  karamBtnSponsor: { backgroundColor: Colors.greenMain },
  karamBtnClaim: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.greenMain },
  karamBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },

  // Karam settings section (settings tab)
  karamSectionHeader: {
    fontSize: 13, color: Colors.grayMedium, fontWeight: "600", marginBottom: 4,
  },
  karamSettingsCard: {
    backgroundColor: Colors.white, borderRadius: 10, padding: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },

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
  orderIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  orderBody: { flex: 1, gap: 3 },
  orderTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  orderMeta: { fontSize: 12, color: Colors.grayMedium, lineHeight: 16 },
  orderSub: { fontSize: 12, color: Colors.grayMedium, lineHeight: 16 },
  orderPrice: { fontSize: 13, fontWeight: "700", color: Colors.primaryOrange, paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  orderStatusBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  orderStatusText: { fontSize: 11, fontWeight: "700" },

  donationCard: {
    backgroundColor: Colors.white, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    overflow: "hidden",
  },
  donationInner: { flexDirection: "row", alignItems: "center", padding: Spacing.md, gap: 12 },
  donationInnerRTL: { flexDirection: "row-reverse" },
  donationIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.greenLight, alignItems: "center", justifyContent: "center",
  },
  donationBody: { flex: 1, gap: 3 },
  donationTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  donationSub: { fontSize: 12, color: Colors.grayMedium, lineHeight: 16 },

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

  switchToBuyerBtn: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.orangeLight,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryOrange,
    paddingVertical: 14,
    marginTop: Spacing.sm,
  },
  switchToBuyerText: { fontSize: 15, fontWeight: "700", color: Colors.primaryOrange },

  // Status pill (shared)
  statusPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

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

  // Charity needs (donations tab)
  sectionHeader: { fontSize: 13, fontWeight: "800", color: Colors.grayDark, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  charityCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: Spacing.md, marginBottom: 10,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  charityCardMatch: { borderColor: Colors.greenMain, backgroundColor: "#f0fdf4" },
  charityCardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  charityNameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  charityName: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  charityRegion: { fontSize: 12, color: Colors.grayMedium },
  charityChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  charityChip: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.grayLight,
  },
  charityChipMatch: { backgroundColor: Colors.greenLight, borderColor: Colors.greenMain },
  charityChipText: { fontSize: 11, fontWeight: "600", color: Colors.grayMedium },
  charityChipTextMatch: { color: Colors.greenMain },
  charityNoBasket: { fontSize: 11, color: Colors.grayMedium, fontStyle: "italic" },
  matchBadge: {
    backgroundColor: Colors.greenLight, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  matchBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.greenMain },

  donateToBtn: {
    backgroundColor: Colors.greenMain, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center",
  },
  donateToBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },

  donationQtyBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.orangeLight, borderWidth: 1.5, borderColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
  },
  donationQtyText: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, minWidth: 40, textAlign: "center" },

});
