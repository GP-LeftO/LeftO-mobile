import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, Platform,
  TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../theme";
import { isRTL } from "../i18n";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";

// ─── Seller profile type ──────────────────────────────────────────────────────
interface SellerProfile {
  id: string;
  businessName: string;
  businessType: "RESTAURANT" | "MARKET" | "BAKERY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  description?: string;
  location?: { latitude: number; longitude: number; address?: string };
  contactInfo?: { phone?: string; website?: string; socialMedia?: string };
  totalDonations?: number;
  activeListings?: number;
}

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = "overview" | "listings" | "settings";

interface SellerDashboardScreenProps {
  onLogout?: () => void;
}

const BUSINESS_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: "Restaurant",
  MARKET:     "Market",
  BAKERY:     "Bakery",
};

const BUSINESS_TYPE_LABELS_AR: Record<string, string> = {
  RESTAURANT: "مطعم",
  MARKET:     "سوق",
  BAKERY:     "مخبزة",
};

export default function SellerDashboardScreen({ onLogout }: SellerDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();

  const [activeTab,   setActiveTab]   = useState<Tab>("overview");
  const [profile,     setProfile]     = useState<SellerProfile | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [fetchError,  setFetchError]  = useState("");

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

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  // ── Tabs config ──────────────────────────────────────────────────────────────
  const TABS: { key: Tab; label: string; labelAr: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "overview",  label: "Overview",  labelAr: "نظرة عامة", icon: "grid"     },
    { key: "listings",  label: "Listings",  labelAr: "القوائم",   icon: "package"  },
    { key: "settings",  label: "Settings",  labelAr: "الإعدادات", icon: "settings" },
  ];

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const STATS = [
    {
      icon: "package" as const,
      color: Colors.primaryOrange,
      label: rtl ? "الإعلانات النشطة" : "Active Listings",
      value: profile?.activeListings ?? 0,
    },
    {
      icon: "calendar" as const,
      color: "#8b5cf6",
      label: rtl ? "حجوزات اليوم" : "Today's Reservations",
      value: 0,
      placeholder: true,
    },
    {
      icon: "heart" as const,
      color: Colors.greenMain,
      label: rtl ? "إجمالي التبرعات" : "Total Donations",
      value: profile?.totalDonations ?? 0,
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>

      {/* Header */}
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
                  {rtl
                    ? BUSINESS_TYPE_LABELS_AR[profile.businessType]
                    : BUSINESS_TYPE_LABELS[profile.businessType]}
                </Text>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={Colors.grayMedium} />
        </TouchableOpacity>
      </Animated.View>

      {/* Tab bar */}
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
              size={15}
              color={activeTab === tab.key ? Colors.primaryOrange : Colors.grayMedium}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {rtl ? tab.labelAr : tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Tab content */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.loadingText, rtl && styles.rtl]}>
            {rtl ? "جاري تحميل بيانات المتجر…" : "Loading store data…"}
          </Text>
        </View>
      ) : fetchError ? (
        <View style={styles.errorWrap}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProfile()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchProfile(true)}
              tintColor={Colors.primaryOrange}
            />
          }
        >
          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.tabPane}>
              {/* Stat cards */}
              <View style={styles.statsGrid}>
                {STATS.map((stat, i) => (
                  <View key={i} style={styles.statCard}>
                    <View style={[styles.statIcon, { backgroundColor: stat.color + "18" }]}>
                      <Feather name={stat.icon} size={18} color={stat.color} />
                    </View>
                    <Text style={styles.statValue}>
                      {stat.value}
                      {stat.placeholder && <Text style={styles.statSoon}> {rtl ? "(قريباً)" : "(soon)"}</Text>}
                    </Text>
                    <Text style={[styles.statLabel, rtl && styles.rtl]}>{stat.label}</Text>
                  </View>
                ))}
              </View>

              {/* Store info card */}
              {profile?.description && (
                <View style={styles.infoCard}>
                  <Text style={[styles.infoCardTitle, rtl && styles.rtl]}>
                    {rtl ? "عن المتجر" : "About"}
                  </Text>
                  <Text style={[styles.infoCardBody, rtl && styles.rtl]}>{profile.description}</Text>
                </View>
              )}

              {/* Location */}
              {profile?.location?.address && (
                <View style={[styles.locationRow, rtl && styles.locationRowRTL]}>
                  <Feather name="map-pin" size={14} color={Colors.primaryOrange} />
                  <Text style={[styles.locationText, rtl && styles.rtl]} numberOfLines={2}>
                    {profile.location.address}
                  </Text>
                </View>
              )}

              {/* Contact */}
              {profile?.contactInfo?.phone && (
                <View style={[styles.locationRow, rtl && styles.locationRowRTL]}>
                  <Feather name="phone" size={14} color={Colors.primaryOrange} />
                  <Text style={[styles.locationText, rtl && styles.rtl]}>{profile.contactInfo.phone}</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* ── LISTINGS TAB ── */}
          {activeTab === "listings" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.placeholderPane}>
              <Text style={styles.placeholderEmoji}>📦</Text>
              <Text style={[styles.placeholderTitle, rtl && styles.rtl]}>
                {rtl ? "قوائم الطعام" : "Food Listings"}
              </Text>
              <Text style={[styles.placeholderSub, rtl && styles.rtl]}>
                {rtl
                  ? "ستتمكن قريباً من إضافة وإدارة أكياس الطعام المخفضة"
                  : "Soon you'll be able to add and manage your discounted food bags"}
              </Text>
            </Animated.View>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === "settings" && (
            <Animated.View entering={FadeInDown.delay(50).duration(400).springify()} style={styles.placeholderPane}>
              <Text style={styles.placeholderEmoji}>⚙️</Text>
              <Text style={[styles.placeholderTitle, rtl && styles.rtl]}>
                {rtl ? "إعدادات المتجر" : "Store Settings"}
              </Text>
              <Text style={[styles.placeholderSub, rtl && styles.rtl]}>
                {rtl
                  ? "قريباً — تعديل معلومات متجرك، ساعات العمل، وطرق الدفع"
                  : "Coming soon — edit your store info, working hours, and payment methods"}
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

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
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.orangeLight,
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
    gap: 5, paddingVertical: 11,
  },
  tabItemActive: { backgroundColor: Colors.orangeLight },
  tabLabel: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange },

  // Loading / error
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingText: { fontSize: 14, color: Colors.grayMedium },
  errorWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: Spacing.xl },
  errorText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  // Tab content
  tabContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.md },

  // Overview
  tabPane: { gap: Spacing.md },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 18,
    padding: Spacing.md, gap: 4, alignItems: "flex-start",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  statIcon: { width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 22, fontWeight: "800", color: Colors.grayDark },
  statSoon: { fontSize: 11, fontWeight: "400", color: Colors.grayMedium },
  statLabel: { fontSize: 11, color: Colors.grayMedium, lineHeight: 14 },

  infoCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: Spacing.lg,
    gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoCardTitle: { fontSize: 13, fontWeight: "700", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.6 },
  infoCardBody: { fontSize: 14, color: Colors.grayDark, lineHeight: 21 },

  locationRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: Colors.white, borderRadius: 14, padding: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  locationRowRTL: { flexDirection: "row-reverse" },
  locationText: { flex: 1, fontSize: 13, color: Colors.grayDark, lineHeight: 18 },

  // Listings / Settings placeholder
  placeholderPane: {
    flex: 1, alignItems: "center", paddingTop: 48, gap: Spacing.md,
  },
  placeholderEmoji: { fontSize: 56, marginBottom: 4 },
  placeholderTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  placeholderSub: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },
});
