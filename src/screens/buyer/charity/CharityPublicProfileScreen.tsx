import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";
import { useCharityDetail } from "../../../hooks/buyer/useCharities";

interface Props {
  charityId: string;
  onClose: () => void;
}

function ScoreBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const rtl = isRTL();
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={barStyles.row}>
      <View style={[barStyles.labelRow, rtl && { flexDirection: "row-reverse" }]}>
        <Text style={[barStyles.label, rtl && { textAlign: "right" }]}>{label}</Text>
        <Text style={[barStyles.pts, { color }]}>{value} / {max}</Text>
      </View>
      <View style={barStyles.track}>
        <View style={[barStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const barStyles = StyleSheet.create({
  row: { gap: 4 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 13, color: Colors.grayDark, fontWeight: "600" },
  pts: { fontSize: 13, fontWeight: "800" },
  track: { height: 8, backgroundColor: Colors.grayLight, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
});

export default function CharityPublicProfileScreen({ charityId, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const { detail, loading, error } = useCharityDetail(charityId);

  const trustColor = !detail ? Colors.grayMedium
    : detail.trustScore >= 80 ? Colors.greenMain
    : detail.trustScore >= 60 ? Colors.primaryOrange
    : Colors.grayMedium;

  const trustLabel = !detail ? ""
    : detail.trustScore >= 80 ? "⭐ موثوق جداً"
    : detail.trustScore >= 60 ? "✓ موثوق"
    : "جديد";

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : 0 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
          <Feather name="x" size={22} color={Colors.grayDark} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, rtl && styles.rtl]} numberOfLines={1}>
          {detail?.orgName ?? "الملف العام"}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      ) : error || !detail ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={Colors.grayMedium} />
          <Text style={styles.errorText}>تعذّر تحميل البيانات</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <View style={styles.heroCard}>
            <View style={styles.heroAvatar}>
              <Text style={styles.heroInitial}>{detail.orgName[0]}</Text>
            </View>
            <Text style={[styles.orgName, rtl && styles.rtl]}>{detail.orgName}</Text>
            {detail.verifiedBadge && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={14} color={Colors.greenMain} />
                <Text style={styles.verifiedText}>جمعية موثّقة ✅</Text>
              </View>
            )}
            <View style={[{ flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" }]}>
              {detail.region && (
                <View style={styles.pill}>
                  <Feather name="map-pin" size={12} color={Colors.primaryOrange} />
                  <Text style={styles.pillText}>{detail.region}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description */}
          {detail.description ? (
            <View style={styles.card}>
              <Text style={[styles.sectionTitle, rtl && styles.rtl]}>عن الجمعية</Text>
              <Text style={[styles.bodyText, rtl && styles.rtl]}>{detail.description}</Text>
            </View>
          ) : null}

          {/* Trust Score */}
          <View style={styles.card}>
            <View style={[{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, rtl && { flexDirection: "row-reverse" }]}>
              <Text style={[styles.sectionTitle, rtl && styles.rtl]}>درجة الثقة</Text>
              <View style={[styles.trustBadge, { backgroundColor: trustColor + "20", borderColor: trustColor }]}>
                <Text style={[styles.trustScore, { color: trustColor }]}>{detail.trustScore} / 100</Text>
              </View>
            </View>
            <Text style={[styles.trustLabel, { color: trustColor }, rtl && styles.rtl]}>{trustLabel}</Text>
            <View style={{ gap: 12, marginTop: 8 }}>
              <ScoreBar label="التحقق والوثائق" value={detail.breakdown.volume}        max={40} color="#6366F1" />
              <ScoreBar label="معدل الاستلام"   value={detail.breakdown.proofRate}     max={32} color={Colors.greenMain} />
              <ScoreBar label="تقييم المانحين"  value={detail.breakdown.rating}        max={24} color={Colors.primaryOrange} />
              <ScoreBar label="سرعة الاستجابة"  value={detail.breakdown.responseSpeed} max={6}  color="#F59E0B" />
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.card, { flexDirection: "row", justifyContent: "space-around" }, rtl && { flexDirection: "row-reverse" }]}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{detail.totalDonations}</Text>
              <Text style={[styles.statLabel, rtl && styles.rtl]}>تبرع كلي</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.greenMain }]}>{detail.confirmedCount}</Text>
              <Text style={[styles.statLabel, rtl && styles.rtl]}>مؤكدة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#F59E0B" }]}>{detail.avgRating?.toFixed(1) ?? "—"}</Text>
              <Text style={[styles.statLabel, rtl && styles.rtl]}>⭐ تقييم</Text>
            </View>
          </View>

          {/* Address */}
          {detail.address ? (
            <View style={[styles.card, { flexDirection: "row", gap: 10, alignItems: "flex-start" }, rtl && { flexDirection: "row-reverse" }]}>
              <Feather name="map-pin" size={16} color={Colors.primaryOrange} style={{ marginTop: 2 }} />
              <Text style={[styles.bodyText, { flex: 1 }, rtl && styles.rtl]}>{detail.address}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}
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
  headerTitle: { fontSize: 16, fontWeight: "800", color: Colors.grayDark, flex: 1, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 14, color: Colors.grayMedium },
  scroll: { padding: Spacing.md, gap: Spacing.sm, paddingBottom: 40 },
  heroCard: {
    backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.lg,
    alignItems: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  heroAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.greenLight, alignItems: "center", justifyContent: "center",
  },
  heroInitial: { fontSize: 30, fontWeight: "800", color: Colors.greenMain },
  orgName: { fontSize: 20, fontWeight: "800", color: Colors.grayDark },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.greenLight, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  verifiedText: { fontSize: 13, fontWeight: "700", color: Colors.greenMain },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.orangeLight, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, color: Colors.primaryOrange, fontWeight: "600" },
  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.md, gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", color: Colors.grayDark },
  bodyText: { fontSize: 14, color: Colors.grayMedium, lineHeight: 22 },
  trustBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5 },
  trustScore: { fontSize: 14, fontWeight: "800" },
  trustLabel: { fontSize: 13, fontWeight: "700" },
  statItem: { alignItems: "center", gap: 3, flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.primaryOrange },
  statLabel: { fontSize: 12, color: Colors.grayMedium },
  statDivider: { width: 1, backgroundColor: Colors.grayLight, alignSelf: "stretch" },
});
