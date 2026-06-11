/**
 * ListingCard
 *
 * Reusable card component for displaying a single food listing.
 * Handles: freshness badge, type pill, pickup time, pricing, quantity
 * indicator, sold-out overlay, heart favourite toggle, and allergen warning.
 * Also exports SkeletonCard for loading placeholder states.
 */

import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Image,
  type GestureResponderEvent,
} from "react-native";

const CARD_WIDTH = (Dimensions.get("window").width - 48) / 2;
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { t } from "../../i18n";
import { useFavoritesContext } from "../../context/shared/FavoritesContext";
import { useAuthContext } from "../../context/AuthContext";
import type { Listing, FreshnessBadge, ListingType, RescueBadge } from "../../types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListingCardProps {
  listing:                 Listing;
  rtl:                     boolean;
  onPress:                 (params: { listingId: string; sellerId: string }) => void;
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

function freshnessBadgeColor(badge: FreshnessBadge | undefined): string {
  switch (badge) {
    case "eat_today":    return Colors.greenMain;
    case "fresh_tonight": return Colors.primaryOrange;
    case "good_1_2_days": return "#f59e0b";
    default:              return Colors.primaryOrange;
  }
}

function freshnessLabel(badge: FreshnessBadge | undefined, rtl: boolean): string {
  if (rtl) {
    switch (badge) {
      case "eat_today":    return "طازج اليوم";
      case "fresh_tonight": return "طازج الليلة";
      case "good_1_2_days": return "جيد 1-2 أيام";
      default:              return "";
    }
  }
  switch (badge) {
    case "eat_today":    return "Fresh Today";
    case "fresh_tonight": return "Fresh Tonight";
    case "good_1_2_days": return "Good 1-2 Days";
    default:              return "";
  }
}

function typeLabel(type: ListingType): string {
  if (type === "MEAL_BAG") return t().home.surpriseBag;
  return t().home.specificParcel;
}

function hasAllergenOverlap(allergenNote: string | undefined, prefs: string[]): boolean {
  if (!allergenNote || prefs.length === 0) return false;
  const note = allergenNote.toLowerCase();
  return prefs.some((p) => note.includes(p.toLowerCase()));
}

function computeCurrentPrice(listing: Listing): number {
  if (!listing.isPriceDecaying || !listing.floorPrice || !listing.expiryDate) {
    return listing.currentPrice ?? listing.discountedPrice;
  }
  const now   = Date.now();
  const start = listing.createdAt ? new Date(listing.createdAt).getTime() : now;
  const end   = new Date(listing.expiryDate).getTime();
  if (now >= end) return listing.floorPrice;
  if (now <= start) return listing.discountedPrice;
  const progress = (now - start) / (end - start);
  const price = listing.discountedPrice - progress * (listing.discountedPrice - listing.floorPrice);
  return Math.max(Math.round(price * 100) / 100, listing.floorPrice);
}

