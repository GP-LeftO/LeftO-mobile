// FavoritesScreen — view only; calls useFavorites, renders listing cards

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { useColors } from "../../../hooks/shared/useColors";
import { t, isRTL } from "../../../i18n";
import { Colors, Spacing } from "../../../theme";
import ListingCard, { SkeletonCard } from "../../../components/buyer/ListingCard";

import { useFavorites } from "../hooks/useFavorites";

import type { FavoritesScreenProps } from "../types/favorites.types";
import type { Listing } from "../../../types";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function FavoritesSkeleton() {
  return (
    <View style={skStyles.wrap}>
      {([0, 1, 2] as const).map((i) => (
        <View key={i} style={skStyles.row}>
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  wrap: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, gap: 12 },
  row:  { flexDirection: "row", gap: 12 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FavoritesScreen({
  onBrowse,
  onListingPress,
}: FavoritesScreenProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;

  const colors = useColors();
  const rtl    = isRTL();
  const tr     = t().favorites;

  const {
    favoriteListings,
    isLoading,
    error,
    refetch,
  } = useFavorites();

  const [notifyEnabled, setNotifyEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("@favorites_notify")
      .then((v) => { if (v !== null) setNotifyEnabled(v === "true"); })
      .catch(() => {});
  }, []);

  const toggleNotify = () => {
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    AsyncStorage.setItem("@favorites_notify", String(next)).catch(() => {});
  };

  const isEmpty = !isLoading && !error && favoriteListings.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: Listing }) => (
      <ListingCard
        listing={item}
        rtl={rtl}
        onPress={onListingPress ?? (() => {})}
      />
    ),
    [rtl, onListingPress],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.border }, rtl && styles.rowReverse]}>
        <Text style={[styles.title, { color: colors.text }, rtl && styles.textEnd]}>
          {tr.title}
        </Text>
        <TouchableOpacity onPress={toggleNotify} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
          <Feather
            name={notifyEnabled ? "bell" : "bell-off"}
            size={20}
            color={notifyEnabled ? Colors.primaryOrange : Colors.grayMedium}
          />
        </TouchableOpacity>
      </View>

      {/* ── Loading ── */}
      {isLoading && <FavoritesSkeleton />}

      {/* ── Error ── */}
      {error && !isLoading && (
        <View style={styles.centerWrap}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={[styles.centerText, { color: colors.mutedForeground }, rtl && styles.textEnd]}>
            {tr.error}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={refetch} activeOpacity={0.8}>
            <Text style={styles.ctaBtnText}>{tr.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty state ── */}
      {isEmpty && (
        <View style={styles.centerWrap}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }, rtl && styles.textEnd]}>
            {tr.emptyTitle}
          </Text>
          <Text style={[styles.centerText, { color: colors.mutedForeground }, rtl && styles.textEnd]}>
            {tr.emptySubtitle}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={onBrowse} activeOpacity={0.8}>
            <Text style={styles.ctaBtnText}>{tr.browseStores}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Listing grid ── */}
      {!isLoading && !error && favoriteListings.length > 0 && (
        <FlatList<Listing>
          data={favoriteListings}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  rowReverse: { flexDirection: "row-reverse" },
  title: { fontSize: 22, fontWeight: "700", lineHeight: 30 },
  textEnd: { textAlign: "right" },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: 100,
  },
  columnWrapper: { gap: 12, marginBottom: 12 },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: 12,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  centerText: { fontSize: 15, textAlign: "center", lineHeight: 22 },

  ctaBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 11,
    marginTop: 4,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: Colors.white },

});
