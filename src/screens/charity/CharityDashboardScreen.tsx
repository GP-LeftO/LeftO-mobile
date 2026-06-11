import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
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

interface Props {
  onLogout?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS: { key: ActiveTab; label: string; icon: "inbox" | "package" | "check-circle" }[] = [
  { key: "incoming",  label: "قادم",   icon: "inbox" },
  { key: "pickedUp",  label: "مستلمة", icon: "package" },
  { key: "completed", label: "مكتملة", icon: "check-circle" },
];

const CHARITY_STATUS = {
  APPROVED: { icon: "check-circle" as const, color: Colors.greenMain,    label: "موثّقة" },
  PENDING:  { icon: "clock"        as const, color: Colors.primaryOrange, label: "قيد المراجعة" },
  REJECTED: { icon: "x-circle"    as const, color: "#EF4444",            label: "مرفوضة" },
};

const EMPTY_TEXT: Record<ActiveTab, string> = {
  incoming:  "لا توجد تبرعات قادمة 📭",
  pickedUp:  "لا توجد تبرعات مستلمة",
  completed: "لا توجد تبرعات مكتملة",
};

const EMPTY_ICON: Record<ActiveTab, string> = {
  incoming:  "📭",
  pickedUp:  "📦",
  completed: "✅",
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CharityDashboardScreen({ onLogout }: Props) {
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

  const handleMarkPickedUp = useCallback(
    async (id: string) => {
      try {
        await markPickedUp(id);
      } catch {
        Alert.alert(
          rtl ? "خطأ" : "Error",
          rtl ? "تعذّر تحديث الحالة. يرجى المحاولة مجدداً." : "Could not update status."
        );
      }
    },
    [markPickedUp, rtl]
  );

  const handleOpenProofModal = useCallback((id: string) => {
    setSelectedDonationId(id);
    setModalVisible(true);
  }, []);

  const handleRateSeller = useCallback(
    async (donationId: string, ratings: RatingInput) => {
      const donation = donations.find((d) => d.id === donationId);
      const sellerId = donation?.sellerId ?? donation?.seller?.id ?? "";
      if (!sellerId) return;
      await rateSeller(donationId, sellerId, ratings);
    },
    [donations, rateSeller]
  );

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(60).duration(450).springify()}
        style={styles.header}
      >
        <View style={[styles.headerLeft, rtl && styles.rowReverse]}>
          <View style={styles.orgIconWrap}>
            <Feather name="heart" size={22} color={Colors.primaryOrange} />
          </View>
          <View style={styles.headerInfo}>
            <Text
              style={[styles.orgName, { textAlign: rtl ? "right" : "left" }]}
              numberOfLines={1}
            >
              {user?.name ?? (rtl ? "جمعيتي" : "My Charity")}
            </Text>
            {statusInfo && (
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + "18" }]}>
                <Feather name={statusInfo.icon} size={11} color={statusInfo.color} />
                <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
                  {statusInfo.label}
                </Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={Colors.grayMedium} />
        </TouchableOpacity>
      </Animated.View>

      {/* Impact Banner */}
      <Animated.View
        entering={FadeInDown.delay(130).duration(450).springify()}
        style={styles.impactBanner}
      >
        <Text style={styles.impactCount}>{confirmedCount}</Text>
        <Text style={[styles.impactLabel, { textAlign: rtl ? "right" : "left" }]}>
          {rtl ? "وجبة استلمتموها حتى الآن 🤝" : "meals received so far 🤝"}
        </Text>
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
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
          <Text style={[styles.stateText, { textAlign: rtl ? "right" : "left" }]}>
            {rtl ? "جاري تحميل التبرعات…" : "Loading donations…"}
          </Text>
        </View>
      ) : activeTab !== "basket" && fetchError ? (
        <View style={styles.centeredState}>
          <Feather name="wifi-off" size={42} color={Colors.grayMedium} />
          <Text style={[styles.stateText, { textAlign: rtl ? "right" : "left" }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={refresh}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>{rtl ? "حاول مجدداً" : "Retry"}</Text>
          </TouchableOpacity>
        </View>
      ) : activeTab !== "basket" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primaryOrange}
            />
          }
        >
          {filteredDonations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>{EMPTY_ICON[activeTab]}</Text>
              <Text style={[styles.emptyTitle, { textAlign: rtl ? "right" : "left" }]}>
                {EMPTY_TEXT[activeTab]}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rowReverse: { flexDirection: "row-reverse" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  orgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 4 },
  orgName: { fontSize: 17, fontWeight: "800", color: Colors.grayDark, maxWidth: 200 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // Impact Banner
  impactBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.greenLight,
    borderRadius: 14,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  impactCount: {
    fontSize: 36,
    fontWeight: "900",
    color: Colors.greenMain,
  },
  impactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.greenMain,
    flex: 1,
    flexWrap: "wrap",
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.grayLight,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
  },
  tabItemActive: { backgroundColor: Colors.orangeLight },
  tabLabel: { fontSize: 13, fontWeight: "600", color: Colors.grayMedium },
  tabLabelActive: { color: Colors.primaryOrange },

  // States
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: Spacing.xl,
  },
  stateText: { fontSize: 14, color: Colors.grayMedium, textAlign: "center" },
  retryBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  // List
  listContent: { paddingBottom: 40 },
  emptyState: { paddingTop: 80, alignItems: "center", gap: Spacing.sm },
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
