/**
 * HomeScreen
 *
 * Buyer discovery screen. Fetches nearby listings via useListings hook and
 * renders three horizontal sections:
 *   1. Surprise Bags Near You  (type === MEAL_BAG)
 *   2. Parcels & Groceries     (type === SPECIFIC_PARCEL)
 *   3. Popular Today           (all, sorted by lowest quantity first)
 *
 * Each section has a header with a "See all" link and a horizontal FlatList
 * of ListingCards (or SkeletonCards while loading, or an empty notice).
 * The outer ScrollView supports pull-to-refresh.
 */

import React, { useCallback, useState, useEffect } from "react";
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Platform, FlatList, RefreshControl,
  Alert, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import { useAuth } from "../../hooks/auth/useAuth";
import { useListings } from "../../hooks/buyer/useListings";
import { useHomeStats } from "../../hooks/buyer/useHomeStats";
import ListingCard, { SkeletonCard } from "../../components/buyer/ListingCard";
import LeftOLogo from "../../components/shared/LeftOLogo";
import NearMeEntryButton from "../../components/shared/NearMeEntryButton";
import type { Listing, StoreDetailsParams } from "../../types";
import type { NearMeCoords } from "../../types/nearMe";
import {
  fetchKaramSellers, sponsorKaramMeal,
  fetchMonthlyWinner, fetchRecommendedListings,
} from "../../services/shared/community.service";
import { useAppConfig } from "../../context/AppConfigContext";
import type { KaramSeller, MonthlyWinner } from "../../services/shared/community.service";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  onLogout?:               () => void;
  onListingPress?:         (params: StoreDetailsParams) => void;
  onSearchPress?:          () => void;
  onOpenNearMe?:           (coords: NearMeCoords) => void;
  onOpenNotifications?:    () => void;
  unreadNotifications?:    number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen({ onLogout, onListingPress, onSearchPress, onOpenNearMe, onOpenNotifications, unreadNotifications = 0 }: HomeScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl        = isRTL();
  const tr         = t().home;

  const { logout, user } = useAuth();
  const { surpriseBags, parcels, popularToday, loading, refreshing, error, onRefresh } = useListings();
  const stats = useHomeStats();

  // Community / Karam state
  const { isRamadanSeason, isIftarWindow, maghribTime } = useAppConfig();
  const [karamSellers,    setKaramSellers]    = useState<KaramSeller[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [sponsoringId,    setSponsoringId]    = useState<string | null>(null);
  const [monthlyWinner,   setMonthlyWinner]   = useState<MonthlyWinner | null>(null);
  const [rescueListings,  setRescueListings]  = useState<Listing[]>([]);
  const [maghribCountdown, setMaghribCountdown] = useState<string | null>(null);

  // Update Maghrib countdown every minute
  useEffect(() => {
    const calc = () => {
      if (!maghribTime) { setMaghribCountdown(null); return; }
      const diff = new Date(maghribTime).getTime() - Date.now();
      if (diff <= 0) { setMaghribCountdown(null); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setMaghribCountdown(h > 0 ? `${h}س ${m}د` : `${m}د`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [maghribTime]);

  const loadCommunity = useCallback(async () => {
    setCommunityLoading(true);
    try {
      const [karam, winner, rescue] = await Promise.allSettled([
        fetchKaramSellers(),
        fetchMonthlyWinner(),
        fetchRecommendedListings(),
      ]);
      if (karam.status  === "fulfilled") setKaramSellers(karam.value);
      if (winner.status === "fulfilled") setMonthlyWinner(winner.value);
      if (rescue.status === "fulfilled") {
        setRescueListings(rescue.value.filter((l) => l.rescueBadge != null).slice(0, 6));
      }
    } finally {
      setCommunityLoading(false);
    }
  }, []);

  useEffect(() => { loadCommunity(); }, [loadCommunity]);

  const handleSponsorKaram = async (seller: KaramSeller) => {
    setSponsoringId(seller.sellerId);
    try {
      await sponsorKaramMeal(seller.sellerId);
      Alert.alert(
        rtl ? "شكراً لك! 💚" : "Thank you! 💚",
        rtl ? "لقد مولّت وجبة لشخص محتاج." : "You just sponsored a meal for someone in need."
      );
      await loadCommunity();
    } catch {
      Alert.alert(rtl ? "خطأ" : "Error", rtl ? "تعذّر تمويل الوجبة." : "Could not sponsor. Please try again.");
    } finally {
      setSponsoringId(null);
    }
  };

  const handleLogout = useCallback(async () => {
    await logout();
    onLogout?.();
  }, [logout, onLogout]);

  const handleListingPress = useCallback((params: StoreDetailsParams) => {
    onListingPress?.(params);
  }, [onListingPress]);

  const renderCard = useCallback(({ item }: { item: Listing }) => (
    <ListingCard
      listing={item}
      rtl={rtl}
      onPress={handleListingPress}
      userAllergyPreferences={[]}
    />
  ), [rtl, handleListingPress]);

  const renderSkeleton = () => (
    <View style={styles.skeletonRow}>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );

  return (
    <View style={styles.container}>

      {/* ── Fixed header ── */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View>
          <Text style={[styles.greeting, rtl && styles.rtl]}>{tr.greeting}</Text>
          {user?.name ? (
            <Text style={[styles.userName, rtl && styles.rtl]} numberOfLines={1}>
              {user.name}
            </Text>
          ) : (
            <Text style={[styles.location, rtl && styles.rtl]}>Palestine</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <LeftOLogo size="sm" showText={false} />
          {onOpenNotifications && (
            <TouchableOpacity style={styles.bellBtn} onPress={onOpenNotifications} activeOpacity={0.7}>
              <Feather name="bell" size={20} color={Colors.grayDark} />
              {unreadNotifications > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadNotifications > 9 ? "9+" : String(unreadNotifications)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Feather name="log-out" size={18} color={Colors.grayMedium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primaryOrange}
            colors={[Colors.primaryOrange]}
          />
        }
      >

        {/* Search bar — tapping navigates to SearchScreen */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.7} onPress={onSearchPress}>
          <Feather name="search" size={18} color={Colors.grayMedium} />
          <Text style={[styles.searchPlaceholder, rtl && styles.rtl]}>
            {tr.searchPlaceholder}
          </Text>
          <View style={styles.filterBtn}>
            <Feather name="sliders" size={14} color={Colors.primaryOrange} />
          </View>
        </TouchableOpacity>

        {/* Near Me — AI location-based discovery */}
        {onOpenNearMe && (
          <NearMeEntryButton onPress={onOpenNearMe} />
        )}

        {/* Monthly winner banner */}
        {monthlyWinner && (
          <WinnerBanner winner={monthlyWinner} rtl={rtl} onPress={() => {
            // Navigate to seller store — pass through onListingPress with sellerId
            // For now show an alert; full deep-link requires sellerId → listing lookup
          }} />
        )}

        {/* Impact strip */}
        <View style={styles.impactStrip}>
          <ImpactStat
            icon="wind"
            label={tr.co2Saved}
            value={stats.loading ? "…" : stats.co2SavedKg != null ? `${stats.co2SavedKg.toFixed(1)} kg` : "—"}
          />
          <View style={styles.impactDivider} />
          <ImpactStat
            icon="dollar-sign"
            label={tr.moneySaved}
            value={stats.loading ? "…" : stats.moneySaved != null ? `₪${stats.moneySaved.toFixed(0)}` : "—"}
          />
          <View style={styles.impactDivider} />
          <ImpactStat
            icon="heart"
            label={tr.donations}
            value={stats.loading ? "…" : stats.donationCount != null ? String(stats.donationCount) : "—"}
          />
        </View>

        {/* Error state */}
        {error && !loading ? (
          <View style={styles.errorWrap}>
            <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
            <Text style={[styles.errorText, rtl && styles.rtl]}>{tr.error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={onRefresh} activeOpacity={0.8}>
              <Text style={styles.retryBtnText}>{tr.retry}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── Section 0: Rescue Now ── (listings with urgency badges) */}
            {rescueListings.length > 0 && (
              <>
                <SectionHeader title={rtl ? "⚡ أنقذها الآن" : "⚡ Rescue Now"} rtl={rtl} seeAllLabel={tr.seeAll} />
                <FlatList
                  data={rescueListings}
                  renderItem={renderCard}
                  keyExtractor={(item) => `rescue-${item.id}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  ItemSeparatorComponent={() => <View style={styles.cardGap} />}
                  scrollEventThrottle={16}
                />
              </>
            )}

            {/* ── Section 1: Surprise Bags ── */}
            <SectionHeader
              title={tr.surpriseBags}
              rtl={rtl}
              seeAllLabel={tr.seeAll}
            />
            {loading ? renderSkeleton() : (
              surpriseBags.length === 0
                ? <EmptySection label={tr.nothingAvailable} />
                : (
                  <FlatList
                    data={surpriseBags}
                    renderItem={renderCard}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    ItemSeparatorComponent={() => <View style={styles.cardGap} />}
                    scrollEventThrottle={16}
                  />
                )
            )}

            {/* ── Section 2: Parcels & Groceries ── */}
            <SectionHeader
              title={tr.parcels}
              rtl={rtl}
              seeAllLabel={tr.seeAll}
            />
            {loading ? renderSkeleton() : (
              parcels.length === 0
                ? <EmptySection label={tr.nothingAvailable} />
                : (
                  <FlatList
                    data={parcels}
                    renderItem={renderCard}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    ItemSeparatorComponent={() => <View style={styles.cardGap} />}
                    scrollEventThrottle={16}
                  />
                )
            )}

            {/* ── Section 3: Popular Today ── */}
            <SectionHeader
              title={tr.popularToday}
              rtl={rtl}
              seeAllLabel={tr.seeAll}
            />
            {loading ? renderSkeleton() : (
              popularToday.length === 0
                ? <EmptySection label={tr.nothingAvailable} />
                : (
                  <FlatList
                    data={popularToday}
                    renderItem={renderCard}
                    keyExtractor={(item) => `popular-${item.id}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    ItemSeparatorComponent={() => <View style={styles.cardGap} />}
                    scrollEventThrottle={16}
                  />
                )
            )}

            {/* ── Ramadan / Iftar Banner ── */}
            {isRamadanSeason && (
              <View style={styles.ramadanBanner}>
                <Text style={styles.ramadanBannerText}>
                  {isIftarWindow
                    ? (rtl ? "🌙 حان وقت الإفطار! — ابحث عن وجبات الإفطار القريبة منك" : "🌙 Iftar time! — Find nearby iftar meals")
                    : (rtl ? "🌙 رمضان كريم — ابحث عن وجبات الإفطار" : "🌙 Ramadan Mubarak — Find iftar meals")}
                </Text>
                {maghribCountdown && (
                  <Text style={styles.ramadanCountdown}>
                    🕌 {rtl ? `المغرب بعد: ${maghribCountdown}` : `Maghrib in: ${maghribCountdown}`}
                  </Text>
                )}
              </View>
            )}

            {/* ── Section 4: Karam Program (وجبة معلقة) ── */}
            {(communityLoading || karamSellers.length > 0) && (
              <>
                <SectionHeader title={rtl ? "برنامج كرم 💚" : "Karam Program 💚"} rtl={rtl} seeAllLabel={tr.seeAll} />
                {communityLoading ? renderSkeleton() : (
                  <FlatList
                    data={karamSellers}
                    keyExtractor={(item) => `karam-${item.sellerId}`}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    ItemSeparatorComponent={() => <View style={styles.cardGap} />}
                    scrollEventThrottle={16}
                    renderItem={({ item }) => (
                      <KaramCard
                        seller={item}
                        rtl={rtl}
                        onSponsor={handleSponsorKaram}
                        sponsoringId={sponsoringId}
                      />
                    )}
                  />
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
function formatMonth(ym: string): string {
  const [year, m] = ym.split("-");
  return `${ARABIC_MONTHS[parseInt(m, 10) - 1]} ${year}`;
}

function WinnerBanner({ winner, rtl, onPress }: { winner: MonthlyWinner; rtl: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.winnerBanner} activeOpacity={0.85} onPress={onPress}>
      <View style={[{ flex: 1 }]}>
        <Text style={[styles.winnerBannerTitle, rtl && { textAlign: "right" }]}>
          🏆 {rtl ? `بائع ${formatMonth(winner.month)}` : `Seller of ${formatMonth(winner.month)}`}
        </Text>
        <Text style={[styles.winnerBannerName, rtl && { textAlign: "right" }]} numberOfLines={1}>
          {winner.name}  ⭐ {winner.rating.toFixed(1)}
        </Text>
      </View>
      <Feather name="chevron-left" size={18} color="#fff" style={rtl ? { transform: [{ rotate: "180deg" }] } : undefined} />
    </TouchableOpacity>
  );
}

function ImpactStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.impactStat}>
      <Feather name={icon as "wind"} size={16} color={Colors.primaryOrange} />
      <Text style={styles.impactValue}>{value}</Text>
      <Text style={styles.impactLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  title, rtl, seeAllLabel,
}: { title: string; rtl: boolean; seeAllLabel: string }) {
  return (
    <View style={[styles.sectionHeader, rtl && styles.rowReverse]}>
      <Text style={[styles.sectionTitle, rtl && styles.rtl]}>{title}</Text>
      <TouchableOpacity activeOpacity={0.7}>
        <Text style={styles.seeAll}>{seeAllLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <View style={styles.emptySection}>
      <Text style={styles.emptyLabel}>{label}</Text>
    </View>
  );
}

function KaramCard({
  seller, rtl, onSponsor, sponsoringId,
}: { seller: KaramSeller; rtl: boolean; onSponsor: (s: KaramSeller) => void; sponsoringId: string | null }) {
  const isSponsoring = sponsoringId === seller.sellerId;
  const { available } = seller.today;
  return (
    <View style={styles.communityCard}>
      <View style={styles.communityCardTop}>
        <View style={styles.communityFreeBadge}>
          <Text style={styles.communityFreeBadgeText}>{rtl ? "كرم" : "Karam"}</Text>
        </View>
        <Text style={[styles.communityCardTitle, rtl && styles.rtl]} numberOfLines={2}>
          {seller.businessName}
        </Text>
        <Text style={[styles.communityCardSub, rtl && styles.rtl]}>
          {rtl ? `متاح: ${available} وجبة` : `${available} meal${available !== 1 ? "s" : ""} available`}
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.communityClaimBtn, (isSponsoring || available === 0) && { opacity: 0.5 }]}
        onPress={() => onSponsor(seller)}
        disabled={isSponsoring || available === 0}
        activeOpacity={0.85}
      >
        {isSponsoring
          ? <ActivityIndicator size="small" color={Colors.white} />
          : <Text style={styles.communityClaimBtnText}>
              {available === 0 ? (rtl ? "نفدت" : "None left") : (rtl ? "مول وجبة 💚" : "Sponsor 💚")}
            </Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl:       { textAlign: "right" },
  rowReverse: { flexDirection: "row-reverse" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  greeting: { fontSize: 14, color: Colors.grayMedium },
  userName: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, letterSpacing: -0.3, maxWidth: 180 },
  location: { fontSize: 13, color: Colors.grayMedium, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  bellBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute", top: -3, right: -3,
    backgroundColor: Colors.primaryOrange, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: { fontSize: 9, fontWeight: "800", color: Colors.white },

  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 100, gap: Spacing.md },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: Colors.grayMedium },
  filterBtn: { backgroundColor: Colors.orangeLight, borderRadius: 10, padding: 6 },

  impactStrip: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  impactStat:    { flex: 1, alignItems: "center", gap: 3 },
  impactValue:   { fontSize: 16, fontWeight: "800", color: Colors.grayDark },
  impactLabel:   { fontSize: 11, color: Colors.grayMedium },
  impactDivider: { width: 1, backgroundColor: Colors.grayLight },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  seeAll: { fontSize: 13, fontWeight: "600", color: Colors.primaryOrange },

  horizontalList: { paddingVertical: 4 },
  cardGap: { width: 12 },

  skeletonRow: { flexDirection: "row", gap: 12 },

  emptySection: {
    paddingVertical: Spacing.md,
    paddingLeft: 4,
  },
  emptyLabel: { fontSize: 13, color: Colors.grayMedium },

  errorWrap: { alignItems: "center", paddingTop: 60, gap: 12 },
  errorText: {
    fontSize: 14, color: Colors.grayMedium,
    textAlign: "center", maxWidth: 260, lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },

  // Community card
  communityCard: {
    width: 160, backgroundColor: Colors.white, borderRadius: 18,
    padding: Spacing.md, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  communityCardTop: { gap: 4 },
  communityFreeBadge: {
    backgroundColor: Colors.greenLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start",
  },
  communityFreeBadgeText: { fontSize: 10, fontWeight: "800", color: Colors.greenMain },
  communityCardTitle: { fontSize: 13, fontWeight: "700", color: Colors.grayDark, lineHeight: 17 },
  communityCardSub: { fontSize: 11, color: Colors.grayMedium },
  communityClaimBtn: {
    backgroundColor: Colors.greenMain, borderRadius: 10,
    paddingVertical: 8, alignItems: "center",
  },
  communityClaimBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },

  // Suspended meals header (with Share button)
  suspendedHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  postMealBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: Colors.greenMain, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  postMealBtnText: { fontSize: 12, fontWeight: "700", color: Colors.white },

  // Monthly winner banner
  winnerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D97706",
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginBottom: 4,
  },
  winnerBannerTitle: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  winnerBannerName:  { fontSize: 15, fontWeight: "800", color: "#fff" },

  // Ramadan banner
  ramadanBanner: {
    backgroundColor: "#7c3aed", borderRadius: 14,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    alignItems: "center", gap: 4,
  },
  ramadanBannerText: { fontSize: 14, fontWeight: "700", color: Colors.white },
  ramadanCountdown: { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.85)" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xl, gap: Spacing.md,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: Colors.grayDark },
  modalField: { gap: 6 },
  modalFieldLabel: { fontSize: 13, fontWeight: "700", color: Colors.grayDark },
  modalInput: {
    backgroundColor: Colors.white, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.grayLight,
    paddingHorizontal: Spacing.md, height: 46,
    fontSize: 14, color: Colors.grayDark,
  },
  rtlInput: { textAlign: "right" },
  modalRow: { flexDirection: "row", gap: 10 },
  postSubmitBtn: {
    backgroundColor: Colors.greenMain, borderRadius: 14,
    paddingVertical: 14, alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  postSubmitBtnText: { fontSize: 14, fontWeight: "700", color: Colors.white },
});
