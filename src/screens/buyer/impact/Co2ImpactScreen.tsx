import React, { useRef, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";

interface Props {
  totalCo2KgSaved: number;
  onClose: () => void;
}

const BADGES = [
  { id: "first_save",     label: "أول إنقاذ 🌱",       target: 0.1  },
  { id: "eco_hero_10kg",  label: "بطل البيئة 🌍",        target: 10   },
  { id: "eco_champ_50kg", label: "بطل متقدم ♻️",         target: 50   },
  { id: "eco_legend",     label: "أسطورة البيئة 🏆",     target: 100  },
];

function BadgeProgress({ total }: { total: number }) {
  const rtl = isRTL();
  return (
    <View style={{ gap: 10 }}>
      {BADGES.map(b => {
        const pct = Math.min((total / b.target) * 100, 100);
        const done = total >= b.target;
        const anim = useRef(new Animated.Value(0)).current;
        useEffect(() => {
          Animated.timing(anim, { toValue: pct, duration: 800, useNativeDriver: false }).start();
        }, [pct]);
        const barW = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
        return (
          <View key={b.id} style={{ gap: 4 }}>
            <View style={[{ flexDirection: "row", justifyContent: "space-between" }, rtl && { flexDirection: "row-reverse" }]}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: done ? Colors.greenMain : Colors.grayDark }}>
                {b.label}
              </Text>
              <Text style={{ fontSize: 12, color: Colors.grayMedium }}>
                {done ? "✅" : `${total.toFixed(1)} / ${b.target} كغ`}
              </Text>
            </View>
            <View style={{ height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" }}>
              <Animated.View style={{ height: "100%", width: barW as any, backgroundColor: done ? Colors.greenMain : Colors.primaryOrange, borderRadius: 4 }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

export default function Co2ImpactScreen({ totalCo2KgSaved, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const kg = totalCo2KgSaved ?? 0;
  const grams = Math.round(kg * 1000);
  const km = (kg * 4.76).toFixed(1);
  const displayValue = grams >= 1000 ? `${kg.toFixed(2)} كغ` : `${grams} غ`;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>أثري البيئي 🌱</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Big CO₂ number */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🌍</Text>
          <Text style={styles.heroValue}>{displayValue}</Text>
          <Text style={[styles.heroLabel, rtl && styles.rtl]}>CO₂ وفّرته من الجو</Text>
          {kg > 0 && (
            <View style={styles.equivPill}>
              <Text style={styles.equivText}>يعادل عدم قيادة {km} كم</Text>
            </View>
          )}
        </View>

        {/* What is CO₂ */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.rtl]}>ما هو CO₂؟</Text>
          <Text style={[styles.bodyText, rtl && styles.rtl]}>
            ثاني أكسيد الكربون هو غاز ناتج عن إنتاج الطعام ونقله وتحلّله. كل وجبة تنقذها تقلل انبعاثاته وتحافظ على بيئتنا لأجيال قادمة.
          </Text>
        </View>

        {/* Badge progress */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.rtl]}>تقدّمك نحو الشارات 🏅</Text>
          <BadgeProgress total={kg} />
        </View>

        {/* Empty state */}
        {kg === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[styles.emptyText, rtl && styles.rtl]}>
              ابدأ بحجز أول وجبة لتبدأ رحلتك البيئية!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  rtl: { textAlign: "right" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.grayLight,
    backgroundColor: Colors.white,
  },
  closeBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: Colors.grayDark },
  scroll: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.greenLight, borderRadius: 24,
    padding: Spacing.xl, alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: Colors.greenMain,
  },
  heroEmoji: { fontSize: 48 },
  heroValue: { fontSize: 48, fontWeight: "800", color: Colors.greenMain },
  heroLabel: { fontSize: 15, color: "#166534", fontWeight: "600" },
  equivPill: {
    backgroundColor: Colors.white, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7, marginTop: 4,
  },
  equivText: { fontSize: 13, color: Colors.greenMain, fontWeight: "700" },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.md, gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.grayDark },
  bodyText: { fontSize: 14, color: Colors.grayMedium, lineHeight: 22 },
  emptyCard: {
    backgroundColor: Colors.greenLight, borderRadius: 20, padding: Spacing.xl,
    alignItems: "center", gap: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, color: "#166534", textAlign: "center", lineHeight: 22 },
});
