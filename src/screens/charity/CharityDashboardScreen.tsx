import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";
import { useAuthContext } from "../../context/AuthContext";
import { useCharityDonations } from "../../hooks/charity/useCharityDonations";
import {
  getMyBasket,
  setMyBasket,
} from "../../services/charity/charity.service";
import type {
  BasketCategory,
  Donation,
  RatingInput,
} from "../../services/charity/charity.service";
import DonationIncomingCard from "../../components/charity/DonationIncomingCard";
import ProofUploadModal from "../../components/charity/ProofUploadModal";
import type { CardTab } from "../../components/charity/DonationIncomingCard";
import { useCharityTrustScore } from "../../hooks/charity/useCharityTrustScore";
import type { CharityTrustScore } from "../../services/buyer/stats.service";

// ─── Types ────────────────────────────────────────────────────────────────────

type DonationTab = "incoming" | "pickedUp" | "completed";
type ActiveTab = DonationTab | "basket";

interface Props {
  onLogout?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARITY_STATUS_INFO = {
  APPROVED: { icon: "check-circle" as const, color: Colors.greenMain,    label: "موثّقة"       },
  PENDING:  { icon: "clock"        as const, color: Colors.primaryOrange, label: "قيد المراجعة" },
  REJECTED: { icon: "x-circle"    as const, color: "#EF4444",            label: "مرفوضة"       },
};

const STATUS_TAB_MAP: Record<DonationTab, Donation["status"]> = {
  incoming:  "PENDING",
  pickedUp:  "PICKED_UP",
  completed: "CONFIRMED",
};

const CARD_TAB_MAP: Record<DonationTab, CardTab> = {
  incoming:  "incoming",
  pickedUp:  "pickedUp",
  completed: "completed",
};

const EMPTY: Record<DonationTab, { icon: string; label: string }> = {
  incoming:  { icon: "📭", label: "لا توجد تبرعات قادمة"  },
  pickedUp:  { icon: "📦", label: "لا توجد تبرعات مستلمة" },
  completed: { icon: "✅", label: "لا توجد تبرعات مكتملة" },
};

const BASKET_CATEGORIES: { key: BasketCategory; icon: string; labelAr: string }[] = [
  { key: "MEALS",              icon: "🍱", labelAr: "وجبات"       },
  { key: "BREAD_AND_PASTRIES", icon: "🥖", labelAr: "خبز ومعجنات" },
  { key: "GROCERIES",          icon: "🛒", labelAr: "بقالة"        },
  { key: "MIXED",              icon: "📦", labelAr: "متنوع"        },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CharityDashboardScreen({ onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const { user, charityStatus, clearSession } = useAuthContext();

  const {
    donations,
    loading,
    refreshing,
    error,
    ratedIds,
    refresh,
    markPickedUp,
    confirmWithProof,
    rateSeller,
  } = useCharityDonations();

  const { trust, loading: trustLoading } = useCharityTrustScore();

  const [activeTab,    setActiveTab]    = useState<ActiveTab>("incoming");
  const [proofModalId, setProofModalId] = useState<string | null>(null);

  // Basket state
  const [basket,        setBasket]        = useState<BasketCategory[]>([]);
  const [basketLoading, setBasketLoading] = useState(false);
  const [basketSaving,  setBasketSaving]  = useState(false);
  const [basketSaved,   setBasketSaved]   = useState(false);

  // Load basket once when the basket tab is first opened
  useEffect(() => {
    if (activeTab !== "basket" || basket.length > 0 || basketLoading) return;
    setBasketLoading(true);
    getMyBasket()
      .then(setBasket)
      .catch(() => {})
      .finally(() => setBasketLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const confirmedCount = useMemo(
    () => donations.filter((d) => d.status === "CONFIRMED").length,
    [donations]
  );

  const filteredDonations = useMemo(() => {
    if (activeTab === "basket") return [];
    return donations.filter(
      (d) => d.status === STATUS_TAB_MAP[activeTab as DonationTab]
    );
  }, [donations, activeTab]);

  const statusInfo = charityStatus
    ? (CHARITY_STATUS_INFO[charityStatus as keyof typeof CHARITY_STATUS_INFO] ?? null)
    : null;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleMarkPickedUp = useCallback(
    async (id: string) => {
      try {
        await markPickedUp(id);
      } catch {
        Alert.alert("خطأ", "تعذّر تحديث الحالة. يرجى المحاولة مجدداً.");
      }
    },
    [markPickedUp]
  );

  const handleConfirmWithProof = useCallback(
    async (id: string, imageUri?: string) => {
      await confirmWithProof(id, imageUri);
      setProofModalId(null);
    },
    [confirmWithProof]
  );

  const handleRateSeller = useCallback(
    async (donationId: string, ratings: RatingInput) => {
      const donation = donations.find((d) => d.id === donationId);
      const sellerId = donation?.sellerId ?? donation?.seller?.id ?? "";
      if (!sellerId) return;
      await rateSeller(donationId, sellerId, ratings);
    },
    [donations, rateSeller]
  );

  const toggleBasketCategory = useCallback((cat: BasketCategory) => {
    setBasket((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setBasketSaved(false);
  }, []);

  const handleSaveBasket = useCallback(async () => {
    if (basket.length === 0) {
      Alert.alert("تنبيه", "يرجى اختيار فئة واحدة على الأقل");
      return;
    }
    setBasketSaving(true);
    try {
      await setMyBasket(basket);
      setBasketSaved(true);
      setTimeout(() => setBasketSaved(false), 3000);
    } catch {
      Alert.alert("خطأ", "تعذّر حفظ الطلب");
    } finally {
      setBasketSaving(false);
    }
  }, [basket]);

  const handleLogout = useCallback(async () => {
    await clearSession();
    onLogout?.();
  }, [clearSession, onLogout]);

  const renderDonationCard = useCallback(
    ({ item }: { item: Donation }) => (
      <DonationIncomingCard
        donation={item}
        tab={CARD_TAB_MAP[activeTab as DonationTab]}
        isRated={ratedIds.has(item.id)}
        onMarkPickedUp={handleMarkPickedUp}
        onOpenProofModal={(id) => setProofModalId(id)}
        onRateSeller={handleRateSeller}
      />
    ),
    [activeTab, ratedIds, handleMarkPickedUp, handleRateSeller]
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
              {user?.name ?? "جمعيتي"}
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
        style={[styles.impactBanner, { flexDirection: rtl ? "row-reverse" : "row" }]}
      >
        <Text style={styles.impactCount}>{confirmedCount}</Text>
        <Text style={[styles.impactLabel, { textAlign: rtl ? "right" : "left" }]}>
          وجبة استلمتموها حتى الآن 🤝
        </Text>
      </Animated.View>

      {/* Tab Bar */}
      <Animated.View
        entering={FadeInDown.delay(220).duration(500).springify()}
        style={styles.tabBar}
      >
        {(
          [
            { key: "incoming",  icon: "inbox",        labelAr: "القادمة"   },
            { key: "pickedUp",  icon: "package",      labelAr: "مستلمة"    },
            { key: "completed", icon: "check-circle", labelAr: "مكتملة"    },
            { key: "basket",    icon: "list",         labelAr: "احتياجاتي" },
          ] as {
            key: ActiveTab;
            icon: "inbox" | "package" | "check-circle" | "list";
            labelAr: string;
          }[]
        ).map((tab) => (
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
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.labelAr}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>

      {/* ── Basket Tab ── */}
      {activeTab === "basket" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.basketContent}
        >
          {/* Trust Score Card */}
          {!trustLoading && trust && (
            <TrustScoreCard trust={trust} rtl={rtl} />
          )}

          <Text style={[styles.basketTitle, { textAlign: rtl ? "right" : "left" }]}>
            احتياجات الطعام
          </Text>
          <Text style={[styles.basketSub, { textAlign: rtl ? "right" : "left" }]}>
            اختر الفئات التي تحتاجها جمعيتك. البائعون سيرون طلباتك ويمكنهم التبرع بما يناسب.
          </Text>

          {basketLoading ? (
            <ActivityIndicator color={Colors.primaryOrange} style={{ marginTop: 24 }} />
          ) : (
            <>
              <View style={styles.basketChipsGrid}>
                {BASKET_CATEGORIES.map((cat) => {
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
                        {cat.labelAr}
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
                <View
                  style={[
                    styles.basketSuccessRow,
                    { flexDirection: rtl ? "row-reverse" : "row" },
                  ]}
                >
                  <Feather name="check-circle" size={15} color={Colors.greenMain} />
                  <Text style={styles.basketSuccessText}>تم الحفظ بنجاح!</Text>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.basketSaveBtn,
                  (basketSaving || basket.length === 0) && { opacity: 0.6 },
                ]}
                onPress={handleSaveBasket}
                disabled={basketSaving || basket.length === 0}
                activeOpacity={0.85}
              >
                {basketSaving ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.basketSaveBtnText}>
                    حفظ الاحتياجات ({basket.length})
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* ── Donation Tabs (incoming / pickedUp / completed) ── */}
      {activeTab !== "basket" && (
        loading ? (
          <View style={styles.centeredState}>
            <ActivityIndicator size="large" color={Colors.primaryOrange} />
            <Text style={styles.stateText}>جاري تحميل التبرعات…</Text>
          </View>
        ) : error ? (
          <View style={styles.centeredState}>
            <Feather name="wifi-off" size={42} color={Colors.grayMedium} />
            <Text style={styles.stateText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>حاول مجدداً</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDonations.length === 0 ? (
          <View style={styles.centeredState}>
            <Text style={styles.emptyEmoji}>
              {EMPTY[activeTab as DonationTab].icon}
            </Text>
            <Text style={[styles.emptyTitle, { textAlign: rtl ? "right" : "left" }]}>
              {EMPTY[activeTab as DonationTab].label}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredDonations}
            keyExtractor={(item) => item.id}
            renderItem={renderDonationCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={Colors.primaryOrange}
              />
            }
          />
        )
      )}

      {/* Proof Upload Modal */}
      {proofModalId !== null && (
        <ProofUploadModal
          visible
          donationId={proofModalId}
          onClose={() => setProofModalId(null)}
          onConfirm={handleConfirmWithProof}
        />
      )}
    </View>
  );
}

// ─── TrustScoreCard ──────────────────────────────────────────────────────────

const TRUST_DIMS: { key: keyof CharityTrustScore["breakdown"]; labelAr: string; max: number; icon: string }[] = [
  { key: "proofRate",     labelAr: "نسبة رفع الإثبات", max: 35, icon: "📋" },
  { key: "rating",        labelAr: "تقييم البائعين",    max: 30, icon: "⭐" },
  { key: "volume",        labelAr: "حجم التبرعات",      max: 25, icon: "📦" },
  { key: "responseSpeed", labelAr: "سرعة الاستجابة",   max: 10, icon: "⚡" },
];

function TrustScoreCard({ trust, rtl }: { trust: CharityTrustScore; rtl: boolean }) {
  const score = trust.trustScore;
  const barColor =
    score >= 70 ? Colors.greenMain :
    score >= 40 ? Colors.primaryOrange :
    "#ef4444";
  const label =
    score >= 70 ? "موثوقة جداً ✅" :
    score >= 40 ? "جيدة 👍" :
    "تحتاج تحسين ⚠️";

  return (
    <View style={trustStyles.card}>
      {/* Header */}
      <View style={[trustStyles.headerRow, rtl && { flexDirection: "row-reverse" as const }]}>
        <View style={trustStyles.iconWrap}>
          <Text style={{ fontSize: 18 }}>🛡️</Text>
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[trustStyles.title, rtl && { textAlign: "right" as const }]}>
            {rtl ? "درجة الثقة" : "Trust Score"}
          </Text>
          <Text style={[trustStyles.subtitle, rtl && { textAlign: "right" as const }]}>
            {rtl ? "مبنية على أداء جمعيتك في المنصة" : "Based on your platform activity"}
          </Text>
        </View>
        <View style={[trustStyles.scoreBadge, { backgroundColor: barColor + "18" }]}>
          <Text style={[trustStyles.scoreNum, { color: barColor }]}>{score}</Text>
          <Text style={[trustStyles.scoreMax, { color: barColor }]}>/100</Text>
        </View>
      </View>

      {/* Overall bar */}
      <View style={trustStyles.barBg}>
        <View style={[trustStyles.barFill, { width: `${score}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[trustStyles.labelText, { color: barColor }, rtl && { textAlign: "right" as const }]}>
        {label}
      </Text>

      {/* Dimension breakdown */}
      <View style={trustStyles.dimsGrid}>
        {TRUST_DIMS.map((dim) => {
          const val = trust.breakdown[dim.key];
          const pct = Math.round((val / dim.max) * 100);
          const dimColor = pct >= 70 ? Colors.greenMain : pct >= 40 ? Colors.primaryOrange : "#ef4444";
          return (
            <View key={dim.key} style={trustStyles.dimCard}>
              <Text style={trustStyles.dimIcon}>{dim.icon}</Text>
              <Text style={[trustStyles.dimLabel, rtl && { textAlign: "right" as const }]} numberOfLines={2}>
                {dim.labelAr}
              </Text>
              <View style={trustStyles.dimBarBg}>
                <View style={[trustStyles.dimBarFill, { width: `${pct}%` as any, backgroundColor: dimColor }]} />
              </View>
              <Text style={[trustStyles.dimScore, { color: dimColor }]}>
                {val}<Text style={trustStyles.dimMax}>/{dim.max}</Text>
              </Text>
            </View>
          );
        })}
      </View>

      {/* Footer context */}
      <View style={[trustStyles.footer, rtl && { flexDirection: "row-reverse" as const }]}>
        <Text style={[trustStyles.footerText, rtl && { textAlign: "right" as const }]}>
          {rtl
            ? `إجمالي التبرعات: ${trust.totalDonations} · المكتملة: ${trust.confirmedCount} · التقييم: ${trust.avgRating > 0 ? trust.avgRating.toFixed(1) : "—"}/5`
            : `Total: ${trust.totalDonations} donations · Confirmed: ${trust.confirmedCount} · Rating: ${trust.avgRating > 0 ? trust.avgRating.toFixed(1) : "—"}/5`
          }
        </Text>
      </View>
    </View>
  );
}

const trustStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: 20,
    borderWidth: 1.5, borderColor: "#e0e7ff",
    padding: Spacing.md, gap: 10, marginBottom: 4,
  },
  headerRow:  { flexDirection: "row", alignItems: "center", gap: 12 },
  iconWrap:   { width: 42, height: 42, borderRadius: 12, backgroundColor: "#eef2ff", alignItems: "center", justifyContent: "center" },
  title:      { fontSize: 15, fontWeight: "800", color: Colors.grayDark },
  subtitle:   { fontSize: 12, color: Colors.grayMedium },
  scoreBadge: { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
  scoreNum:   { fontSize: 22, fontWeight: "800" },
  scoreMax:   { fontSize: 11, fontWeight: "600" },

  barBg:   { height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  labelText: { fontSize: 12, fontWeight: "700", marginTop: -4 },

  dimsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dimCard: {
    flex: 1, minWidth: "45%", backgroundColor: Colors.background,
    borderRadius: 14, padding: 10, gap: 5,
  },
  dimIcon:    { fontSize: 18 },
  dimLabel:   { fontSize: 11, fontWeight: "600", color: Colors.grayDark, lineHeight: 15 },
  dimBarBg:   { height: 5, backgroundColor: Colors.grayLight, borderRadius: 3, overflow: "hidden" },
  dimBarFill: { height: 5, borderRadius: 3 },
  dimScore:   { fontSize: 14, fontWeight: "800" },
  dimMax:     { fontSize: 10, fontWeight: "400", color: Colors.grayMedium },

  footer:     { borderTopWidth: 1, borderTopColor: Colors.grayLight, paddingTop: 8, marginTop: 2 },
  footerText: { fontSize: 11, color: Colors.grayMedium },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
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
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  orgIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 4 },
  orgName:    { fontSize: 17, fontWeight: "800", color: Colors.grayDark, maxWidth: 200 },
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
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.greenLight,
    borderRadius: 14,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  impactCount: { fontSize: 36, fontWeight: "900", color: Colors.greenMain },
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
    gap: 4,
    paddingVertical: 11,
  },
  tabItemActive:  { backgroundColor: Colors.orangeLight },
  tabLabel:       { fontSize: 11, fontWeight: "600", color: Colors.grayMedium },
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
  emptyEmoji:  { fontSize: 52, marginBottom: 4 },
  emptyTitle:  { fontSize: 18, fontWeight: "800", color: Colors.grayDark, textAlign: "center" },

  // Basket
  basketContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 40,
    paddingTop: Spacing.sm,
  },
  basketTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark, marginBottom: 6 },
  basketSub:   { fontSize: 13, color: Colors.grayMedium, lineHeight: 19, marginBottom: 20 },
  basketChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  basketChip: {
    width: "47%",
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    borderColor: Colors.grayLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  basketChipSelected:     { borderColor: Colors.primaryOrange, backgroundColor: Colors.orangeLight },
  basketChipIcon:         { fontSize: 28 },
  basketChipText:         { fontSize: 13, fontWeight: "700", color: Colors.grayMedium, textAlign: "center" },
  basketChipTextSelected: { color: Colors.primaryOrange },
  basketCheckBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center",
    justifyContent: "center",
  },
  basketSuccessRow: {
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.greenLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  basketSuccessText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },
  basketSaveBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  basketSaveBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
});
