import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  I18nManager,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing } from "../../../theme";
import { t } from "../../../i18n";
import type { MapSeller } from "../types/browse.types";

interface ListingCardPreviewProps {
  seller: MapSeller | null;
  distanceKm: number | null;
  onReserve: (seller: MapSeller) => void;
  onDonate: (seller: MapSeller) => void;
}

export function ListingCardPreview({
  seller,
  distanceKm,
  onReserve,
  onDonate,
}: ListingCardPreviewProps) {
  const insets = useSafeAreaInsets();
  const rtl = I18nManager.isRTL;
  const tr = t().browse;

  // Hold a stable reference while the close animation plays
  const [visibleSeller, setVisibleSeller] = useState<MapSeller | null>(seller);
  const [visibleDist, setVisibleDist] = useState<number | null>(distanceKm);

  const slideAnim = useRef(new Animated.Value(340)).current;

  useEffect(() => {
    if (seller) {
      setVisibleSeller(seller);
      setVisibleDist(distanceKm);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 9,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 340,
        duration: 210,
        useNativeDriver: true,
      }).start(() => setVisibleSeller(null));
    }
  }, [seller, distanceKm, slideAnim]);

  if (!visibleSeller) return null;

  const s = visibleSeller;
  const listing = s.listing;
  const isSurprise = listing.type === "MEAL_BAG";
  const discount = Math.round(
    ((listing.originalPrice - listing.discountedPrice) / listing.originalPrice) * 100,
  );

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [{ translateY: slideAnim }],
          paddingBottom: insets.bottom + 12,
        },
      ]}
    >
      {/* Drag handle */}
      <View style={styles.handle} />

      {/* ── Header: logo + store name + type pills ── */}
      <View style={[styles.row, rtl && styles.rowRev, styles.headerRow]}>
        <View style={styles.logo}>
          <Text style={styles.logoEmoji}>🏪</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text
            style={[styles.storeName, rtl && styles.textRight]}
            numberOfLines={1}
          >
            {s.name}
          </Text>

          <View style={[styles.row, rtl && styles.rowRev, styles.pillsRow]}>
            <View
              style={[
                styles.pill,
                isSurprise ? styles.pillSurprise : styles.pillParcel,
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSurprise ? styles.pillTextSurprise : styles.pillTextParcel,
                ]}
              >
                {isSurprise ? tr.surpriseBag : tr.specificParcel}
              </Text>
            </View>

            {discount > 0 && (
              <View style={styles.pillDiscount}>
                <Text style={styles.pillTextDiscount}>−{discount}%</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Meta chips: pickup window / items left / distance ── */}
      <View style={[styles.chipsRow, rtl && styles.chipsRowRtl]}>
        {listing.pickupStart && listing.pickupEnd && (
          <View style={styles.chip}>
            <Feather name="clock" size={12} color={Colors.grayMedium} />
            <Text style={styles.chipText}>
              {listing.pickupStart} – {listing.pickupEnd}
            </Text>
          </View>
        )}

        <View style={styles.chip}>
          <Feather name="package" size={12} color={Colors.grayMedium} />
          <Text style={styles.chipText}>
            {tr.itemsLeft.replace("{count}", String(listing.itemsLeft))}
          </Text>
        </View>

        {visibleDist !== null && (
          <View style={styles.chip}>
            <Feather name="navigation" size={12} color={Colors.grayMedium} />
            <Text style={styles.chipText}>
              {tr.distanceKm.replace("{dist}", visibleDist.toFixed(1))}
            </Text>
          </View>
        )}
      </View>

      {/* ── Bottom: price + action buttons ── */}
      <View style={[styles.row, rtl && styles.rowRev, styles.bottomRow]}>
        {/* Pricing */}
        <View style={rtl ? styles.alignEnd : undefined}>
          <Text style={styles.priceDiscounted}>
            {listing.discountedPrice} ILS
          </Text>
          <Text style={styles.priceOriginal}>
            {listing.originalPrice} ILS
          </Text>
        </View>

        {/* CTAs */}
        <View style={[styles.row, rtl && styles.rowRev, styles.ctaRow]}>
          <TouchableOpacity
            style={styles.donateBtn}
            onPress={() => onDonate(s)}
            activeOpacity={0.8}
          >
            <Feather name="heart" size={14} color={Colors.greenMain} />
            <Text style={styles.donateBtnText}>{tr.donate}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reserveBtn}
            onPress={() => onReserve(s)}
            activeOpacity={0.8}
          >
            <Text style={styles.reserveBtnText}>{tr.reserve}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingHorizontal: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 12,
  },

  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.grayLight,
    marginBottom: 12,
  },

  row: { flexDirection: "row", alignItems: "center" },
  rowRev: { flexDirection: "row-reverse" },
  textRight: { textAlign: "right" },
  alignEnd: { alignItems: "flex-end" },

  // Header
  headerRow: { gap: 12, marginBottom: 10 },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.orangeLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoEmoji: { fontSize: 24 },
  headerInfo: { flex: 1 },
  storeName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.grayDark,
    marginBottom: 5,
  },
  pillsRow: { gap: 6 },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillSurprise: { backgroundColor: Colors.orangeLight },
  pillParcel: { backgroundColor: Colors.greenLight },
  pillText: { fontSize: 11, fontWeight: "600" },
  pillTextSurprise: { color: Colors.orangeDark },
  pillTextParcel: { color: Colors.greenDark },
  pillDiscount: {
    backgroundColor: Colors.greenLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pillTextDiscount: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.greenDark,
  },

  // Chips row
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginBottom: 14,
  },
  chipsRowRtl: { flexDirection: "row-reverse" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.grayLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, color: Colors.grayDark },

  // Bottom row
  bottomRow: { justifyContent: "space-between", alignItems: "center", gap: 8 },
  priceDiscounted: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.primaryOrange,
    lineHeight: 26,
  },
  priceOriginal: {
    fontSize: 12,
    color: Colors.grayMedium,
    textDecorationLine: "line-through",
  },

  ctaRow: { gap: 9 },
  donateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1.5,
    borderColor: Colors.greenMain,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  donateBtnText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },
  reserveBtn: {
    backgroundColor: Colors.primaryOrange,
    borderRadius: 12,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  reserveBtnText: { fontSize: 13, fontWeight: "700", color: Colors.white },
});
