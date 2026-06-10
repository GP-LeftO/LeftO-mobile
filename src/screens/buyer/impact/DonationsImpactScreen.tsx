import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";

interface Props {
  donationCount: number;
  onClose: () => void;
}

const MILESTONES = [0, 5, 10, 25, 50];

export default function DonationsImpactScreen({ donationCount, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const count = donationCount ?? 0;

  const nextMilestone = MILESTONES.find(m => m > count) ?? MILESTONES[MILESTONES.length - 1];
  const prevMilestone = [...MILESTONES].reverse().find(m => m <= count) ?? 0;
  const pct = nextMilestone > prevMilestone
    ? Math.min(((count - prevMilestone) / (nextMilestone - prevMilestone)) * 100, 100)
    : 100;

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]}>أثري الاجتماعي 🤝</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🤝</Text>
          <Text style={styles.heroValue}>{count}</Text>
          <Text style={[styles.heroLabel, rtl && styles.rtl]}>
            {count === 1 ? "تبرعة أكملتها" : "تبرعات أكملتها"}
          </Text>
        </View>

        {/* Milestone progress */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.rtl]}>مسيرة العطاء 🌟</Text>
          <View style={styles.milestoneTrack}>
            {MILESTONES.map((m, i) => {
              const reached = count >= m;
              return (
                <React.Fragment key={m}>
                  <View style={[styles.milestoneNode, reached && styles.milestoneNodeDone]}>
                    <Text style={[styles.milestoneNum, reached && styles.milestoneNumDone]}>{m}</Text>
                  </View>
                  {i < MILESTONES.length - 1 && (
                    <View style={[styles.milestoneLine, count > m && styles.milestoneLineDone]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>

          {/* Progress bar to next milestone */}
          {count < MILESTONES[MILESTONES.length - 1] && (
            <View style={{ marginTop: 12, gap: 6 }}>
              <View style={[{ flexDirection: "row", justifyContent: "space-between" }, rtl && { flexDirection: "row-reverse" }]}>
                <Text style={{ fontSize: 12, color: Colors.grayMedium }}>{prevMilestone} تبرعة</Text>
                <Text style={{ fontSize: 12, color: Colors.primaryOrange, fontWeight: "700" }}>{nextMilestone} تبرعة</Text>
              </View>
              <View style={{ height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${pct}%`, backgroundColor: Colors.primaryOrange, borderRadius: 4 }} />
              </View>
              <Text style={[styles.encourageText, rtl && styles.rtl]}>
                أنت على بُعد {nextMilestone - count} تبرعة من الوصول إلى {nextMilestone}! 💪
              </Text>
            </View>
          )}

          {count >= MILESTONES[MILESTONES.length - 1] && (
            <Text style={[styles.encourageText, { color: Colors.greenMain }, rtl && styles.rtl]}>
              ✅ وصلت إلى أعلى مستوى! أنت بطل عطاء حقيقي 🏆
            </Text>
          )}
        </View>

        {/* Empty state */}
        {count === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>💚</Text>
            <Text style={[styles.emptyText, rtl && styles.rtl]}>
              أكمل أول تبرع لتبدأ رحلة العطاء!
            </Text>
          </View>
        )}

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={[styles.infoTitle, rtl && styles.rtl]}>كيف تتبرع؟</Text>
          <Text style={[styles.infoText, rtl && styles.rtl]}>
            عند حجز وجبة اختر "تبرع لجمعية" بدلاً من الحجز الشخصي، وسيصل طعامك لمستفيد محتاج عبر جمعية معتمدة.
          </Text>
        </View>
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
    backgroundColor: "#FDF2F8", borderRadius: 24, padding: Spacing.xl,
    alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#EC4899",
  },
  heroEmoji: { fontSize: 44 },
  heroValue: { fontSize: 56, fontWeight: "800", color: "#EC4899" },
  heroLabel: { fontSize: 15, color: "#BE185D", fontWeight: "600" },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.md, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.grayDark, marginBottom: 4 },
  milestoneTrack: { flexDirection: "row", alignItems: "center" },
  milestoneNode: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.grayLight, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: Colors.grayLight,
  },
  milestoneNodeDone: { backgroundColor: Colors.primaryOrange, borderColor: Colors.primaryOrange },
  milestoneNum: { fontSize: 11, fontWeight: "800", color: Colors.grayMedium },
  milestoneNumDone: { color: Colors.white },
  milestoneLine: { flex: 1, height: 3, backgroundColor: Colors.grayLight },
  milestoneLineDone: { backgroundColor: Colors.primaryOrange },
  encourageText: { fontSize: 13, color: Colors.primaryOrange, fontWeight: "600", lineHeight: 20 },
  emptyCard: {
    backgroundColor: "#FDF2F8", borderRadius: 20, padding: Spacing.xl,
    alignItems: "center", gap: 12,
  },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 14, color: "#BE185D", textAlign: "center", lineHeight: 22 },
  infoCard: {
    backgroundColor: Colors.greenLight, borderRadius: 20, padding: Spacing.md, gap: 8,
    borderWidth: 1, borderColor: Colors.greenMain,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", color: Colors.greenMain },
  infoText: { fontSize: 13, color: "#166534", lineHeight: 20 },
});
