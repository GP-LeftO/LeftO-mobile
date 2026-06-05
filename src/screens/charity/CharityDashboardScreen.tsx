import React, { useState, useCallback } from "react";
import {
  StyleSheet, Text, View, Platform, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import {
  fetchCharityDonations,
  confirmDonationPickup,
  confirmDonationWithProof,
} from "../../services/charity/charity.service";
import type { CharityDonation, DonationStatus } from "../../services/charity/charity.service";

type Tab = "pending" | "history";

interface CharityDashboardScreenProps {
  onLogout?: () => void;
}

const STATUS_CONFIG: Record<string, { colorEn: string; colorAr: string; bg: string; color: string }> = {
  PENDING:   { colorEn: "Pending",    colorAr: "قيد الانتظار", bg: "#fff7ed", color: Colors.primaryOrange },
  RESERVED:  { colorEn: "Pending",    colorAr: "قيد الانتظار", bg: "#fff7ed", color: Colors.primaryOrange },
  CONFIRMED: { colorEn: "Confirmed",  colorAr: "مؤكدة",        bg: Colors.greenLight, color: Colors.greenMain },
  PICKED_UP: { colorEn: "Picked Up",  colorAr: "تم الاستلام",  bg: "#ede9fe", color: "#7c3aed" },
  COMPLETED: { colorEn: "Picked Up",  colorAr: "تم الاستلام",  bg: "#ede9fe", color: "#7c3aed" },
  CANCELLED: { colorEn: "Cancelled",  colorAr: "ملغاة",        bg: "#fef2f2", color: "#ef4444" },
};

export default function CharityDashboardScreen({ onLogout }: CharityDashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { user, charityStatus, logout } = useAuth();

  const [activeTab,   setActiveTab]   = useState<Tab>("pending");
  const [donations,   setDonations]   = useState<CharityDonation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [fetchError,  setFetchError]  = useState("");
  const [actionId,    setActionId]    = useState<string | null>(null);
  const [proofUri,    setProofUri]    = useState<Record<string, string>>({});
  const [successId,   setSuccessId]   = useState<string | null>(null);

  const loadDonations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setFetchError("");
    try {
      const all = await fetchCharityDonations();

      setDonations(all);
    } catch {
      setFetchError(rtl ? "تعذّر تحميل التبرعات. يرجى المحاولة مجدداً." : "Could not load donations. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rtl]);

  React.useEffect(() => { loadDonations(); }, [loadDonations]);

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const handleConfirmPickup = async (donation: CharityDonation) => {
    setActionId(donation.id);
    try {
      await confirmDonationPickup(donation.id);
      setSuccessId(donation.id);
      await loadDonations(true);
    } catch {
      Alert.alert(
        rtl ? "خطأ" : "Error",
        rtl ? "تعذّر تأكيد الاستلام. يرجى المحاولة مجدداً." : "Could not confirm pickup. Please try again."
      );
    } finally {
      setActionId(null);
      setTimeout(() => setSuccessId(null), 2000);
    }
  };

  const handlePickProof = async (donationId: string) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setProofUri((p) => ({ ...p, [donationId]: result.assets[0].uri }));
    }
  };

  const handleConfirmWithProof = async (donation: CharityDonation) => {
    const uri = proofUri[donation.id];
    if (!uri) {
      Alert.alert(rtl ? "تنبيه" : "Note", rtl ? "يرجى اختيار صورة الإثبات أولاً" : "Please select a proof image first");
      return;
    }
    setActionId(donation.id);
    try {
      await confirmDonationWithProof(donation.id, uri);
      setSuccessId(donation.id);
      setProofUri((p) => { const next = { ...p }; delete next[donation.id]; return next; });
      await loadDonations(true);
    } catch {
      Alert.alert(
        rtl ? "خطأ" : "Error",
        rtl ? "تعذّر تأكيد التبرع. يرجى المحاولة مجدداً." : "Could not confirm donation. Please try again."
      );
    } finally {
      setActionId(null);
      setTimeout(() => setSuccessId(null), 2000);
    }
  };

  const isPending  = (s: string) => s === "PENDING" || s === "RESERVED" || s === "CONFIRMED";
  const isDone     = (s: string) => s === "PICKED_UP" || s === "COMPLETED" || s === "CANCELLED";

  const filteredDonations = donations.filter((d) =>
    activeTab === "pending" ? isPending(d.status) : isDone(d.status)
  );

  const stats = {
    total:     donations.length,
    pending:   donations.filter((d) => d.status === "PENDING" || d.status === "RESERVED").length,
    confirmed: donations.filter((d) => d.status === "CONFIRMED").length,
    pickedUp:  donations.filter((d) => d.status === "PICKED_UP" || d.status === "COMPLETED").length,
  };

  const statusInfo = (() => {
    switch (charityStatus) {
      case "APPROVED": return { icon: "check-circle" as const, color: Colors.greenMain, en: "Approved", ar: "موثّقة" };
      case "PENDING":  return { icon: "clock" as const, color: Colors.primaryOrange, en: "Under Review", ar: "قيد المراجعة" };
      case "REJECTED": return { icon: "x-circle" as const, color: "#ef4444", en: "Rejected", ar: "مرفوضة" };
      default:         return null;
    }
  })();

  const renderDonation = (donation: CharityDonation) => {
    const cfg = STATUS_CONFIG[donation.status];
    const sellerName = donation.listing?.seller?.businessName
      ?? donation.seller?.businessName
      ?? donation.buyer?.name
      ?? (rtl ? "مستخدم" : "Donor");
    const title = donation.listing?.title ?? (rtl ? "تبرع بطعام" : "Food Donation");
    const createdDate = donation.createdAt
      ? new Date(donation.createdAt).toLocaleDateString(rtl ? "ar-PS" : "en-GB", { day: "numeric", month: "short" })
      : null;
    const hasProof = !!proofUri[donation.id];
    const isActive = actionId === donation.id;
    const isSuccess = successId === donation.id;

    return (
      <Animated.View entering={FadeInDown.duration(400).springify()} key={donation.id} style={styles.donationCard}>
        {/* Header row */}
        <View style={[styles.cardHeader, rtl && styles.cardHeaderRTL]}>
          <View style={styles.cardIconWrap}>
            <Feather name="gift" size={18} color={Colors.primaryOrange} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={[styles.cardTitle, rtl && styles.rtl]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.cardSub, rtl && styles.rtl]}>
              {rtl ? `من: ${sellerName}` : `From: ${sellerName}`}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.statusPillText, { color: cfg.color }]}>
              {rtl ? cfg.colorAr : cfg.colorEn}
            </Text>
          </View>
        </View>

        {/* Meta */}
        <View style={[styles.cardMeta, rtl && styles.cardMetaRTL]}>
          <View style={[styles.metaItem, rtl && styles.metaItemRTL]}>
            <Feather name="layers" size={12} color={Colors.grayMedium} />
            <Text style={styles.metaText}>{rtl ? `الكمية: ${donation.quantity}` : `Qty: ${donation.quantity}`}</Text>
          </View>
          {donation.listing?.pickupStart && (
            <View style={[styles.metaItem, rtl && styles.metaItemRTL]}>
              <Feather name="clock" size={12} color={Colors.grayMedium} />
              <Text style={styles.metaText}>{donation.listing.pickupStart} – {donation.listing.pickupEnd}</Text>
            </View>
          )}
          {createdDate && (
            <View style={[styles.metaItem, rtl && styles.metaItemRTL]}>
              <Feather name="calendar" size={12} color={Colors.grayMedium} />
              <Text style={styles.metaText}>{createdDate}</Text>
            </View>
          )}
        </View>

        {/* Success flash */}
        {isSuccess && (
          <View style={styles.successRow}>
            <Feather name="check-circle" size={15} color={Colors.greenMain} />
            <Text style={styles.successText}>{rtl ? "تم بنجاح!" : "Done!"}</Text>
          </View>
        )}

        {/* Actions for PENDING / CONFIRMED */}
        {(donation.status === "PENDING" || donation.status === "RESERVED") && !isSuccess && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnSecondary]}
              onPress={() => handlePickProof(donation.id)}
              activeOpacity={0.8}
            >
              <Feather name="upload" size={14} color={Colors.primaryOrange} />
              <Text style={styles.actionBtnSecondaryText}>
                {hasProof ? (rtl ? "تم رفع الإثبات" : "Proof selected") : (rtl ? "رفع إثبات" : "Upload Proof")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnPrimary]}
              onPress={() => hasProof ? handleConfirmWithProof(donation) : handleConfirmPickup(donation)}
              activeOpacity={0.8}
              disabled={isActive}
            >
              {isActive
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <>
                    <Feather name="check" size={14} color={Colors.white} />
                    <Text style={styles.actionBtnPrimaryText}>
                      {hasProof
                        ? (rtl ? "تأكيد مع إثبات" : "Confirm + Proof")
                        : (rtl ? "تأكيد الاستلام" : "Confirm Pickup")}
                    </Text>
                  </>
              }
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.delay(80).duration(500).springify()} style={styles.header}>
        <View style={[styles.headerLeft, rtl && styles.headerLeftRTL]}>
          <View style={styles.orgIconWrap}>
            <Feather name="heart" size={22} color={Colors.primaryOrange} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={[styles.orgName, rtl && styles.rtl]} numberOfLines={1}>
              {user?.name ?? (rtl ? "جمعيتي" : "My Charity")}
            </Text>
            {statusInfo && (
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "18" }]}>
                <Feather name={statusInfo.icon} size={11} color={statusInfo.color} />
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {rtl ? statusInfo.ar : statusInfo.en}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={18} color={Colors.grayMedium} />
        </TouchableOpacity>
      </Animated.View>

      {/* Stats row */}
      <Animated.View entering={FadeInDown.delay(150).duration(500).springify()} style={styles.statsRow}>
        {[
          { label: rtl ? "المجموع" : "Total",    value: stats.total,     color: Colors.primaryOrange },
          { label: rtl ? "معلق" : "Pending",      value: stats.pending,   color: "#f59e0b" },
          { label: rtl ? "مؤكد" : "Confirmed",    value: stats.confirmed, color: Colors.greenMain },
          { label: rtl ? "مستلم" : "Picked Up",   value: stats.pickedUp,  color: "#7c3aed" },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, rtl && styles.rtl]}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Tab bar */}
      <Animated.View entering={FadeInDown.delay(220).duration(500).springify()} style={styles.tabBar}>
        {(["pending", "history"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Feather
              name={tab === "pending" ? "inbox" : "archive"}
              size={15}
              color={activeTab === tab ? Colors.primaryOrange : Colors.grayMedium}
            />
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === "pending" ? (rtl ? "قيد الانتظار" : "Pending") : (rtl ? "السجل" : "History")}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Content */}
      {loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{rtl ? "جاري تحميل التبرعات…" : "Loading donations…"}</Text>
        </View>
      ) : fetchError ? (
        <View style={styles.centeredState}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadDonations()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadDonations(true)} tintColor={Colors.primaryOrange} />
          }
        >
          {filteredDonations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{activeTab === "pending" ? "📭" : "📂"}</Text>
              <Text style={[styles.emptyTitle, rtl && styles.rtl]}>
                {activeTab === "pending"
                  ? (rtl ? "لا توجد تبرعات معلقة" : "No pending donations")
                  : (rtl ? "لا يوجد سجل تبرعات بعد" : "No donation history yet")}
              </Text>
              <Text style={[styles.emptySub, rtl && styles.rtl]}>
                {activeTab === "pending"
                  ? (rtl ? "ستظهر هنا تبرعات البائعين" : "Donations from sellers will appear here")
                  : (rtl ? "ستظهر هنا التبرعات المكتملة" : "Completed donations will appear here")}
              </Text>
            </View>
          ) : (
            filteredDonations.map(renderDonation)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerLeftRTL: { flexDirection: "row-reverse" },
  orgIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 4 },
  orgName: { fontSize: 17, fontWeight: "800", color: Colors.grayDark, maxWidth: 200 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },

  statsRow: {
    flexDirection: "row", paddingHorizontal: Spacing.xl,
    gap: 8, marginBottom: Spacing.sm,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 14,
    paddingVertical: 10, alignItems: "center", gap: 2,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, color: Colors.grayMedium },

  tabBar: {
    flexDirection: "row", marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    overflow: "hidden", marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 6, paddingVertical: 11,
  },
  tabItemActive: { backgroundColor: Colors.orangeLight },
  tabLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange },

  centeredState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, paddingHorizontal: Spacing.xl },
  stateText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: { backgroundColor: Colors.primaryOrange, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40, gap: Spacing.md },

  donationCard: {
    backgroundColor: Colors.white, borderRadius: 18,
    padding: Spacing.md, gap: Spacing.sm,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardHeaderRTL: { flexDirection: "row-reverse" },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.orangeLight, alignItems: "center", justifyContent: "center",
  },
  cardInfo: { flex: 1, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  cardSub: { fontSize: 12, color: Colors.grayMedium },
  statusPill: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cardMetaRTL: { flexDirection: "row-reverse" },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaItemRTL: { flexDirection: "row-reverse" },
  metaText: { fontSize: 12, color: Colors.grayMedium },

  successRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  successText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },

  actionsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: 12, paddingVertical: 10,
  },
  actionBtnPrimary: { backgroundColor: Colors.primaryOrange },
  actionBtnSecondary: {
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.primaryOrange,
  },
  actionBtnPrimaryText: { fontSize: 13, fontWeight: "700", color: Colors.white },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: "700", color: Colors.primaryOrange },

  emptyState: { paddingTop: 60, alignItems: "center", gap: Spacing.sm },
  emptyEmoji: { fontSize: 52, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },
  emptySub: { fontSize: 14, color: Colors.grayMedium, lineHeight: 20, textAlign: "center" },
});
