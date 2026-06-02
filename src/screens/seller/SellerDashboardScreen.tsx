import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet, Text, View, Platform,
  TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import api from "../../services/shared/api";
import { deleteListing } from "../../services/seller/seller.service";
import type { SellerListing } from "../../services/seller/seller.service";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  totalOrdersCompleted?: number;
  totalRevenue?: number;
}

type Tab = "overview" | "listings" | "settings";

interface SellerDashboardScreenProps {
  onLogout?: () => void;
  onCreateListing?: () => void;
  onEditListing?: (listing: SellerListing) => void;
  refreshKey?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BIZ_LABELS: Record<string, { en: string; ar: string; emoji: string }> = {
  RESTAURANT: { en: "Restaurant", ar: "مطعم",   emoji: "🍽️" },
  MARKET:     { en: "Market",     ar: "سوق",    emoji: "🛒" },
  BAKERY:     { en: "Bakery",     ar: "مخبزة",  emoji: "🥐" },
};

function formatPickup(start?: string, end?: string): string {
  if (!start || !end) return "";
  try {
    const fmt = (iso: string) =>
      new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch { return ""; }
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   Colors.greenMain,
  SOLD_OUT: "#ef4444",
  EXPIRED:  Colors.grayMedium,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SellerDashboardScreen({
  onLogout,
  onCreateListing,
  onEditListing,
  refreshKey,
}: SellerDashboardScreenProps) {
  const insets     = useSafeAreaInsets();
  const rtl        = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, logout } = useAuth();

  const [activeTab,       setActiveTab]       = useState<Tab>("overview");
  const [profile,         setProfile]         = useState<SellerProfile | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [fetchError,      setFetchError]      = useState("");
  const [listings,        setListings]        = useState<SellerListing[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError,   setListingsError]   = useState("");
  const [soldOutLoading,  setSoldOutLoading]  = useState<string | null>(null);
  const [deleteLoading,   setDeleteLoading]   = useState<string | null>(null);

  // ─── Data fetching ─────────────────────────────────────────────────────────

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

  const fetchListings = useCallback(async () => {
    if (!user?.id) return;
    setListingsLoading(true);
    setListingsError("");
    try {
      const { data } = await api.get("/api/listings", { params: { sellerId: user.id } });
      const payload = data.data ?? data;
      const items: SellerListing[] = Array.isArray(payload)
        ? payload
        : (payload?.listings ?? payload?.items ?? payload?.data ?? []);
      setListings(items);
    } catch {
      setListingsError(rtl ? "تعذّر تحميل القوائم" : "Could not load listings");
    } finally {
      setListingsLoading(false);
    }
  }, [user?.id, rtl]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);
  useEffect(() => { if (activeTab === "listings") fetchListings(); }, [activeTab, fetchListings]);
  useEffect(() => { if (refreshKey && activeTab === "listings") fetchListings(); }, [refreshKey]);

  // ─── Actions ───────────────────────────────────────────────────────────────

  const handleMarkSoldOut = async (listingId: string) => {
    setSoldOutLoading(listingId);
    try {
      await api.patch(`/api/listings/${listingId}/sold-out`);
      await fetchListings();
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تحديث الحالة" : "Could not update status");
    } finally {
      setSoldOutLoading(null);
    }
  };

  const handleDeleteListing = (listingId: string, title: string) => {
    Alert.alert(
      rtl ? "حذف القائمة" : "Delete Listing",
      rtl ? `هل أنت متأكد من حذف "${title}"؟` : `Delete "${title}"?`,
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
              Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر الحذف" : "Could not delete");
            } finally {
              setDeleteLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => { await logout(); onLogout?.(); };

  const bizInfo = profile ? (BIZ_LABELS[profile.businessType] ?? BIZ_LABELS.RESTAURANT) : null;

  // ─── Tabs ──────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; labelEn: string; labelAr: string; icon: keyof typeof Feather.glyphMap }[] = [
    { key: "overview",  labelEn: "Overview",  labelAr: "عام",       icon: "home"     },
    { key: "listings",  labelEn: "Listings",  labelAr: "القوائم",   icon: "package"  },
    { key: "settings",  labelEn: "Settings",  labelAr: "الإعدادات", icon: "settings" },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>

      {/* ── Colored header banner ── */}
      <Animated.View entering={FadeInDown.delay(60).duration(500).springify()} style={styles.banner}>
        <View style={[styles.bannerInner, rtl && styles.bannerInnerRTL]}>
          <View style={styles.storeAvatar}>
            <Text style={styles.storeAvatarEmoji}>{bizInfo?.emoji ?? "🏪"}</Text>
          </View>
          <View style={styles.bannerInfo}>
            {loading ? (
              <View style={styles.skeletonName} />
            ) : (
              <Text style={[styles.bannerName, rtl && styles.textRight]} numberOfLines={1}>
                {profile?.businessName ?? user?.name ?? "My Store"}
              </Text>
            )}
            <View style={[styles.bannerBadges, rtl && styles.rowRTL]}>
              {bizInfo && (
                <View style={styles.bizBadge}>
                  <Text style={styles.bizBadgeText}>{rtl ? bizInfo.ar : bizInfo.en}</Text>
                </View>
              )}
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={11} color={Colors.greenMain} />
                <Text style={styles.verifiedBadgeText}>{rtl ? "موثّق" : "Verified"}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={17} color="#fff8" />
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        {!loading && profile && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.statsStrip}>
            <StatItem value={profile.activeListings ?? 0}          label={rtl ? "إعلانات نشطة"  : "Active"}      icon="package"  color="#fff" />
            <View style={styles.statDivider} />
            <StatItem value={profile.totalOrdersCompleted ?? 0}    label={rtl ? "طلبات مكتملة" : "Completed"}   icon="check-circle" color="#fff" />
            <View style={styles.statDivider} />
            <StatItem value={profile.totalDonations ?? 0}          label={rtl ? "تبرعات"       : "Donations"}   icon="heart"    color="#fff" />
          </Animated.View>
        )}
      </Animated.View>

      {/* ── Tab bar ── */}
      <Animated.View entering={FadeInDown.delay(180).duration(400).springify()} style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon} size={16} color={active ? Colors.primaryOrange : Colors.grayMedium} />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {rtl ? tab.labelAr : tab.labelEn}
              </Text>
              {active && <View style={styles.tabActiveDot} />}
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
        </View>
      ) : fetchError ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={44} color={Colors.grayMedium} />
          <Text style={[styles.errorMsg, rtl && styles.textRight]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchProfile()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.tabContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchProfile(true)} tintColor={Colors.primaryOrange} />}
            >
              <Animated.View entering={FadeInDown.delay(80).duration(400)} style={styles.tabPane}>

                {profile?.description && (
                  <View style={styles.infoCard}>
                    <View style={[styles.infoCardHeader, rtl && styles.rowRTL]}>
                      <Feather name="info" size={14} color={Colors.primaryOrange} />
                      <Text style={[styles.infoCardTitle, rtl && styles.textRight]}>{rtl ? "عن المتجر" : "About"}</Text>
                    </View>
                    <Text style={[styles.infoCardBody, rtl && styles.textRight]}>{profile.description}</Text>
                  </View>
                )}

                {(profile?.location?.address || profile?.contactInfo?.phone) && (
                  <View style={styles.contactCard}>
                    <Text style={[styles.contactCardTitle, rtl && styles.textRight]}>
                      {rtl ? "معلومات التواصل" : "Contact Info"}
                    </Text>
                    {profile?.location?.address && (
                      <View style={[styles.contactRow, rtl && styles.rowRTL]}>
                        <View style={styles.contactIconWrap}>
                          <Feather name="map-pin" size={13} color={Colors.primaryOrange} />
                        </View>
                        <Text style={[styles.contactText, rtl && styles.textRight]} numberOfLines={2}>
                          {profile.location.address}
                        </Text>
                      </View>
                    )}
                    {profile?.contactInfo?.phone && (
                      <View style={[styles.contactRow, rtl && styles.rowRTL]}>
                        <View style={styles.contactIconWrap}>
                          <Feather name="phone" size={13} color={Colors.primaryOrange} />
                        </View>
                        <Text style={[styles.contactText, rtl && styles.textRight]}>{profile.contactInfo.phone}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Quick action */}
                <TouchableOpacity
                  style={styles.quickAction}
                  onPress={() => { setActiveTab("listings"); setTimeout(() => onCreateListing?.(), 100); }}
                  activeOpacity={0.85}
                >
                  <View style={styles.quickActionIcon}>
                    <Feather name="plus-circle" size={22} color={Colors.primaryOrange} />
                  </View>
                  <View style={styles.quickActionBody}>
                    <Text style={[styles.quickActionTitle, rtl && styles.textRight]}>
                      {rtl ? "أضف قائمة جديدة" : "Add a New Listing"}
                    </Text>
                    <Text style={[styles.quickActionSub, rtl && styles.textRight]}>
                      {rtl ? "ابدأ بنشر طعامك الفائض الآن" : "Start selling your surplus food now"}
                    </Text>
                  </View>
                  <Feather name={rtl ? "arrow-left" : "arrow-right"} size={16} color={Colors.grayMedium} />
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          )}

          {/* ── LISTINGS ── */}
          {activeTab === "listings" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
              <Animated.View entering={FadeInDown.delay(60).duration(400)} style={styles.tabPane}>
                {listingsLoading ? (
                  <View style={styles.centered}>
                    <ActivityIndicator color={Colors.primaryOrange} size="large" />
                  </View>
                ) : listingsError ? (
                  <View style={styles.centered}>
                    <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
                    <Text style={[styles.errorMsg, rtl && styles.textRight]}>{listingsError}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={fetchListings} activeOpacity={0.8}>
                      <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : listings.length === 0 ? (
                  <View style={styles.emptyPane}>
                    <View style={styles.emptyIllustration}>
                      <Feather name="package" size={40} color={Colors.primaryOrange} />
                    </View>
                    <Text style={[styles.emptyTitle, rtl && styles.textRight]}>
                      {rtl ? "لا توجد قوائم بعد" : "No listings yet"}
                    </Text>
                    <Text style={[styles.emptySub, rtl && styles.textRight]}>
                      {rtl ? "اضغط + لإضافة أول قائمة طعامك المخفض" : "Tap + to add your first discounted listing"}
                    </Text>
                    <TouchableOpacity style={styles.emptyAction} onPress={onCreateListing} activeOpacity={0.85}>
                      <Feather name="plus" size={16} color={Colors.white} />
                      <Text style={styles.emptyActionText}>{rtl ? "إضافة قائمة" : "Add Listing"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  listings.map((listing, i) => (
                    <Animated.View key={listing.id} entering={FadeInDown.delay(i * 50).duration(350)}>
                      <ListingCard
                        listing={listing}
                        soldOutLoading={soldOutLoading}
                        deleteLoading={deleteLoading}
                        onEdit={() => onEditListing?.(listing)}
                        onSoldOut={() => handleMarkSoldOut(listing.id)}
                        onDelete={() => handleDeleteListing(listing.id, listing.title)}
                        rtl={rtl}
                      />
                    </Animated.View>
                  ))
                )}
              </Animated.View>
            </ScrollView>
          )}

          {/* ── SETTINGS (placeholder for this branch) ── */}
          {activeTab === "settings" && (
            <View style={styles.centered}>
              <Text style={styles.settingsEmoji}>⚙️</Text>
              <Text style={[styles.emptyTitle, rtl && styles.textRight]}>
                {rtl ? "إعدادات المتجر" : "Store Settings"}
              </Text>
              <Text style={[styles.emptySub, rtl && styles.textRight]}>
                {rtl ? "قريباً — تعديل معلومات متجرك" : "Coming in next update"}
              </Text>
            </View>
          )}
        </>
      )}

      {/* ── FAB ── */}
      {activeTab === "listings" && onCreateListing && (
        <TouchableOpacity
          style={[styles.fab, rtl ? styles.fabRTL : styles.fabLTR]}
          onPress={onCreateListing}
          activeOpacity={0.85}
        >
          <Feather name="plus" size={26} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── StatItem ─────────────────────────────────────────────────────────────────

function StatItem({ value, label, icon, color }: { value: number; label: string; icon: keyof typeof Feather.glyphMap; color: string }) {
  return (
    <View style={styles.statItem}>
      <Feather name={icon} size={14} color="rgba(255,255,255,0.7)" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── ListingCard ─────────────────────────────────────────────────────────────

function ListingCard({
  listing, soldOutLoading, deleteLoading, onEdit, onSoldOut, onDelete, rtl,
}: {
  listing: SellerListing;
  soldOutLoading: string | null;
  deleteLoading: string | null;
  onEdit: () => void;
  onSoldOut: () => void;
  onDelete: () => void;
  rtl: boolean;
}) {
  const statusColor = STATUS_COLORS[listing.status ?? "ACTIVE"] ?? Colors.greenMain;
  const pickup = formatPickup(listing.pickupStart, listing.pickupEnd);
  const discount = listing.originalPrice && listing.discountedPrice
    ? Math.round((1 - listing.discountedPrice / listing.originalPrice) * 100)
    : 0;

  return (
    <View style={styles.listingCard}>
      {/* Color strip */}
      <View style={[styles.listingStrip, { backgroundColor: statusColor }]} />

      <View style={styles.listingContent}>
        {/* Top row */}
        <View style={[styles.listingTop, rtl && styles.rowRTL]}>
          {listing.photoUrl ? (
            <Image source={{ uri: listing.photoUrl }} style={styles.listingThumb} />
          ) : (
            <View style={styles.listingThumbPlaceholder}>
              <Feather name="package" size={20} color={Colors.primaryOrange} />
            </View>
          )}

          <View style={styles.listingMeta}>
            <Text style={[styles.listingTitle, rtl && styles.textRight]} numberOfLines={1}>
              {listing.title}
            </Text>
            {pickup !== "" && (
              <View style={[styles.listingMetaRow, rtl && styles.rowRTL]}>
                <Feather name="clock" size={12} color={Colors.grayMedium} />
                <Text style={styles.listingMetaText}>{pickup}</Text>
              </View>
            )}
            <View style={[styles.listingMetaRow, rtl && styles.rowRTL]}>
              <Feather name="layers" size={12} color={Colors.grayMedium} />
              <Text style={styles.listingMetaText}>
                {rtl ? `${listing.quantity} متبقي` : `${listing.quantity} left`}
              </Text>
            </View>
          </View>

          <View style={styles.listingPriceCol}>
            <Text style={styles.listingDiscountedPrice}>
              ₪{(listing.discountedPrice ?? listing.price)?.toFixed(2) ?? "—"}
            </Text>
            {listing.originalPrice && (
              <Text style={styles.listingOriginalPrice}>₪{listing.originalPrice.toFixed(2)}</Text>
            )}
            {discount > 0 && (
              <View style={styles.discountTag}>
                <Text style={styles.discountTagText}>-{discount}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action bar */}
        <View style={[styles.listingActions, rtl && styles.rowRTL]}>
          <TouchableOpacity style={styles.actionBtnEdit} onPress={onEdit} activeOpacity={0.8}>
            <Feather name="edit-2" size={13} color={Colors.primaryOrange} />
            <Text style={styles.actionBtnEditText}>{rtl ? "تعديل" : "Edit"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnSoldOut}
            onPress={onSoldOut}
            disabled={soldOutLoading === listing.id}
            activeOpacity={0.8}
          >
            {soldOutLoading === listing.id
              ? <ActivityIndicator size="small" color="#ef4444" />
              : <>
                  <Feather name="x-circle" size={13} color="#ef4444" />
                  <Text style={styles.actionBtnSoldOutText}>{rtl ? "نفد" : "Sold Out"}</Text>
                </>}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtnDelete}
            onPress={onDelete}
            disabled={deleteLoading === listing.id}
            activeOpacity={0.8}
          >
            {deleteLoading === listing.id
              ? <ActivityIndicator size="small" color={Colors.grayMedium} />
              : <Feather name="trash-2" size={14} color={Colors.grayMedium} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F0" },
  textRight: { textAlign: "right" },
  rowRTL: { flexDirection: "row-reverse" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: Spacing.xl },

  // Banner
  banner: {
    backgroundColor: Colors.primaryOrange,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  bannerInner: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: Spacing.md },
  bannerInnerRTL: { flexDirection: "row-reverse" },
  storeAvatar: {
    width: 54, height: 54, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  storeAvatarEmoji: { fontSize: 28 },
  bannerInfo:  { flex: 1 },
  skeletonName: { height: 20, width: 120, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.3)", marginBottom: 6 },
  bannerName:  { fontSize: 19, fontWeight: "800", color: Colors.white },
  bannerBadges: { flexDirection: "row", gap: 6, marginTop: 4 },
  bizBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  bizBadgeText: { fontSize: 11, fontWeight: "600", color: Colors.white },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.greenMain },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  // Stats strip
  statsStrip: {
    flexDirection: "row", marginTop: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.12)", borderRadius: 14, padding: Spacing.sm,
  },
  statItem: { flex: 1, alignItems: "center", gap: 3 },
  statValue: { fontSize: 18, fontWeight: "800", color: Colors.white },
  statLabel: { fontSize: 10, color: "rgba(255,255,255,0.8)", textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.2)", marginVertical: 4 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 12, position: "relative",
  },
  tabItemActive: { },
  tabLabel:       { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange, fontWeight: "700" },
  tabActiveDot: {
    position: "absolute", bottom: 0, left: "25%", right: "25%",
    height: 3, borderRadius: 3, backgroundColor: Colors.primaryOrange,
  },

  // Content
  tabContent: { padding: Spacing.lg, paddingBottom: 100, gap: Spacing.md },
  tabPane: { gap: Spacing.md },

  // Info card
  infoCard: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  infoCardHeader: { flexDirection: "row", alignItems: "center", gap: 7, padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  infoCardTitle:  { fontSize: 12, fontWeight: "700", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.6 },
  infoCardBody:   { fontSize: 14, color: Colors.grayDark, lineHeight: 21, padding: Spacing.md },

  // Contact card
  contactCard: {
    backgroundColor: Colors.white, borderRadius: 18, padding: Spacing.md, gap: Spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  contactCardTitle: { fontSize: 12, fontWeight: "700", color: Colors.grayMedium, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  contactRow:    { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  contactIconWrap: { width: 28, height: 28, borderRadius: 8, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center" },
  contactText:   { flex: 1, fontSize: 13, color: Colors.grayDark, lineHeight: 18, paddingTop: 5 },

  // Quick action
  quickAction: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: Colors.white, borderRadius: 18, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.orangeLight,
    shadowColor: Colors.primaryOrange, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  quickActionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center" },
  quickActionBody: { flex: 1 },
  quickActionTitle: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  quickActionSub:   { fontSize: 12, color: Colors.grayMedium, marginTop: 2 },

  // Errors
  errorMsg: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  // Empty state
  emptyPane: { alignItems: "center", paddingTop: 32, gap: Spacing.md },
  emptyIllustration: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub:   { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },
  emptyAction: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 4,
  },
  emptyActionText:  { fontSize: 14, fontWeight: "700", color: Colors.white },
  settingsEmoji:    { fontSize: 52, marginBottom: 8 },

  // Listing card
  listingCard: {
    flexDirection: "row", backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  listingStrip: { width: 4 },
  listingContent: { flex: 1, padding: Spacing.md, gap: Spacing.sm },
  listingTop: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  listingThumb: { width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.grayLight },
  listingThumbPlaceholder: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  listingMeta: { flex: 1, gap: 4 },
  listingTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  listingMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  listingMetaText: { fontSize: 12, color: Colors.grayMedium },
  listingPriceCol: { alignItems: "flex-end", gap: 2 },
  listingDiscountedPrice: { fontSize: 16, fontWeight: "800", color: Colors.primaryOrange },
  listingOriginalPrice: { fontSize: 11, color: Colors.grayMedium, textDecorationLine: "line-through" },
  discountTag: { backgroundColor: Colors.greenLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  discountTagText: { fontSize: 10, fontWeight: "700", color: Colors.greenMain },

  // Listing action bar
  listingActions: {
    flexDirection: "row", gap: 8, alignItems: "center",
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.grayLight,
  },
  actionBtnEdit: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.orangeLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, flex: 1, justifyContent: "center",
  },
  actionBtnEditText: { fontSize: 12, fontWeight: "700", color: Colors.primaryOrange },
  actionBtnSoldOut: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#fef2f2", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7, flex: 1, justifyContent: "center",
  },
  actionBtnSoldOutText: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  actionBtnDelete: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
  },

  // FAB
  fab: {
    position: "absolute", bottom: 28,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primaryOrange, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 14, elevation: 10,
  },
  fabLTR: { right: 24 },
  fabRTL: { left: 24 },
});
