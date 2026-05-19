import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { t, isRTL } from "../../../i18n";
import type { Order, CheckoutParams } from "../../../types/order.types";

interface OrderConfirmedScreenProps {
  order: Order;
  params: CheckoutParams;
  onGoHome: () => void;
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

function InfoRow({ label, value, rtl }: { label: string; value: string; rtl: boolean }) {
  return (
    <View style={[styles.infoRow, rtl && styles.rowReverse]}>
      <Text style={[styles.infoLabel, rtl && styles.textRight]}>{label}</Text>
      <Text style={[styles.infoValue, rtl && styles.textRight]}>{value}</Text>
    </View>
  );
}

export default function OrderConfirmedScreen({ order, params, onGoHome }: OrderConfirmedScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().orderConfirmed;

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
    }).start();
  }, [scaleAnim]);

  const pickupLabel = order.pickupStart && order.pickupEnd
    ? `${formatTime(order.pickupStart)} – ${formatTime(order.pickupEnd)}`
    : (params.pickupWindow ?? "—");

  const totalPrice = order.totalPrice != null
    ? `₪${order.totalPrice.toFixed(2)}`
    : `₪${(params.discountedPrice * order.quantity).toFixed(2)}`;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.content}>
        {/* Success icon with spring animation */}
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Feather name="check-circle" size={56} color={Colors.white} />
        </Animated.View>

        <Text style={[styles.title, rtl && styles.textRight]}>{tr.title}</Text>
        <Text style={[styles.subtitle, rtl && styles.textRight]}>{tr.subtitle}</Text>

        {/* Order details card */}
        <View style={styles.card}>
          <InfoRow label={tr.orderId}  value={`#${order.id.slice(0, 8).toUpperCase()}`} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.store}    value={params.storeName} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.pickup}   value={pickupLabel} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.quantity} value={String(order.quantity)} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.total}    value={totalPrice} rtl={rtl} />
        </View>

        {/* Cash reminder banner */}
        <View style={styles.cashBanner}>
          <Feather name="dollar-sign" size={18} color={Colors.greenMain} />
          <Text style={[styles.cashText, rtl && styles.textRight]}>{tr.cashReminder}</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: botPadding + 12 }]}>
        <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.85}>
          <Feather name="home" size={18} color={Colors.white} />
          <Text style={styles.homeBtnText}>{tr.backHome}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  textRight: { textAlign: "right" },
  row:       { flexDirection: "row", alignItems: "center" },
  rowReverse:{ flexDirection: "row-reverse" },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },

  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primaryOrange,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: 26, fontWeight: "800",
    color: Colors.grayDark, textAlign: "center",
  },
  subtitle: {
    fontSize: 15, color: Colors.grayMedium,
    textAlign: "center", lineHeight: 22,
    marginBottom: Spacing.sm,
  },

  card: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 0,
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 10,
  },
  infoLabel: { fontSize: 13, color: Colors.grayMedium, fontWeight: "500" },
  infoValue: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  divider:   { height: 1, backgroundColor: Colors.grayLight },

  cashBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#f0fdf4",
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.greenLight,
    width: "100%",
  },
  cashText: { flex: 1, fontSize: 13, color: "#166534", lineHeight: 18, fontWeight: "500" },

  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  homeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16, paddingVertical: 14,
  },
  homeBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
});
