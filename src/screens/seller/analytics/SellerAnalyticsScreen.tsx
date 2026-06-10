import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '../../../theme';
import { isRTL } from '../../../i18n';
import { useSellerAnalytics } from '../../../hooks/seller/useSellerAnalytics';
import type { SellerAnalytics, PeakHour } from '../../../services/seller/analytics.service';

interface Props {
  onBack: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hourLabel(hour: number): string {
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const suffix = hour >= 12 ? 'م' : 'ص';
  return `${h12} ${suffix}`;
}

function generateInsight(d: SellerAnalytics): string {
  const peak = d.peakHours[0];
  const hl = peak ? hourLabel(peak.hour) : '';
  if (d.sellThroughRate < 50)
    return `معدل مبيعاتك ${d.sellThroughRate}% — جرب أن تنزل كميتك أو تقدّم وقت البيع. الذروة عندك الساعة ${hl}.`;
  if (d.sellThroughRate >= 70)
    return `ممتاز! ${d.sellThroughRate}% من وجباتك تُباع. الوقت المثالي للإدراج عندك الساعة ${hl}.`;
  return `نسبة مبيعك ${d.sellThroughRate}%. حاول الإدراج الساعة ${hl} لتحسين النتيجة.`;
}

// ─── Animated gauge ───────────────────────────────────────────────────────────

function SellThroughGauge({ rate }: { rate: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: rate,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [anim, rate]);

  const color = rate >= 70 ? Colors.greenMain : rate >= 40 ? Colors.primaryOrange : '#EF4444';
  const label = rate >= 70 ? 'ممتاز' : rate >= 40 ? 'جيد' : 'يحتاج تحسين';

  const barWidth = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={gaugeStyles.wrap}>
      <View style={gaugeStyles.labelRow}>
        <Text style={[gaugeStyles.rateText, { color }]}>{rate}%</Text>
        <Text style={[gaugeStyles.rateLabel, { color }]}>{label}</Text>
      </View>
      <View style={gaugeStyles.track}>
        <Animated.View style={[gaugeStyles.fill, { width: barWidth as any, backgroundColor: color }]} />
      </View>
      <Text style={gaugeStyles.sublabel}>من وجباتك تُباع</Text>
    </View>
  );
}

const gaugeStyles = StyleSheet.create({
  wrap: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rateText: { fontSize: 40, fontWeight: '800' },
  rateLabel: { fontSize: 14, fontWeight: '700' },
  track: { height: 12, backgroundColor: Colors.grayLight, borderRadius: 6, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 6 },
  sublabel: { fontSize: 13, color: Colors.grayMedium },
});

// ─── Peak hours bar chart ─────────────────────────────────────────────────────

