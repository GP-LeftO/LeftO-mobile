/**
 * StoreDetailsScreen (placeholder)
 *
 * Placeholder screen shown when the user taps a listing card.
 * Receives { listingId, sellerId } as props and displays a "Coming soon"
 * message with a back button. Full implementation to follow.
 *
 * Navigation params expected:
 *   listingId — string — the ID of the tapped listing
 *   sellerId  — string — the seller's ID for fetching the store profile
 */

import React from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../theme";
import { isRTL } from "../../i18n";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreDetailsScreenProps {
  listingId: string;
  sellerId:  string;
  onBack:    () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StoreDetailsScreen({
  onBack,
}: StoreDetailsScreenProps) {
  const insets = useSafeAreaInsets();
  const rtl    = isRTL();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather
            name={rtl ? "arrow-right" : "arrow-left"}
            size={20}
            color={Colors.grayDark}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {rtl ? "تفاصيل المتجر" : "Store Details"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Feather name="shopping-bag" size={40} color={Colors.primaryOrange} />
        </View>
        <Text style={styles.comingSoon}>
          {rtl ? "قريباً" : "Coming Soon"}
        </Text>
        <Text style={styles.sub}>
          {rtl
            ? "ستتوفر تفاصيل المتجر في التحديث القادم"
            : "Full store details will be available in the next update"}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backButtonText}>
            {rtl ? "العودة" : "Go Back"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },
  headerTitle: {
    fontSize: 17, fontWeight: "700", color: Colors.grayDark,
  },

  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    gap: 14,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  comingSoon: {
    fontSize: 24, fontWeight: "800", color: Colors.grayDark,
  },
  sub: {
    fontSize: 14, color: Colors.grayMedium,
    textAlign: "center", lineHeight: 21, maxWidth: 260,
  },
  backButton: {
    marginTop: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15, fontWeight: "700", color: Colors.white,
  },
});
