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
  getMyBasket,
  setMyBasket,
} from "../../services/charity/charity.service";
import type { CharityDonation, DonationStatus, BasketCategory } from "../../services/charity/charity.service";

type Tab = "pending" | "history" | "basket";

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

  // Basket state
  const [basket,        setBasket]        = useState<BasketCategory[]>([]);
  const [basketLoading, setBasketLoading] = useState(false);
  const [basketSaving,  setBasketSaving]  = useState(false);
  const [basketSaved,   setBasketSaved]   = useState(false);

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

  React.useEffect(() => {
    if (activeTab === "basket" && basket.length === 0 && !basketLoading) {
      setBasketLoading(true);
      getMyBasket().then(setBasket).catch(() => {}).finally(() => setBasketLoading(false));
    }
  }, [activeTab]);

  const toggleBasketCategory = (cat: BasketCategory) => {
    setBasket(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setBasketSaved(false);
  };

  const handleSaveBasket = async () => {
    if (basket.length === 0) {
      Alert.alert(rtl ? "تنبيه" : "Note", rtl ? "يرجى اختيار فئة واحدة على الأقل" : "Please select at least one category");
      return;
    }
    setBasketSaving(true);
    try {
      await setMyBasket(basket);
      setBasketSaved(true);
      setTimeout(() => setBasketSaved(false), 3000);
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر حفظ الطلب" : "Could not save basket");
    } finally {
      setBasketSaving(false);
    }
  };

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
        {([
          { key: "pending", icon: "inbox",  labelEn: "Pending",  labelAr: "قيد الانتظار" },
          { key: "history", icon: "archive", labelEn: "History",  labelAr: "السجل"        },
          { key: "basket",  icon: "list",   labelEn: "Needs",    labelAr: "احتياجاتي"    },
        ] as { key: Tab; icon: "inbox" | "archive" | "list"; labelEn: string; labelAr: string }[]).map((tab) => (
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
              {rtl ? tab.labelAr : tab.labelEn}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* Content */}
      {/* ── Basket tab ── */}
      {activeTab === "basket" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.basketContent}>
          <Animated.View entering={FadeInDown.delay(50).duration(400).springify()}>
            <Text style={[styles.basketTitle, rtl && styles.rtl]}>
              {rtl ? "احتياجات الطعام" : "Food Needs"}
            </Text>
            <Text style={[styles.basketSub, rtl && styles.rtl]}>
              {rtl
                ? "اختر الفئات التي تحتاجها جمعيتك. البائعون سيرون طلباتك ويمكنهم التبرع بما يناسب."
                : "Select what food categories your charity needs. Sellers will see these and can donate accordingly."}
            </Text>

            {basketLoading ? (
              <ActivityIndicator color={Colors.primaryOrange} style={{ marginTop: 24 }} />
            ) : (
              <>
                <View style={styles.basketChipsGrid}>
                  {([
                    { key: "MEALS",              icon: "🍱", labelEn: "Meals",            labelAr: "وجبات"       },
                    { key: "BREAD_AND_PASTRIES", icon: "🥖", labelEn: "Bread & Pastries", labelAr: "خبز ومعجنات" },
                    { key: "GROCERIES",          icon: "🛒", labelEn: "Groceries",        labelAr: "بقالة"       },
                    { key: "MIXED",              icon: "📦", labelEn: "Mixed",            labelAr: "متنوع"       },
                  ] as { key: BasketCategory; icon: string; labelEn: string; labelAr: string }[]).map((cat) => {
                    const selected = basket.includes(cat.key);
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[styles.basketChip, selected && styles.basketChipSelected]}
                        onPress={() => toggleBasketCategory(cat.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.basketChipIcon}>{cat.icon}</Text>
                        <Text style={[styles.basketChipText, selected && styles.basketChipTextSelected]}>
                          {rtl ? cat.labelAr : cat.labelEn}
                        </Text>
                        {selected && (
                          <View style={styles.basketCheckBadge}>
                            <Feather name="check" size={10} color={Colors.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {basketSaved && (
                  <View style={styles.basketSuccessRow}>
                    <Feather name="check-circle" size={15} color={Colors.greenMain} />
                    <Text style={styles.basketSuccessText}>{rtl ? "تم الحفظ بنجاح!" : "Saved!"}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.basketSaveBtn, (basketSaving || basket.length === 0) && { opacity: 0.6 }]}
                  onPress={handleSaveBasket}
                  disabled={basketSaving || basket.length === 0}
                  activeOpacity={0.85}
                >
                  {basketSaving
                    ? <ActivityIndicator color={Colors.white} size="small" />
                    : <Text style={styles.basketSaveBtnText}>
                        {rtl ? `حفظ الاحتياجات (${basket.length})` : `Save Needs (${basket.length} selected)`}
                      </Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </ScrollView>
      )}

      {/* ── Donations tabs (pending / history) ── */}
      {activeTab !== "basket" && loading ? (
        <View style={styles.centeredState}>
          <ActivityIndicator color={Colors.primaryOrange} size="large" />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{rtl ? "جاري تحميل التبرعات…" : "Loading donations…"}</Text>
        </View>
      ) : activeTab !== "basket" && fetchError ? (
        <View style={styles.centeredState}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={[styles.stateText, rtl && styles.rtl]}>{fetchError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadDonations()} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{rtl ? "إعادة المحاولة" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab !== "basket" ? (
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
      ) : null}
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

  basketContent: { paddingHorizontal: Spacing.xl, paddingBottom: 40, paddingTop: Spacing.sm },
  basketTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, marginBottom: 6 },
  basketSub: { fontSize: 13, color: Colors.grayMedium, lineHeight: 19, marginBottom: 20 },

  basketChipsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20,
  },
  basketChip: {
    width: "47%", backgroundColor: Colors.white, borderRadius: 16,
    padding: 16, alignItems: "center", gap: 6,
    borderWidth: 2, borderColor: Colors.grayLight,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  basketChipSelected: {
    borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight,
  },
  basketChipIcon: { fontSize: 28 },
  basketChipText: { fontSize: 13, fontWeight: "700", color: Colors.grayMedium, textAlign: "center" },
  basketChipTextSelected: { color: Colors.primaryOrange },
  basketCheckBadge: {
    position: "absolute", top: 8, right: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primaryOrange, alignItems: "center", justifyContent: "center",
  },

  basketSuccessRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.greenLight, borderRadius: 10, padding: 10, marginBottom: 12,
  },
  basketSuccessText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },

  basketSaveBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 16, paddingVertical: 16,
    alignItems: "center",
  },
  basketSaveBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
});