function PeakChart({ hours, rtl }: { hours: PeakHour[]; rtl: boolean }) {
  if (hours.length === 0) return null;
  const max = Math.max(...hours.map(h => h.count));

  return (
    <View style={{ gap: 10 }}>
      {hours.map((h, i) => {
        const pct = max > 0 ? (h.count / max) * 100 : 0;
        const isTop = i === 0;
        const barColor = isTop ? Colors.primaryOrange : Colors.grayLight;
        const textColor = isTop ? Colors.primaryOrange : Colors.grayMedium;
        return (
          <View key={h.hour} style={[chartStyles.row, rtl && { flexDirection: 'row-reverse' }]}>
            <Text style={[chartStyles.hourLabel, { color: textColor, textAlign: rtl ? 'right' : 'left' }]}>
              {hourLabel(h.hour)}
            </Text>
            <View style={chartStyles.barTrack}>
              <View style={[chartStyles.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
            </View>
            <Text style={[chartStyles.countLabel, { color: textColor }]}>{h.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hourLabel: { width: 36, fontSize: 12, fontWeight: '600' },
  barTrack: { flex: 1, height: 10, backgroundColor: Colors.grayLight, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  countLabel: { width: 28, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={[statStyles.value, color ? { color } : {}]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.white, borderRadius: 16,
    padding: Spacing.md, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  value: { fontSize: 22, fontWeight: '800', color: Colors.primaryOrange },
  label: { fontSize: 12, color: Colors.grayMedium, textAlign: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SellerAnalyticsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const rtl = isRTL();
  const topPad = Platform.OS === 'web' ? 44 : insets.top;

  const { data, loading, error, refresh } = useSellerAnalytics();

  if (loading) {
    return (
      <View style={styles.container}>
        <Header onBack={onBack} rtl={rtl} topPad={topPad} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primaryOrange} />
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <Header onBack={onBack} rtl={rtl} topPad={topPad} />
        <View style={styles.center}>
          <Feather name="wifi-off" size={40} color={Colors.grayMedium} />
          <Text style={styles.errorText}>تعذّر تحميل التحليلات</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const insight = generateInsight(data);

  return (
    <View style={styles.container}>
      <Header onBack={onBack} rtl={rtl} topPad={topPad} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* ── Stats grid ── */}
        <View style={styles.grid}>
          <View style={styles.gridRow}>
            <StatCard
              value={`${data.totalRevenue.toFixed(0)} ₪`}
              label="إجمالي المبيعات"
              color={Colors.primaryOrange}
            />
            <StatCard
              value={`${data.totalItemsSold}`}
              label="الكمية المباعة"
            />
          </View>
          <View style={styles.gridRow}>
            <StatCard
              value={`${data.co2SavedKg.toFixed(1)} كغ`}
              label="CO₂ موفر"
              color={Colors.greenMain}
            />
            <StatCard
              value={`${data.activeListings}`}
              label="الإدراجات النشطة"
            />
          </View>
        </View>

        {/* ── Sell-through gauge ── */}
        <View style={styles.card}>
          <Text style={[styles.sectionTitle, rtl && styles.textRight]}>نسبة المبيع</Text>
          <SellThroughGauge rate={data.sellThroughRate} />
        </View>

        {/* ── Peak hours ── */}
        {data.peakHours.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, rtl && styles.textRight]}>أوقات الذروة ⏰</Text>
            <PeakChart hours={data.peakHours} rtl={rtl} />
          </View>
        )}

        {/* ── Top listing ── */}
        {data.topListing && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, rtl && styles.textRight]}>الأكثر طلباً 🏆</Text>
            <View style={[styles.topListingRow, rtl && styles.rowReverse]}>
              <View style={styles.topListingIcon}>
                <Feather name="trending-up" size={20} color={Colors.primaryOrange} />
              </View>
              <View style={[styles.topListingBody, rtl && styles.alignEnd]}>
                <Text style={[styles.topListingTitle, rtl && styles.textRight]}>
                  {data.topListing.title}
                </Text>
                <Text style={styles.topListingCount}>
                  {data.topListing.unitsSold} وجبة مباعة
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── AI insight ── */}
        <View style={styles.insightCard}>
          <View style={[styles.insightHeader, rtl && styles.rowReverse]}>
            <Text style={styles.insightIcon}>✨</Text>
            <Text style={[styles.insightTitle, rtl && styles.textRight]}>توصية ذكية</Text>
          </View>
          <Text style={[styles.insightText, rtl && styles.textRight]}>{insight}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ onBack, rtl, topPad }: { onBack: () => void; rtl: boolean; topPad: number }) {
  return (
    <View style={[styles.header, { paddingTop: topPad + 8 }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
        <Feather name={rtl ? 'arrow-right' : 'arrow-left'} size={22} color={Colors.grayDark} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>تحليلات المحل</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  textRight: { textAlign: 'right' },
  rowReverse: { flexDirection: 'row-reverse' },
  alignEnd: { alignItems: 'flex-end' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.grayDark },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { padding: Spacing.md, gap: Spacing.sm },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  errorText: { fontSize: 14, color: Colors.grayMedium },
  retryBtn: {
    backgroundColor: Colors.primaryOrange, borderRadius: 14,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: Colors.white },

  grid: { gap: Spacing.sm },
  gridRow: { flexDirection: 'row', gap: Spacing.sm },

  card: {
    backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.md, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.grayDark },

  topListingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topListingIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.orangeLight,
    alignItems: 'center', justifyContent: 'center',
  },
  topListingBody: { flex: 1, gap: 2 },
  topListingTitle: { fontSize: 15, fontWeight: '700', color: Colors.grayDark },
  topListingCount: { fontSize: 13, color: Colors.primaryOrange, fontWeight: '600' },

  insightCard: {
    backgroundColor: Colors.greenLight, borderRadius: 20,
    padding: Spacing.md, gap: 8,
    borderWidth: 1, borderColor: Colors.greenMain,
  },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  insightIcon: { fontSize: 18 },
  insightTitle: { fontSize: 14, fontWeight: '800', color: Colors.greenMain },
  insightText: { fontSize: 14, color: '#166534', lineHeight: 22 },
});
