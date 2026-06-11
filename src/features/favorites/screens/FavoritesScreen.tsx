import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { isRTL } from "../../../i18n";
import { Spacing } from "../../../theme";
import { useFavorites } from "../../../hooks/buyer/useFavorites";

import type { FavoriteListing } from "../../../services/buyer/favorites.service";
import type { StoreDetailsParams } from "../../../types";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FavoritesScreenProps {
  onBrowse?: () => void;
  onListingPress?: (params: StoreDetailsParams) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPickupTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function businessTypeChip(type: string): { label: string; bg: string; color: string } {
  switch (type?.toUpperCase()) {
    case "RESTAURANT": return { label: "مطعم",       bg: "#FFF7ED", color: "#DE985A" };
    case "MARKET":     return { label: "سوبرماركت",  bg: "#D1FAE5", color: "#16A34A" };
    case "BAKERY":     return { label: "مخبزة",       bg: "#FEF3C7", color: "#D97706" };
    default:           return { label: type ?? "",    bg: "#F3F4F6", color: "#6B7280" };
  }
}

// ─── Deleted listing card ─────────────────────────────────────────────────────

function DeletedCard({
  fav,
  rtl,
  onToggle,
}: {
  fav: FavoriteListing;
  rtl: boolean;
  onToggle: (listingId: string) => void;
}) {
  return (
    <View style={[dStyles.card, { flexDirection: rtl ? "row-reverse" : "row" }]}>
      <Feather name="alert-circle" size={20} color="#9CA3AF" />
      <View style={dStyles.textBlock}>
        <Text style={[dStyles.main, { textAlign: rtl ? "right" : "left" }]}>
          هذا الإدراج لم يعد متاحاً
        </Text>
        <Text style={[dStyles.sub, { textAlign: rtl ? "right" : "left" }]}>
          تم حذفه من قِبل البائع
        </Text>
      </View>
      <TouchableOpacity
        onPress={(e) => { e.stopPropagation(); onToggle(fav.listingId); }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Feather name="heart" size={22} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
}

const dStyles = StyleSheet.create({
  card: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  textBlock: { flex: 1 },
  main: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  sub:  { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
});

// ─── Active listing card ──────────────────────────────────────────────────────

type ActiveFav = FavoriteListing & { listing: NonNullable<FavoriteListing["listing"]> };

function ActiveCard({
  fav,
  rtl,
  onToggle,
  onPress,
}: {
  fav: ActiveFav;
  rtl: boolean;
  onToggle: (listingId: string) => void;
  onPress: (listingId: string, sellerId: string) => void;
}) {
  const l        = fav.listing;
  const isSoldOut = l.status === "SOLD_OUT";
  const chip     = businessTypeChip(l.seller.businessType);

  const discountPct =
    l.originalPrice > 0
      ? Math.round((1 - l.discountedPrice / l.originalPrice) * 100)
      : 0;

  const pickupWindow =
    l.pickupStart && l.pickupEnd
      ? `${formatPickupTime(l.pickupStart)} – ${formatPickupTime(l.pickupEnd)}`
      : null;

  return (
    <TouchableOpacity
      style={acStyles.card}
      activeOpacity={isSoldOut ? 0.6 : 0.85}
      onPress={() => { if (!isSoldOut) onPress(l.id, l.seller.id); }}
    >
      {/* Row 1: store info + heart */}
      <View style={[acStyles.row1, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <View style={[acStyles.leftBlock, { alignItems: rtl ? "flex-end" : "flex-start" }]}>
          <Text style={[acStyles.businessName, { textAlign: rtl ? "right" : "left" }]} numberOfLines={1}>
            {l.seller.businessName}
          </Text>
          <Text style={[acStyles.listingTitle, { textAlign: rtl ? "right" : "left" }]} numberOfLines={1}>
            {l.title}
          </Text>
          <View style={[acStyles.chip, { backgroundColor: chip.bg }]}>
            <Text style={[acStyles.chipText, { color: chip.color }]}>{chip.label}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onToggle(fav.listingId); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={22} color="#EF4444" />
        </TouchableOpacity>
      </View>

      {/* Row 2: price + pickup + quantity */}
      <View style={[acStyles.row2, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        {/* Price block */}
        <View style={acStyles.priceBlock}>
          <Text style={acStyles.originalPrice}>₪{l.originalPrice}</Text>
          <View style={[{ flexDirection: rtl ? "row-reverse" : "row" }, acStyles.priceInner]}>
            <Text style={acStyles.discountedPrice}>₪{l.discountedPrice}</Text>
            {discountPct > 0 && (
              <View style={acStyles.discountBadge}>
                <Text style={acStyles.discountBadgeText}>-{discountPct}%</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pickup window */}
        {pickupWindow && (
          <View style={[acStyles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
            <Feather name="clock" size={13} color="#6B7280" />
            <Text style={acStyles.metaText}>{pickupWindow}</Text>
          </View>
        )}

        {/* Quantity */}
        <View style={[acStyles.metaItem, { flexDirection: rtl ? "row-reverse" : "row" }]}>
          <Feather
            name="package"
            size={13}
            color={l.quantity <= 2 ? "#EF4444" : "#6B7280"}
          />
          <Text style={[acStyles.metaText, l.quantity <= 2 && acStyles.urgentText]}>
            {rtl ? `متبقي: ${l.quantity}` : `Left: ${l.quantity}`}
          </Text>
        </View>
      </View>

      {/* Sold-out overlay */}
      {isSoldOut && (
        <View style={acStyles.soldOutOverlay}>
          <Text style={acStyles.soldOutText}>نفدت الكمية</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const acStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    overflow: "hidden",
  },
  row1: {
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftBlock: { flex: 1, marginEnd: 12 },
  businessName:  { fontSize: 15, fontWeight: "700", color: "#404040" },
  listingTitle:  { fontSize: 13, color: "#6B7280", marginTop: 2 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 11, fontWeight: "600" },

  row2: {
    marginTop: 10,
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
  },
  priceBlock:       { gap: 2 },
  priceInner:       { alignItems: "center", gap: 6 },
  originalPrice:    { fontSize: 12, color: "#9CA3AF", textDecorationLine: "line-through" },
  discountedPrice:  { fontSize: 17, fontWeight: "700", color: "#DE985A" },
  discountBadge:    { backgroundColor: "#D1FAE5", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  discountBadgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },

  metaItem:   { alignItems: "center", gap: 4 },
  metaText:   { fontSize: 12, color: "#6B7280" },
  urgentText: { color: "#EF4444" },

  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutText: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function FavoritesScreen({ onBrowse, onListingPress }: FavoritesScreenProps) {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 44 : insets.top;
  const rtl    = isRTL();

  const {
    favorites,
    loading,
    refreshing,
    error,
    loadFavorites,
    refresh,
    toggleFavorite,
  } = useFavorites();

  useEffect(() => {
    loadFavorites();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isEmpty = !loading && !error && favorites.length === 0;

  const renderItem = useCallback(
    ({ item }: { item: FavoriteListing }) => {
      if (!item.listing) {
        return <DeletedCard fav={item} rtl={rtl} onToggle={toggleFavorite} />;
      }
      return (
        <ActiveCard
          fav={item as ActiveFav}
          rtl={rtl}
          onToggle={toggleFavorite}
          onPress={(listingId, sellerId) =>
            onListingPress?.({ listingId, sellerId })
          }
        />
      );
    },
    [rtl, toggleFavorite, onListingPress],
  );

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { flexDirection: rtl ? "row-reverse" : "row" }]}>
        <Text style={[styles.title, { textAlign: rtl ? "right" : "left" }]}>
          المفضلة
        </Text>
      </View>

      {/* ── Loading ── */}
      {loading && !refreshing && (
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#DE985A" />
        </View>
      )}

      {/* ── Error ── */}
      {!!error && !loading && (
        <View style={styles.centerWrap}>
          <Feather name="wifi-off" size={36} color="#9CA3AF" />
          <Text style={[styles.centerText, { textAlign: rtl ? "right" : "left" }]}>
            {error}
          </Text>
          <TouchableOpacity style={styles.ctaBtn} onPress={loadFavorites} activeOpacity={0.8}>
            <Text style={styles.ctaBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Empty state ── */}
      {isEmpty && (
        <View style={styles.centerWrap}>
          <Feather name="heart" size={56} color="#E5E7EB" />
          <Text style={[styles.emptyTitle, { textAlign: "center" }]}>
            لا توجد متاجر في المفضلة بعد
          </Text>
          <Text style={[styles.centerText, { textAlign: "center" }]}>
            اضغط على ❤️ على أي متجر لإضافته
          </Text>
          {onBrowse && (
            <TouchableOpacity style={styles.ctaBtn} onPress={onBrowse} activeOpacity={0.8}>
              <Text style={styles.ctaBtnText}>تصفح المتاجر</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── List ── */}
      {!loading && !error && favorites.length > 0 && (
        <FlatList<FavoriteListing>
          data={favorites}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor="#DE985A"
            />
          }
        />
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAF8" },

  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#404040" },

  listContent: { paddingTop: Spacing.sm, paddingBottom: 100 },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#404040" },
  centerText: { fontSize: 14, color: "#6B7280", lineHeight: 22 },

  ctaBtn: {
    backgroundColor: "#DE985A",
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 11,
    marginTop: 4,
  },
  ctaBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
