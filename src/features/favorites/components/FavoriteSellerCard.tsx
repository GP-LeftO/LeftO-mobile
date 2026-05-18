// FavoriteSellerCard — dumb UI card for a saved seller; props in, JSX out

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { useColors } from "../../../hooks/shared/useColors";
import { t, isRTL } from "../../../i18n";
import { Spacing } from "../../../theme";

import type { FavoriteSellerCardProps } from "../types/favorites.types";

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_SIZE = 52 as const;
const ICON_HIT = { top: 10, bottom: 10, left: 10, right: 10 } as const;

// ─── Component ────────────────────────────────────────────────────────────────

const FavoriteSellerCard = memo(function FavoriteSellerCard({
  seller,
  isNotificationOn,
  onRemove,
  onToggleNotification,
  onPress,
}: FavoriteSellerCardProps) {
  const colors = useColors();
  const rtl = isRTL();
  const tr = t().favorites;

  const { activeListing } = seller;
  const isSoldOut = activeListing?.status === "SOLD_OUT";
  const avatarLetter = (seller.businessName ?? "?").charAt(0).toUpperCase();

  const listingTypeLabel =
    activeListing?.type === "MEAL_BAG"
      ? tr.surpriseBag
      : activeListing?.type === "SPECIFIC_PARCEL"
        ? tr.specificParcel
        : null;

  const pickupLabel =
    activeListing?.pickupStart && activeListing?.pickupEnd
      ? tr.pickupWindow
          .replace("{start}", activeListing.pickupStart)
          .replace("{end}", activeListing.pickupEnd)
      : null;

  const distanceLabel =
    seller.distanceKm !== undefined
      ? tr.distanceKm.replace("{dist}", seller.distanceKm.toFixed(1))
      : null;

  const itemsLeftLabel =
    activeListing && !isSoldOut
      ? tr.itemsLeft.replace("{count}", String(activeListing.itemsLeft))
      : null;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress(seller.id)}
      activeOpacity={0.82}
    >
      {/* ── Top row: avatar + name block + icon buttons ── */}
      <View style={[styles.topRow, rtl && styles.rowRev]}>

        {/* Avatar — letter fallback */}
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.avatarLetter, { color: colors.primary }]}>
            {avatarLetter}
          </Text>
        </View>

        {/* Name + listing type */}
        <View style={styles.nameBlock}>
          <Text
            style={[styles.businessName, { color: colors.text }, rtl && styles.textEnd]}
            numberOfLines={1}
          >
            {seller.businessName}
          </Text>

          {listingTypeLabel && (
            <Text
              style={[styles.listingType, { color: colors.mutedForeground }, rtl && styles.textEnd]}
              numberOfLines={1}
            >
              {listingTypeLabel}
            </Text>
          )}
        </View>

        {/* Bell + Heart — order reverses naturally with rowRev in RTL */}
        <View style={[styles.iconRow, rtl && styles.rowRev]}>
          <TouchableOpacity
            onPress={() => onToggleNotification(seller.id)}
            hitSlop={ICON_HIT}
            accessibilityLabel={isNotificationOn ? tr.notificationOn : tr.notificationOff}
          >
            <Feather
              name={isNotificationOn ? "bell" : "bell-off"}
              size={20}
              color={isNotificationOn ? colors.primary : colors.mutedForeground}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onRemove(seller.id)}
            hitSlop={ICON_HIT}
            accessibilityLabel={tr.removeFavorite}
          >
            <Feather name="heart" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Meta row: pickup window + distance ── */}
      {(pickupLabel || distanceLabel) && (
        <View style={[styles.metaRow, rtl && styles.rowRev]}>
          {pickupLabel && (
            <View style={[styles.metaItem, rtl && styles.rowRev]}>
              <Feather name="clock" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {pickupLabel}
              </Text>
            </View>
          )}

          {distanceLabel && (
            <View style={[styles.metaItem, rtl && styles.rowRev]}>
              <Feather name="map-pin" size={13} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {distanceLabel}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Divider ── */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* ── Price row + items left / sold out badge ── */}
      {activeListing && (
        <View style={[styles.priceRow, rtl && styles.rowRev]}>

          <View style={[styles.priceBlock, rtl && styles.rowRev]}>
            <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
              {activeListing.originalPrice} ILS
            </Text>
            <Text style={[styles.discountedPrice, { color: colors.primary }]}>
              {activeListing.discountedPrice} ILS
            </Text>
          </View>

          {isSoldOut ? (
            <View style={[styles.soldOutBadge, { backgroundColor: colors.muted }]}>
              <Text style={[styles.soldOutText, { color: colors.mutedForeground }]}>
                {tr.soldOut}
              </Text>
            </View>
          ) : (
            itemsLeftLabel && (
              <Text style={[styles.itemsLeft, { color: colors.green }]}>
                {itemsLeftLabel}
              </Text>
            )
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

export default FavoriteSellerCard;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Row utilities ──
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  rowRev: { flexDirection: "row-reverse" },
  textEnd: { textAlign: "right" },

  // ── Avatar ──
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: "700",
  },

  // ── Name block ──
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  businessName: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  listingType: {
    fontSize: 13,
    fontWeight: "400",
  },

  // ── Icon row ──
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flexShrink: 0,
  },

  // ── Meta ──
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "400",
  },

  // ── Divider ──
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },

  // ── Price row ──
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  originalPrice: {
    fontSize: 13,
    textDecorationLine: "line-through",
    fontWeight: "400",
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "700",
  },

  // ── Sold out badge ──
  soldOutBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // ── Items left ──
  itemsLeft: {
    fontSize: 13,
    fontWeight: "600",
  },
});
