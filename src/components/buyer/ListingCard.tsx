/**
 * ListingCard
 *
 * Reusable card component for displaying a single food listing.
 * Handles: freshness badge, type pill, pickup time, pricing, quantity
 * indicator, sold-out overlay, heart favourite toggle, and allergen warning.
 * Also exports SkeletonCard for loading placeholder states.
 */

import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from "react-native";

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2; // 16 left + 16 right + 16 gap
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t } from "../../i18n";
import type { Listing, FreshnessBadge, ListingType } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing:                Listing;
  rtl:                    boolean;
  onPress:                (params: { listingId: string; sellerId: string }) => void;
  userAllergyPreferences?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function freshnessBadgeColor(badge: FreshnessBadge): string {
  switch (badge) {
    case "FRESH_TODAY": return Colors.greenMain;
    case "EAT_SOON":    return Colors.primaryOrange;
    case "LAST_CHANCE": return "#ef4444";
  }
}

function freshnessLabel(badge: FreshnessBadge, rtl: boolean): string {
  if (rtl) {
    switch (badge) {
      case "FRESH_TODAY": return "طازج اليوم";
      case "EAT_SOON":    return "كُل قريباً";
      case "LAST_CHANCE": return "فرصة أخيرة";
    }
  }
  switch (badge) {
    case "FRESH_TODAY": return "Fresh Today";
    case "EAT_SOON":    return "Eat Soon";
    case "LAST_CHANCE": return "Last Chance";
  }
}

function typeLabel(type: ListingType, rtl: boolean): string {
  if (type === "SURPRISE_BAG") return rtl ? t().home.surpriseBag  : t().home.surpriseBag;
  return rtl ? t().home.specificParcel : t().home.specificParcel;
}

function hasAllergenOverlap(allergenNote: string | undefined, prefs: string[]): boolean {
  if (!allergenNote || prefs.length === 0) return false;
  const note = allergenNote.toLowerCase();
  return prefs.some((p) => note.includes(p.toLowerCase()));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListingCard({
  listing,
  rtl,
  onPress,
  userAllergyPreferences = [],
}: ListingCardProps) {
  const [isFav, setIsFav] = useState(false);

  const tr = t().home;
  const isSoldOut = listing.status === "SOLD_OUT";

  const pickupWindow =
    listing.pickupStart && listing.pickupEnd
      ? `${formatTime(listing.pickupStart)} – ${formatTime(listing.pickupEnd)}`
      : null;

  const quantityColor =
    listing.quantity <= 1
      ? "#ef4444"
      : listing.quantity <= 3
      ? Colors.primaryOrange
      : Colors.grayMedium;

  const showAllergenWarning = hasAllergenOverlap(listing.allergenNote, userAllergyPreferences);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isSoldOut ? 0.6 : 0.85}
      onPress={() => onPress({ listingId: listing.id, sellerId: listing.seller.id })}
    >
      {/* ── Image placeholder area ── */}
      <View style={styles.cardImage}>
        <Feather name="shopping-bag" size={32} color={Colors.primaryOrange} />

        {/* Type pill */}
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{typeLabel(listing.type, rtl)}</Text>
        </View>

        {/* Freshness badge */}
        <View style={[styles.freshnessBadge, { backgroundColor: freshnessBadgeColor(listing.freshnessBadge) }]}>
          <Text style={styles.freshnessBadgeText}>{freshnessLabel(listing.freshnessBadge, rtl)}</Text>
        </View>

        {/* Sold-out overlay */}
        {isSoldOut && (
          <View style={styles.soldOutOverlay}>
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>{tr.soldOut}</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Card body ── */}
      <View style={styles.cardBody}>

        {/* Top row: store name + heart */}
        <View style={[styles.row, rtl && styles.rowReverse]}>
          <Text style={[styles.storeName, rtl && styles.textRight]} numberOfLines={1}>
            {listing.seller.businessName}
          </Text>
          <View style={[styles.row, { gap: 6 }]}>
            {showAllergenWarning && (
              <Feather name="alert-triangle" size={16} color="#f59e0b" />
            )}
            <TouchableOpacity
              onPress={() => setIsFav((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name={isFav ? "heart" : "heart"}
                size={18}
                color={isFav ? "#ef4444" : Colors.grayLight}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Listing title */}
        <Text style={[styles.title, rtl && styles.textRight]} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Pickup window */}
        {pickupWindow && (
          <View style={[styles.row, rtl && styles.rowReverse, { gap: 4 }]}>
            <Feather name="clock" size={12} color={Colors.grayMedium} />
            <Text style={styles.metaText}>{pickupWindow}</Text>
          </View>
        )}

        {/* Address */}
        {listing.seller.location?.address && (
          <View style={[styles.row, rtl && styles.rowReverse, { gap: 4 }]}>
            <Feather name="map-pin" size={12} color={Colors.grayMedium} />
            <Text style={styles.metaText} numberOfLines={1}>
              {listing.seller.location.address}
            </Text>
          </View>
        )}

        {/* Price row + quantity */}
        <View style={[styles.row, rtl && styles.rowReverse, styles.priceRow]}>
          <View style={[styles.row, { gap: 6, alignItems: "baseline" }]}>
            <Text style={styles.discountedPrice}>₪{listing.discountedPrice}</Text>
            <Text style={styles.originalPrice}>₪{listing.originalPrice}</Text>
          </View>

          <View style={[styles.row, { gap: 4 }]}>
            {listing.quantity <= 1 && !isSoldOut && (
              <Text style={styles.almostGone}>{tr.almostGone}</Text>
            )}
            {!isSoldOut && (
              <Text style={[styles.quantityBadge, { color: quantityColor }]}>
                {listing.quantity} {tr.left}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={[styles.cardImage, { backgroundColor: Colors.grayLight }]} />
      <View style={[styles.cardBody, { gap: 8 }]}>
        <View style={[styles.skeletonLine, { width: "60%", height: 14 }]} />
        <View style={[styles.skeletonLine, { width: "85%", height: 12 }]} />
        <View style={[styles.skeletonLine, { width: "45%", height: 12 }]} />
        <View style={[styles.skeletonLine, { width: "70%", height: 14 }]} />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  cardImage: {
    height: 120,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
  },

  typePill: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typePillText: { fontSize: 10, fontWeight: "700", color: Colors.white },

  freshnessBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  freshnessBadgeText: { fontSize: 10, fontWeight: "700", color: Colors.white },

  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutBadge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  soldOutText: { fontSize: 13, fontWeight: "800", color: Colors.white },

  cardBody: {
    padding: Spacing.sm,
    gap: 4,
    minHeight: 100,
  },

  row: { flexDirection: "row", alignItems: "center" },
  rowReverse: { flexDirection: "row-reverse" },
  textRight: { textAlign: "right" },

  storeName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primaryOrange,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.grayDark,
    lineHeight: 19,
  },
  metaText: {
    flex: 1,
    fontSize: 11,
    color: Colors.grayMedium,
  },

  priceRow: {
    justifyContent: "space-between",
    marginTop: 4,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primaryOrange,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.grayMedium,
    textDecorationLine: "line-through",
  },

  quantityBadge: {
    fontSize: 11,
    fontWeight: "600",
  },
  almostGone: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ef4444",
  },

  skeletonLine: {
    backgroundColor: Colors.grayLight,
    borderRadius: 6,
  },
});
