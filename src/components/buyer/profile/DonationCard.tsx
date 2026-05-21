import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import type { Translations } from "../../../i18n";
import type { ProfileOrder } from "../../../types/profile";

interface DonationCardProps {
  order: ProfileOrder;
  rtl: boolean;
  tr: Translations["profile"];
}

const STATUS_STYLE: Record<string, { bg: string; text: string }> = {
  COMPLETED: { bg: Colors.greenLight, text: Colors.greenDark },
  RESERVED:  { bg: Colors.orangeLight, text: Colors.orangeDark },
  CANCELLED: { bg: "#FEE2E2", text: "#B91C1C" },
};

export default function DonationCard({ order, rtl, tr }: DonationCardProps) {
  const recipientName =
    order.charity?.name ??
    order.listing?.seller?.businessName ??
    "—";

  const listingTitle = order.listing?.title ?? "—";
  const dateStr = new Date(order.createdAt).toLocaleDateString(
    rtl ? "ar-PS" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" }
  );

  const statusStyle = STATUS_STYLE[order.status] ?? STATUS_STYLE.RESERVED;
  const statusLabel = (tr.status as Record<string, string>)[order.status] ?? order.status;

  return (
    <View style={[styles.card, rtl && styles.cardRTL]}>
      {/* Heart icon + recipient name + status chip */}
      <View style={[styles.row, rtl && styles.rowRTL]}>
        <View style={styles.iconWrap}>
          <Feather name="heart" size={14} color={Colors.greenMain} />
        </View>
        <Text style={[styles.recipientName, rtl && styles.rtl]} numberOfLines={1}>
          {recipientName}
        </Text>
        <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Listing title */}
      <Text style={[styles.listingTitle, rtl && styles.rtl]} numberOfLines={2}>
        {listingTitle}
      </Text>

      {/* Date + quantity */}
      <View style={[styles.metaRow, rtl && styles.rowRTL]}>
        <Feather name="calendar" size={12} color={Colors.grayMedium} />
        <Text style={styles.metaText}>{dateStr}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Feather name="package" size={12} color={Colors.grayMedium} />
        <Text style={styles.metaText}>×{order.quantity}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
    borderRadius: 16,
    padding: Spacing.md,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.greenMain,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRTL: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: Colors.greenMain,
  },
  rtl: { textAlign: "right" },
  row: { flexDirection: "row", alignItems: "center" },
  rowRTL: { flexDirection: "row-reverse" },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: Colors.greenLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  recipientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: Colors.grayDark,
    marginRight: Spacing.sm,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  listingTitle: {
    fontSize: 13,
    color: Colors.grayMedium,
    lineHeight: 18,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: Colors.grayMedium },
  metaSep: { fontSize: 12, color: Colors.grayMedium },
});
