import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { t, isRTL } from "../../../i18n";
import { useCheckout } from "../../../hooks/buyer/reserve/useCheckout";
import type { CheckoutParams, Order } from "../../../types/order.types";

interface CheckoutScreenProps {
  params: CheckoutParams;
  onBack: () => void;
  onReserved: (order: Order) => void;
  onDonate: (quantity: number) => void;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function isToday(iso: string): boolean {
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear()
      && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  } catch {
    return false;
  }
}

export default function CheckoutScreen({
  params,
  onBack,
  onReserved,
  onDonate,
}: CheckoutScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().checkout;

  const { quantity, loading, error, increaseQty, decreaseQty, submitReservation } = useCheckout(params.availableQuantity);

  const total        = (params.discountedPrice * quantity).toFixed(2);
  const pct          = Math.round(((params.originalPrice - params.discountedPrice) / params.originalPrice) * 100);
  const showToday    = params.pickupStart ? isToday(params.pickupStart) : false;
  const pickupLabel  = params.pickupStart && params.pickupEnd
    ? `${formatTime(params.pickupStart)} – ${formatTime(params.pickupEnd)}`
    : params.pickupWindow ?? "—";

  const handleReserve = async () => {
    try {
      const order = await submitReservation(params);
      onReserved(order);
    } catch {
      // error handled by hook
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name={rtl ? "arrow-right" : "arrow-left"} size={20} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{tr.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: botPadding + 120 }]}
      >
        {/* Listing info card */}
        <View style={styles.card}>
          <Text style={[styles.storeName, rtl && styles.textRight]}>{params.storeName}</Text>
          <Text style={[styles.listingTitle, rtl && styles.textRight]}>{params.listingTitle}</Text>
        </View>

        {/* Pickup window */}
        <View style={styles.card}>
          <View style={[styles.row, rtl && styles.rowReverse, { gap: 10 }]}>
            <View style={styles.iconWrap}>
              <Feather name="clock" size={16} color={Colors.primaryOrange} />
            </View>
            <View style={[styles.flex, rtl && styles.alignEnd]}>
              <Text style={styles.label}>{tr.pickup}</Text>
              <View style={[styles.row, rtl && styles.rowReverse, { gap: 8, flexWrap: "wrap" }]}>
                <Text style={[styles.value, rtl && styles.textRight]}>{pickupLabel}</Text>
                {showToday && (
                  <View style={styles.todayBadge}>
                    <Text style={styles.todayBadgeText}>{tr.today}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Quantity selector */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.textRight]}>{tr.quantity}</Text>
          <View style={[styles.qtyRow, rtl && styles.rowReverse]}>
            <TouchableOpacity
              style={[styles.qtyBtn, quantity === 1 && styles.qtyBtnDisabled]}
              onPress={decreaseQty}
              activeOpacity={0.7}
              disabled={quantity === 1}
            >
              <Feather name="minus" size={18} color={quantity === 1 ? Colors.grayMedium : Colors.grayDark} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, quantity === params.availableQuantity && styles.qtyBtnDisabled]}
              onPress={increaseQty}
              activeOpacity={0.7}
              disabled={quantity === params.availableQuantity}
            >
              <Feather name="plus" size={18} color={quantity === params.availableQuantity ? Colors.grayMedium : Colors.grayDark} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.available, rtl && styles.textRight]}>
            {tr.itemsAvailable.replace("{count}", String(params.availableQuantity))}
          </Text>
        </View>

        {/* Price summary */}
        <View style={styles.card}>
          <View style={[styles.priceRow, rtl && styles.rowReverse]}>
            <View style={[styles.flex, rtl && styles.alignEnd]}>
              <Text style={styles.label}>{tr.perItem}</Text>
              <View style={[styles.row, rtl && styles.rowReverse, { gap: 8 }]}>
                <Text style={styles.discountedPrice}>₪{params.discountedPrice.toFixed(2)}</Text>
                <Text style={styles.originalPrice}>₪{params.originalPrice.toFixed(2)}</Text>
                {pct > 0 && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountBadgeText}>{pct}% off</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={[styles.totalRow, rtl && styles.rowReverse]}>
            <Text style={styles.totalLabel}>{tr.total}</Text>
            <Text style={styles.totalValue}>₪{total}</Text>
          </View>
        </View>

        {/* Cash on pickup notice */}
        <View style={[styles.card, styles.cashCard]}>
          <View style={[styles.row, rtl && styles.rowReverse, { gap: 10 }]}>
            <Feather name="dollar-sign" size={20} color={Colors.greenMain} />
            <View style={[styles.flex, rtl && styles.alignEnd]}>
              <Text style={[styles.cashTitle, rtl && styles.textRight]}>{tr.cashOnPickup}</Text>
              <Text style={[styles.cashNote, rtl && styles.textRight]}>{tr.cashNote}</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        <Text style={[styles.terms, rtl && styles.textRight]}>{tr.terms}</Text>

        {/* Inline error */}
        {error ? (
          <View style={styles.errorCard}>
            <Feather name="alert-circle" size={16} color="#ef4444" />
            <Text style={[styles.errorText, rtl && styles.textRight]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.ctaBar, { paddingBottom: botPadding + 12 }]}>
        <TouchableOpacity
          style={[styles.reserveBtn, loading && styles.btnDisabled]}
          onPress={handleReserve}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} size="small" />
          ) : (
            <>
              <Feather name="check-circle" size={18} color={Colors.white} />
              <Text style={styles.reserveBtnText}>{tr.reserve}</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.donateBtn, loading && styles.btnDisabled]}
          onPress={() => onDonate(quantity)}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Feather name="gift" size={18} color={Colors.greenMain} />
          <Text style={styles.donateBtnText}>{tr.donate}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  textRight:   { textAlign: "right" },
  row:         { flexDirection: "row", alignItems: "center" },
  rowReverse:  { flexDirection: "row-reverse" },
  flex:        { flex: 1 },
  alignEnd:    { alignItems: "flex-end" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.grayLight,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.grayDark },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: Colors.grayLight,
  },

  scroll: { padding: Spacing.md, gap: Spacing.sm },

  card: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },

  storeName:    { fontSize: 13, fontWeight: "700", color: Colors.primaryOrange },
  listingTitle: { fontSize: 20, fontWeight: "800", color: Colors.grayDark, lineHeight: 26 },

  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.orangeLight,
    alignItems: "center", justifyContent: "center",
  },
  label: { fontSize: 12, color: Colors.grayMedium, fontWeight: "500", marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.grayDark },

  todayBadge: {
    backgroundColor: Colors.greenLight,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.greenMain },

  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.lg },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.grayLight,
    alignItems: "center", justifyContent: "center",
  },
  qtyBtnDisabled: { opacity: 0.4 },
  qtyValue: { fontSize: 26, fontWeight: "800", color: Colors.grayDark, minWidth: 40, textAlign: "center" },
  available: { fontSize: 12, color: Colors.grayMedium, textAlign: "center" },

  priceRow: { flexDirection: "row", alignItems: "flex-start" },
  discountedPrice: { fontSize: 24, fontWeight: "800", color: Colors.primaryOrange },
  originalPrice: {
    fontSize: 14, color: Colors.grayMedium,
    textDecorationLine: "line-through",
    alignSelf: "flex-end",
    marginBottom: 2,
  },
  discountBadge: {
    backgroundColor: Colors.greenLight, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: "flex-end",
  },
  discountBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.greenMain },
  divider: { height: 1, backgroundColor: Colors.grayLight, marginVertical: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontSize: 16, fontWeight: "700", color: Colors.grayDark },
  totalValue: { fontSize: 24, fontWeight: "800", color: Colors.primaryOrange },

  cashCard: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: Colors.greenLight },
  cashTitle: { fontSize: 14, fontWeight: "700", color: Colors.greenMain },
  cashNote:  { fontSize: 13, color: "#166534", lineHeight: 18 },

  terms: { fontSize: 12, color: Colors.grayMedium, textAlign: "center", lineHeight: 18, paddingHorizontal: Spacing.sm },

  errorCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#fef2f2", borderRadius: 14,
    padding: Spacing.md, borderWidth: 1, borderColor: "#fecaca",
  },
  errorText: { flex: 1, fontSize: 14, color: "#ef4444", lineHeight: 20 },

  ctaBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    paddingTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.grayLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  reserveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16, paddingVertical: 14,
  },
  reserveBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
  donateBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.greenLight,
    borderRadius: 16, paddingVertical: 14,
  },
  donateBtnText: { fontSize: 14, fontWeight: "700", color: Colors.greenMain },
  btnDisabled: { opacity: 0.6 },
});