function timeUntilExpiry(expiryDate: string): string {
  const diff = new Date(expiryDate).getTime() - Date.now();
  if (diff <= 0) return "";
  const hours = Math.floor(diff / 3_600_000);
  const mins  = Math.floor((diff % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}س ${mins}د`;
  return `${mins}د`;
}

function rescueBadgeStyle(badge: RescueBadge): { bg: string; label: string } {
  switch (badge) {
    case "critical_rescue": return { bg: "#EF4444", label: "🔴 آخر فرصة" };
    case "expiring_soon":   return { bg: "#DE985A", label: "🟠 ينتهي قريباً" };
    default:                return { bg: "#16A34A", label: "✅ صفقة جيدة" };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ListingCard({
  listing,
  rtl,
  onPress,
  userAllergyPreferences = [],
}: ListingCardProps) {
  const { isFavorited, addFavorite, removeFavorite } = useFavoritesContext();
  const { user } = useAuthContext();
  const isBuyer     = user?.role === "BUYER";
  const isHearted   = isBuyer && isFavorited(listing.id);
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !listing.photoUrl || !listing.photoUrl.trim() || imageError;

  const tr = t().home;
  const isSoldOut = listing.status === "SOLD_OUT";

  // Tick every 60s so decaying prices re-render without a network call
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!listing.isPriceDecaying) return;
    const id = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(id);
  }, [listing.isPriceDecaying]);

  const livePrice = computeCurrentPrice(listing);

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
  const expiryCountdown = listing.isPriceDecaying && listing.expiryDate
    ? timeUntilExpiry(listing.expiryDate) : null;
  const rescueBadgeInfo = listing.rescueBadge ? rescueBadgeStyle(listing.rescueBadge) : null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={isSoldOut ? 0.6 : 0.85}
      onPress={() => onPress({ listingId: listing.id, sellerId: listing.seller.id })}
    >
      {/* ── Image area ── */}
      <View style={styles.cardImage}>
        {showPlaceholder ? (
          <Feather name="shopping-bag" size={32} color={Colors.primaryOrange} />
        ) : (
          <Image
            source={{ uri: listing.photoUrl! }}
            style={styles.cardPhoto}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}

        {/* Type pill */}
        <View style={styles.typePill}>
          <Text style={styles.typePillText}>{typeLabel(listing.type)}</Text>
        </View>

        {/* Freshness badge */}
        {listing.freshnessBadge && (
          <View style={[styles.freshnessBadge, { backgroundColor: freshnessBadgeColor(listing.freshnessBadge) }]}>
            <Text style={styles.freshnessBadgeText}>{freshnessLabel(listing.freshnessBadge, rtl)}</Text>
          </View>
        )}

        {/* Rescue badge (top-right on image) */}
        {!isSoldOut && rescueBadgeInfo && (
          <View style={[styles.rescueBadge, { backgroundColor: rescueBadgeInfo.bg }]}>
            <Text style={styles.rescueBadgeText}>{rescueBadgeInfo.label}</Text>
          </View>
        )}

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
            {isBuyer && (
              <TouchableOpacity
                onPress={(e: GestureResponderEvent) => {
                  e.stopPropagation();
                  if (isHearted) {
                    removeFavorite(listing.id);
                  } else {
                    addFavorite(listing.id);
                  }
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather
                  name="heart"
                  size={18}
                  color={isHearted ? "#ef4444" : Colors.grayLight}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Listing title */}
        <Text style={[styles.title, rtl && styles.textRight]} numberOfLines={2}>
          {listing.title}
        </Text>

        {/* Karam badge */}
        {listing.seller.participatesInKaram && (
          <View style={[styles.karamBadge, rtl && styles.karamBadgeRTL]}>
            <Text style={styles.karamBadgeText}>🤲 كرم</Text>
          </View>
        )}

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

        {/* Expiry date — SPECIFIC_PARCEL only */}
        {listing.type === "SPECIFIC_PARCEL" && listing.expiryDate && (() => {
          const daysLeft = Math.ceil((new Date(listing.expiryDate).getTime() - Date.now()) / 86_400_000);
          const isUrgent = daysLeft <= 2;
          const label = new Date(listing.expiryDate).toLocaleDateString(
            rtl ? "ar-PS" : "en-GB",
            { day: "numeric", month: "short" }
          );
          return (
            <View style={[styles.row, rtl && styles.rowReverse, { gap: 4 }]}>
              <Feather name="calendar" size={11} color={isUrgent ? "#ef4444" : Colors.grayMedium} />
              <Text style={[styles.metaText, isUrgent && { color: "#ef4444" }]}>
                {rtl ? `ينتهي: ${label}` : `Exp: ${label}`}
              </Text>
            </View>
          );
        })()}

        {/* Decay label + countdown */}
        {listing.isPriceDecaying && (
          <View style={[styles.row, rtl && styles.rowReverse, { gap: 4, marginTop: 2 }]}>
            <Text style={styles.decayLabel}>🔥 ينخفض تلقائياً</Text>
            {expiryCountdown ? (
              <Text style={styles.countdownText}>⏰ {expiryCountdown}</Text>
            ) : null}
          </View>
        )}

        {/* Price row + quantity */}
        <View style={[styles.row, rtl && styles.rowReverse, styles.priceRow]}>
          <View style={[styles.row, { gap: 6, alignItems: "baseline" }]}>
            <Text style={styles.discountedPrice}>₪{livePrice}</Text>
            <Text style={styles.originalPrice}>₪{listing.originalPrice}</Text>
            {listing.isPriceDecaying && listing.floorPrice != null && (
              <Text style={styles.floorPriceText}>أدنى ₪{listing.floorPrice}</Text>
            )}
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
    overflow: "hidden",
  },
  cardPhoto: {
    ...StyleSheet.absoluteFillObject,
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

  rescueBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  rescueBadgeText: { fontSize: 9, fontWeight: "700", color: Colors.white },

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

  decayLabel: {
    fontSize: 10,
    color: Colors.primaryOrange,
    fontWeight: "600",
  },
  countdownText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "600",
  },
  floorPriceText: {
    fontSize: 10,
    color: Colors.grayMedium,
  },

  skeletonLine: {
    backgroundColor: Colors.grayLight,
    borderRadius: 6,
  },

  karamBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#D1FAE5",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.greenMain,
  },
  karamBadgeRTL: {
    alignSelf: "flex-end",
  },
  karamBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.greenMain,
  },
});
