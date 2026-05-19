import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity,
  StyleSheet, Platform, Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { t, isRTL } from "../../../i18n";
import type { CheckoutParams, Order } from "../../../types/order.types";

interface DonationConfirmedScreenProps {
  charityName: string;
  checkoutParams: CheckoutParams;
  quantity: number;
  order: Order;
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

export default function DonationConfirmedScreen({
  charityName,
  checkoutParams,
  quantity,
  order,
  onGoHome,
}: DonationConfirmedScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 44 : insets.top;
  const botPadding = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().donationConfirmed;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 6,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    });
  }, [scaleAnim, pulseAnim]);

  const pickupLabel = order.pickupStart && order.pickupEnd
    ? `${formatTime(order.pickupStart)} – ${formatTime(order.pickupEnd)}`
    : (checkoutParams.pickupWindow ?? "—");

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.content}>
        {/* Heart icon with pulse */}
        <Animated.View style={[
          styles.iconCircle,
          { transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }] }
        ]}>
          <Feather name="heart" size={52} color={Colors.white} />
        </Animated.View>

        <Text style={[styles.title, rtl && styles.textRight]}>{tr.title}</Text>
        <Text style={[styles.subtitle, rtl && styles.textRight]}>{tr.subtitle}</Text>
        <Text style={[styles.thankYou, rtl && styles.textRight]}>{tr.thankYou}</Text>

        {/* Donation details card */}
        <View style={styles.card}>
          <InfoRow label={tr.charity}  value={charityName} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.item}     value={checkoutParams.listingTitle} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.quantity} value={String(quantity)} rtl={rtl} />
          <View style={styles.divider} />
          <InfoRow label={tr.pickup}   value={pickupLabel} rtl={rtl} />
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
  container:  { flex: 1, backgroundColor: Colors.background },
  textRight:  { textAlign: "right" },
  row:        { flexDirection: "row", alignItems: "center" },
  rowReverse: { flexDirection: "row-reverse" },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },

  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.greenMain,
    alignItems: "center", justifyContent: "center",
    shadowColor: Colors.greenMain,
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
    fontSize: 16, fontWeight: "600",
    color: Colors.primaryOrange, textAlign: "center",
  },
  thankYou: {
    fontSize: 14, color: Colors.grayMedium,
    textAlign: "center", lineHeight: 20,
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
  infoValue: { fontSize: 14, fontWeight: "700", color: Colors.grayDark, flex: 1, textAlign: "right" },
  divider:   { height: 1, backgroundColor: Colors.grayLight },

  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
  },
  homeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.greenMain,
    borderRadius: 16, paddingVertical: 14,
  },
  homeBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },
});
