import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import type { ProfileOrder } from "../../../types/profile";

interface Props {
  orders: ProfileOrder[];
  onClose: () => void;
}

const ARABIC_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
                       "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function fmtMonth(iso: string) {
  const d = new Date(iso);
  return `${ARABIC_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface MonthGroup { label: string; saved: number; count: number; }

function groupByMonth(orders: ProfileOrder[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const o of orders) {
    const key = o.createdAt.slice(0, 7);
    const orig = o.listing?.originalPrice ?? 0;
    const disc = o.listing?.discountedPrice ?? 0;
    const saved = (orig - disc) * o.quantity;
    if (!map.has(key)) map.set(key, { label: fmtMonth(o.createdAt), saved: 0, count: 0 });
    const g = map.get(key)!;
    g.saved += saved;
    g.count += 1;
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, v]) => v);
}

export default function MoneySavedScreen({ orders, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();

  const totalSaved = orders.reduce((sum, o) => {
    const orig = o.listing?.originalPrice ?? 0;
    const disc = o.listing?.discountedPrice ?? 0;
    return sum + (orig - disc) * o.quantity;
  }, 0);

  const totalPaid = orders.reduce((sum, o) => {
    return sum + (o.listing?.discountedPrice ?? 0) * o.quantity;
  }, 0);

  const totalOrig = totalSaved + totalPaid;
  const groups = groupByMonth(orders);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>مبلغ وفّرته 💰</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>💰</Text>
          <Text style={styles.heroValue}>₪{totalSaved.toFixed(2)}</Text>
          <Text style={[styles.heroLabel, rtl && styles.rtl]}>وفّرتها من ميزانيتك</Text>
          {totalOrig > 0 && (
            <Text style={[styles.heroSub, rtl && styles.rtl]}>
              بدلاً من دفع ₪{totalOrig.toFixed(0)} دفعت ₪{totalPaid.toFixed(0)}
            </Text>
          )}
        </View>

        {/* Monthly breakdown */}
        {groups.length > 0 ? (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, rtl && styles.rtl]}>التوفير الشهري 📅</Text>
            {groups.map((g, i) => (
              <View key={i} style={[styles.monthRow, i < groups.length - 1 && styles.monthRowBorder, rtl && styles.rowReverse]}>
                <View style={[styles.monthLeft, rtl && styles.alignEnd]}>
                  <Text style={[styles.monthLabel, rtl && styles.rtl]}>{g.label}</Text>
                  <Text style={styles.monthCount}>{g.count} وجبة</Text>
                </View>
                <Text style={styles.monthSaved}>₪{g.saved.toFixed(0)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>💸</Text>
            <Text style={[styles.emptyText, rtl && styles.rtl]}>
              أكمل أول حجز لترى كم وفّرت!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Sticky total */}
      {totalSaved > 0 && (
        <View style={styles.stickyTotal}>
          <Text style={[styles.stickyLabel, rtl && styles.rtl]}>المجموع الكلي</Text>
          <Text style={styles.stickyValue}>₪{totalSaved.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },
  rowReverse: { flexDirection: "row-reverse" },
  alignEnd: { alignItems: "flex-end" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },
  scroll: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 80 },
  heroCard: {
    backgroundColor: Colors.orangeLight, borderRadius: 24,
    padding: Spacing.xl, alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: Colors.primaryOrange,
  },
  heroEmoji: { fontSize: 44 },
  heroValue: { fontSize: 44, fontWeight: "800", color: Colors.primaryOrange },
  heroLabel: { fontSize: 15, color: Colors.primaryOrange, fontWeight: "600" },
  heroSub: { fontSize: 13, color: "#92400E", marginTop: 2 },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.md, gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.grayDark, marginBottom: 8 },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  monthRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.grayLight },
  monthLeft: { gap: 2 },
  monthLabel: { fontSize: 14, fontWeight: "700", color: Colors.grayDark },
  monthCount: { fontSize: 12, color: Colors.grayMedium },
  monthSaved: { fontSize: 16, fontWeight: "800", color: Colors.greenMain },
  emptyCard: {
    backgroundColor: Colors.orangeLight, borderRadius: 20, padding: Spacing.xl,
    alignItems: "center", gap: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, color: "#92400E", textAlign: "center", lineHeight: 22 },
  stickyTotal: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xl, paddingVertical: 16,
    borderTopWidth: 1, borderTopColor: Colors.grayLight,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  stickyLabel: { fontSize: 15, fontWeight: "700", color: Colors.grayMedium },
  stickyValue: { fontSize: 22, fontWeight: "800", color: Colors.greenMain },
});
