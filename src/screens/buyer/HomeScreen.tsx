/**
 * HomeScreen
 *
 * Buyer discovery screen. Fetches nearby listings via useListings hook and
 * renders three horizontal sections:
 *   1. Surprise Bags Near You  (type === SURPRISE_BAG)
 *   2. Parcels & Groceries     (type === SPECIFIC_ITEM)
 *   3. Popular Today           (all, sorted by lowest quantity first)
 *
 * Each section has a header with a "See all" link and a horizontal FlatList
 * of ListingCards (or SkeletonCards while loading, or an empty notice).
 * The outer ScrollView supports pull-to-refresh.
 */

import React, { useCallback } from "react";
import {
  StyleSheet, Text, View, ScrollView,
  TouchableOpacity, Platform, FlatList, RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t, isRTL } from "../../i18n";
import { useAuth } from "../../hooks/useAuth";
import { useListings } from "../../hooks/useListings";
import ListingCard, { SkeletonCard } from "../../components/buyer/ListingCard";
import LeftOLogo from "../../components/LeftOLogo";
import type { Listing, StoreDetailsParams } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomeScreenProps {
  onLogout?:       () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeScreen({ onLogout, onListingPress }: HomeScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const rtl        = isRTL();
  const tr         = (t() as any).home;

  const { logout, user } = useAuth();
  const { surpriseBags, parcels, popularToday, loading, refreshing, error, onRefresh } = useListings();

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

        {/* Search bar */}
        <TouchableOpacity style={styles.searchBar} activeOpacity={0.7}>
          <Feather name="search" size={18} color={Colors.grayMedium} />
          <Text style={[styles.searchPlaceholder, rtl && styles.rtl]}>
            {tr.searchPlaceholder}
          </Text>
          <View style={styles.filterBtn}>
            <Feather name="sliders" size={14} color={Colors.primaryOrange} />
          </View>
        </TouchableOpacity>

        {/* Impact strip */}
        <View style={styles.impactStrip}>
          <ImpactStat icon="wind"       label={tr.co2Saved}   value={user?.co2Saved     != null ? `${user.co2Saved} kg` : "—"} />
          <View style={styles.impactDivider} />
          <ImpactStat icon="dollar-sign" label={tr.moneySaved} value={user?.moneySaved  != null ? `₪${user.moneySaved}` : "—"} />
          <View style={styles.impactDivider} />
          <ImpactStat icon="heart"       label={tr.donations}  value={user?.donationCount != null ? String(user.donationCount) : "—"} />
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
                    scrollEventThrottle={16}
                  />
                )
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

  skeletonRow: { flexDirection: "row", gap: Spacing.sm },

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
});
