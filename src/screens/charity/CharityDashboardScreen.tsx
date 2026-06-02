import React, { useState, useEffect } from "react";
import {
  StyleSheet, Text, View, Platform, TouchableOpacity,
  ScrollView, ActivityIndicator, RefreshControl, Alert, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import { useCharityDonations } from "../../hooks/charity/useCharityDonations";
import { uploadDocument } from "../../services/shared/document.service";
import type { CharityDonation } from "../../services/charity/charity.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "incoming" | "picked_up" | "completed";

interface CharityDashboardScreenProps {
  onLogout?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPickup(start?: string, end?: string): string {
  if (!start || !end) return "";
  try {
    const fmt = (s: string) => new Date(s).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch { return ""; }
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }); }
  catch { return ""; }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CharityDashboardScreen({ onLogout }: CharityDashboardScreenProps) {
  const insets     = useSafeAreaInsets();
  const rtl        = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, charityStatus, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("incoming");
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const incoming  = useCharityDonations("PENDING");
  const pickedUp  = useCharityDonations("PICKED_UP");
  const completed = useCharityDonations("CONFIRMED");

  const activeHook = activeTab === "incoming" ? incoming : activeTab === "picked_up" ? pickedUp : completed;

  useEffect(() => {
    if (activeTab === "incoming")  incoming.fetch(true);
    if (activeTab === "picked_up") pickedUp.fetch(true);
    if (activeTab === "completed") completed.fetch(true);
  }, [activeTab]);

  const handleLogout = async () => { await logout(); onLogout?.(); };

  const handlePickUp = (id: string) => {
    Alert.alert(
      rtl ? "تأكيد الاستلام" : "Confirm Pickup",
      rtl ? "هل استلمت هذا التبرع؟" : "Have you picked up this donation?",
      [
        { text: rtl ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: rtl ? "نعم، استلمت" : "Yes, Picked Up",
          onPress: async () => {
            try {
              await incoming.pickUp(id);
              setActiveTab("picked_up");
            } catch {
              Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تأكيد الاستلام" : "Could not confirm pickup");
            }
          },
        },
      ]
    );
  };

  const handleConfirmWithProof = async (donation: CharityDonation) => {
    Alert.alert(
      rtl ? "تأكيد التوزيع" : "Confirm Distribution",
      rtl ? "هل تريد إضافة صورة إثبات؟" : "Would you like to add a proof photo?",
      [
        {
          text: rtl ? "بدون صورة" : "Without Photo",
          onPress: async () => {
            try {
              await pickedUp.confirm(donation.id);
              setActiveTab("completed");
            } catch {
              Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تأكيد التوزيع" : "Could not confirm distribution");
            }
          },
        },
        {
          text: rtl ? "إضافة صورة" : "Add Photo",
          onPress: () => handleUploadProof(donation.id),
        },
        { text: rtl ? "إلغاء" : "Cancel", style: "cancel" },
      ]
    );
  };

  const handleUploadProof = async (id: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      if (result.canceled || !result.assets[0]?.uri) return;
      setUploadingId(id);
      const url = await uploadDocument(result.assets[0].uri, "trade_license");
      await pickedUp.confirm(id, url);
      setActiveTab("completed");
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر رفع الصورة أو تأكيد التوزيع" : "Could not upload proof or confirm");
    } finally {
      setUploadingId(null);
    }
  };

  const TABS: { key: Tab; labelEn: string; labelAr: string; icon: keyof typeof Feather.glyphMap; color: string }[] = [
    { key: "incoming",  labelEn: "Incoming",  labelAr: "قادم",          icon: "inbox",        color: Colors.primaryOrange },
    { key: "picked_up", labelEn: "Picked Up", labelAr: "تم الاستلام",   icon: "truck",        color: "#8b5cf6"            },
    { key: "completed", labelEn: "Completed", labelAr: "مكتمل",         icon: "check-circle", color: Colors.greenMain     },
  ];

  return (
    <View style={[styles.root, { paddingTop: topPadding }]}>

      {/* ── Header banner ── */}
      <Animated.View entering={FadeInDown.delay(60).duration(500).springify()} style={styles.banner}>
        <View style={[styles.bannerInner, rtl && styles.rowRTL]}>
          <View style={styles.orgAvatar}>
            <Feather name="heart" size={24} color={Colors.white} />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={[styles.bannerName, rtl && styles.textRight]} numberOfLines={1}>
              {user?.name ?? (rtl ? "جمعيتي" : "My Charity")}
            </Text>
            <View style={[styles.bannerBadges, rtl && styles.rowRTL]}>
              {charityStatus === "APPROVED" && (
                <View style={styles.verifiedBadge}>
                  <Feather name="check-circle" size={11} color={Colors.greenMain} />
                  <Text style={styles.verifiedText}>{rtl ? "معتمدة" : "Verified"}</Text>
                </View>
              )}
              {user?.phone && (
                <View style={styles.phoneBadge}>
                  <Feather name="phone" size={10} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.phoneBadgeText}>{user.phone}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Feather name="log-out" size={17} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {TABS.map(tab => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, active && styles.tabItemActive, active && { borderBottomColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <Feather name={tab.icon} size={15} color={active ? tab.color : Colors.grayMedium} />
              <Text style={[styles.tabLabel, active && { color: tab.color, fontWeight: "700" }]}>
                {rtl ? tab.labelAr : tab.labelEn}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      {activeHook.loading && activeHook.donations.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
        </View>
      ) : activeHook.error ? (
        <View style={styles.centered}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.errorText, rtl && styles.textRight]}>{activeHook.error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => activeHook.fetch(true)} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={activeHook.refreshing}
              onRefresh={() => activeHook.fetch(true)}
              tintColor={Colors.primaryOrange}
            />
          }
        >
          {activeHook.donations.length === 0 ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyPane}>
              <View style={[styles.emptyIcon, { backgroundColor: TABS.find(t => t.key === activeTab)?.color + "18" }]}>
                <Feather name={TABS.find(t => t.key === activeTab)?.icon ?? "inbox"} size={36} color={TABS.find(t => t.key === activeTab)?.color ?? Colors.primaryOrange} />
              </View>
              <Text style={[styles.emptyTitle, rtl && styles.textRight]}>
                {activeTab === "incoming"  && (rtl ? "لا توجد تبرعات قادمة" : "No incoming donations")}
                {activeTab === "picked_up" && (rtl ? "لا توجد تبرعات مستلمة" : "No donations picked up yet")}
                {activeTab === "completed" && (rtl ? "لا توجد تبرعات مكتملة" : "No completed donations yet")}
              </Text>
              <Text style={[styles.emptySub, rtl && styles.textRight]}>
                {activeTab === "incoming"  && (rtl ? "ستظهر هنا التبرعات القادمة من المتاجر" : "Food donations from sellers will appear here")}
                {activeTab === "picked_up" && (rtl ? "اضغط 'تأكيد الاستلام' في التبرعات القادمة" : "Mark incoming donations as picked up to see them here")}
                {activeTab === "completed" && (rtl ? "التبرعات الموزّعة مع إثبات ستظهر هنا" : "Confirmed distributions with proof will appear here")}
              </Text>
            </Animated.View>
          ) : (
            <>
              {activeHook.donations.map((donation, i) => (
                <Animated.View key={donation.id} entering={FadeInDown.delay(i * 50).duration(350)}>
                  <DonationCard
                    donation={donation}
                    tab={activeTab}
                    uploadingId={uploadingId}
                    onPickUp={() => handlePickUp(donation.id)}
                    onConfirm={() => handleConfirmWithProof(donation)}
                    rtl={rtl}
                  />
                </Animated.View>
              ))}
              {activeHook.hasMore && (
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={() => activeHook.fetch(false)}
                  disabled={activeHook.loading}
                  activeOpacity={0.8}
                >
                  {activeHook.loading
                    ? <ActivityIndicator size="small" color={Colors.primaryOrange} />
                    : <Text style={styles.loadMoreText}>{rtl ? "تحميل المزيد" : "Load more"}</Text>}
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ─── DonationCard ─────────────────────────────────────────────────────────────

function DonationCard({
  donation, tab, uploadingId, onPickUp, onConfirm, rtl,
}: {
  donation: CharityDonation;
  tab: Tab;
  uploadingId: string | null;
  onPickUp: () => void;
  onConfirm: () => void;
  rtl: boolean;
}) {
  const pickup = formatPickup(donation.pickupStart, donation.pickupEnd);
  const isUploading = uploadingId === donation.id;

  return (
    <View style={styles.card}>
      <View style={[styles.cardInner, rtl && styles.rowRTL]}>
        {/* Left: photo or icon */}
        {donation.listing?.photoUrl ? (
          <Image source={{ uri: donation.listing.photoUrl }} style={styles.cardThumb} />
        ) : (
          <View style={styles.cardThumbPlaceholder}>
            <Feather name="gift" size={20} color={Colors.primaryOrange} />
          </View>
        )}

        {/* Center: info */}
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, rtl && styles.textRight]} numberOfLines={1}>
            {donation.listing?.title ?? (rtl ? "تبرع غذائي" : "Food Donation")}
          </Text>
          <Text style={[styles.cardSeller, rtl && styles.textRight]} numberOfLines={1}>
            {donation.seller?.businessName ?? "—"}
          </Text>
          <View style={[styles.cardMetaRow, rtl && styles.rowRTL]}>
            <Feather name="layers" size={12} color={Colors.grayMedium} />
            <Text style={styles.cardMetaText}>{rtl ? `الكمية: ${donation.quantity}` : `Qty: ${donation.quantity}`}</Text>
          </View>
          {pickup !== "" && (
            <View style={[styles.cardMetaRow, rtl && styles.rowRTL]}>
              <Feather name="clock" size={12} color={Colors.grayMedium} />
              <Text style={styles.cardMetaText}>{pickup}</Text>
            </View>
          )}
          <Text style={[styles.cardDate, rtl && styles.textRight]}>{formatDate(donation.createdAt)}</Text>
        </View>
      </View>

      {/* Proof photo (completed tab) */}
      {tab === "completed" && donation.proofPhoto && (
        <Image source={{ uri: donation.proofPhoto }} style={styles.proofPhoto} resizeMode="cover" />
      )}

      {/* Action buttons */}
      {tab === "incoming" && (
        <TouchableOpacity style={styles.actionBtn} onPress={onPickUp} activeOpacity={0.85}>
          <Feather name="truck" size={15} color={Colors.white} />
          <Text style={styles.actionBtnText}>{rtl ? "تأكيد الاستلام" : "Mark as Picked Up"}</Text>
        </TouchableOpacity>
      )}
      {tab === "picked_up" && (
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnGreen]}
          onPress={onConfirm}
          disabled={isUploading}
          activeOpacity={0.85}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <>
              <Feather name="check-circle" size={15} color={Colors.white} />
              <Text style={styles.actionBtnText}>{rtl ? "تأكيد التوزيع" : "Confirm Distribution"}</Text>
            </>
          )}
        </TouchableOpacity>
      )}
      {tab === "completed" && (
        <View style={[styles.completedBadge, rtl && styles.rowRTL]}>
          <Feather name="check-circle" size={13} color={Colors.greenMain} />
          <Text style={styles.completedBadgeText}>{rtl ? "تم التوزيع" : "Distributed"}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F5F5F0" },
  textRight: { textAlign: "right" },
  rowRTL: { flexDirection: "row-reverse" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: Spacing.xl },

  banner: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  bannerInner: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: Spacing.md },
  orgAvatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  bannerInfo: { flex: 1 },
  bannerName: { fontSize: 18, fontWeight: "800", color: Colors.white },
  bannerBadges: { flexDirection: "row", gap: 6, marginTop: 4, flexWrap: "wrap" },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "#f0fdf4", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  verifiedText: { fontSize: 11, fontWeight: "700", color: Colors.greenMain },
  phoneBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2,
  },
  phoneBadgeText: { fontSize: 11, color: "rgba(255,255,255,0.9)" },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },

  tabBar: {
    flexDirection: "row", backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: "transparent",
  },
  tabItemActive: { },
  tabLabel: { fontSize: 12, fontWeight: "600", color: Colors.grayMedium },

  scroll: { padding: Spacing.lg, paddingBottom: 60, gap: Spacing.md },

  errorText: { fontSize: 15, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  emptyPane: { alignItems: "center", paddingTop: 40, gap: Spacing.md },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 13, color: Colors.grayMedium, lineHeight: 19, textAlign: "center", paddingHorizontal: Spacing.lg },

  card: {
    backgroundColor: Colors.white, borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardInner: { flexDirection: "row", alignItems: "flex-start", padding: Spacing.md, gap: 12 },
  cardThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: Colors.grayLight },
  cardThumbPlaceholder: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  cardBody: { flex: 1, gap: 3 },
  cardTitle:  { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  cardSeller: { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600" },
  cardMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMetaText: { fontSize: 12, color: Colors.grayMedium },
  cardDate: { fontSize: 11, color: Colors.grayMedium, marginTop: 2 },

  proofPhoto: { width: "100%", height: 160, marginBottom: 4 },

  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#7c3aed", margin: Spacing.md, marginTop: 0,
    borderRadius: 12, paddingVertical: 12,
  },
  actionBtnGreen: { backgroundColor: Colors.greenMain },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  completedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.greenLight, margin: Spacing.md, marginTop: 0,
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignSelf: "flex-start",
  },
  completedBadgeText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },

  loadMoreBtn: {
    alignItems: "center", paddingVertical: 14,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  loadMoreText: { fontSize: 14, fontWeight: "600", color: Colors.primaryOrange },
});
