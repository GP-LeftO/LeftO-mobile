import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Platform, Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { t, isRTL } from "../../../i18n";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImpactCelebrationScreenProps {
  co2SavedKg: number;
  moneySaved: number;
  pointsEarned: number;
  isDonation: boolean;
  newBadge?: string | null;
  onViewDetails: () => void;
  onGoHome: () => void;
}

// ─── Badge icon map (subset — same logic as BadgeGrid) ───────────────────────

const BADGE_META: Record<string, { icon: string; color: string; bg: string; labelEn: string; labelAr: string }> = {
  first_purchase:  { icon: "shopping-bag", color: "#f97316", bg: "#fff7ed", labelEn: "First Bag",       labelAr: "أول كيس"       },
  eco_hero:        { icon: "wind",         color: "#10b981", bg: "#ecfdf5", labelEn: "Eco Hero",         labelAr: "بطل البيئة"     },
  first_donation:  { icon: "heart",        color: "#ec4899", bg: "#fdf2f8", labelEn: "Kind Heart",       labelAr: "قلب طيب"       },
  loyal_customer:  { icon: "star",         color: "#8b5cf6", bg: "#f5f3ff", labelEn: "Loyal Saver",      labelAr: "مدخر وفيّ"     },
  top_saver:       { icon: "award",        color: "#f59e0b", bg: "#fffbeb", labelEn: "Top Saver",        labelAr: "أفضل مدخر"     },
  community_hero:  { icon: "users",        color: "#3b82f6", bg: "#eff6ff", labelEn: "Community Hero",   labelAr: "بطل المجتمع"   },
};

function resolveBadge(key: string) {
  if (BADGE_META[key]) return BADGE_META[key];
  const lower = key.toLowerCase();
  if (lower.includes("eco") || lower.includes("green"))   return BADGE_META.eco_hero;
  if (lower.includes("donat") || lower.includes("heart")) return BADGE_META.first_donation;
  if (lower.includes("buy")  || lower.includes("bag"))    return BADGE_META.first_purchase;
  if (lower.includes("loyal"))                             return BADGE_META.loyal_customer;
  return BADGE_META.top_saver;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const { width: W, height: H } = Dimensions.get("window");

const CONFETTI_COLORS = ["#f97316", "#10b981", "#6366f1", "#ec4899", "#f59e0b", "#3b82f6", "#22c55e", "#e11d48"];

interface ConfettiPiece {
  x: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  drift: number;
  anim: Animated.Value;
  rot: Animated.Value;
}

function Confetti() {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: 28 }, (_, i) => ({
      x:        Math.random() * W,
      size:     5 + Math.random() * 9,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay:    Math.random() * 600,
      duration: 2200 + Math.random() * 1600,
      drift:    (Math.random() - 0.5) * 100,
      anim:     new Animated.Value(0),
      rot:      new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    pieces.forEach((p) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.parallel([
            Animated.timing(p.anim, { toValue: 1, duration: p.duration, useNativeDriver: true }),
            Animated.timing(p.rot,  { toValue: 1, duration: p.duration, useNativeDriver: true }),
          ]),
          Animated.delay(300),
        ])
      ).start();
    });
  }, [pieces]);

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            left:   p.x,
            top:    0,
            width:  p.size,
            height: p.size,
            borderRadius: p.size / 4,
            backgroundColor: p.color,
            transform: [
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [-24, H + 24] }) },
              { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { rotate:     p.rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "540deg"] }) },
            ],
            opacity: p.anim.interpolate({ inputRange: [0, 0.08, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          }}
        />
      ))}
    </View>
  );
}

// ─── Animated CO₂ counter hook ────────────────────────────────────────────────

function useCountUp(target: number, duration: number, startDelay: number) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const anim = new Animated.Value(0);
      const id = anim.addListener(({ value }) => setDisplay(value));
      Animated.timing(anim, { toValue: target, duration, useNativeDriver: false }).start(() => {
        anim.removeListener(id);
        setDisplay(target);
      });
      return () => anim.removeListener(id);
    }, startDelay);
    return () => clearTimeout(timer);
  }, [target, duration, startDelay]);

  return display;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ImpactCelebrationScreen({
  co2SavedKg,
  moneySaved,
  pointsEarned,
  isDonation,
  newBadge,
  onViewDetails,
  onGoHome,
}: ImpactCelebrationScreenProps) {
  const insets     = useSafeAreaInsets();
  const topPad     = Platform.OS === "web" ? 44 : insets.top;
  const botPad     = Platform.OS === "web" ? 24 : insets.bottom;
  const rtl        = isRTL();
  const tr         = t().impactCelebration;

  // ── Entrance animations ───────────────────────────────────────────────────
  const contentSlide = useRef(new Animated.Value(60)).current;
  const contentFade  = useRef(new Animated.Value(0)).current;
  const iconScale    = useRef(new Animated.Value(0)).current;
  const badgeScale   = useRef(new Animated.Value(0)).current;
  const pointsFade   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(150),
      Animated.parallel([
        Animated.spring(contentSlide, { toValue: 0,  useNativeDriver: true, tension: 60, friction: 9 }),
        Animated.timing(contentFade,  { toValue: 1,  useNativeDriver: true, duration: 400 }),
        Animated.spring(iconScale,    { toValue: 1,  useNativeDriver: true, tension: 80, friction: 6 }),
      ]),
    ]).start();

    if (newBadge) {
      Animated.sequence([
        Animated.delay(1400),
        Animated.spring(badgeScale, { toValue: 1, useNativeDriver: true, tension: 100, friction: 6 }),
      ]).start();
    }

    Animated.sequence([
      Animated.delay(1800),
      Animated.timing(pointsFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [contentSlide, contentFade, iconScale, badgeScale, pointsFade, newBadge]);

  // ── CO₂ counter ───────────────────────────────────────────────────────────
  const showGrams  = co2SavedKg < 1;
  const co2Display = showGrams ? co2SavedKg * 1000 : co2SavedKg;
  const co2Count   = useCountUp(co2Display, 1800, 600);
  const co2Unit    = showGrams ? tr.co2Grams : tr.co2Kg;

  const kmNotDriven = (co2SavedKg / 0.21).toFixed(1);

  // ── Badge meta ────────────────────────────────────────────────────────────
  const badge = newBadge ? resolveBadge(newBadge) : null;

  return (
    <View style={[styles.screen, { paddingTop: topPad }]}>
      {/* Background confetti */}
      <Confetti />

      {/* Background tint */}
      <View style={styles.bgTint} pointerEvents="none" />

      {/* Main content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity:   contentFade,
            transform: [{ translateY: contentSlide }],
          },
        ]}
      >
        {/* Icon */}
        <Animated.View style={[styles.iconCircle, { transform: [{ scale: iconScale }] }]}>
          <Feather name={isDonation ? "heart" : "wind"} size={42} color={Colors.white} />
        </Animated.View>

        {/* Title */}
        <Text style={[styles.title, rtl && styles.textRight]}>
          {isDonation ? tr.titleDonate : tr.titleReserve}
        </Text>
        <Text style={[styles.subtitle, rtl && styles.textRight]}>
          {isDonation ? tr.subtitleDonate : tr.subtitleReserve}
        </Text>

        {/* CO₂ card */}
        <View style={styles.co2Card}>
          <View style={styles.co2IconWrap}>
            <Feather name="wind" size={22} color="#10b981" />
          </View>
          <View style={styles.co2Text}>
            <Text style={styles.co2Counter}>
              {showGrams
                ? `${Math.round(co2Count)} ${co2Unit}`
                : `${co2Count.toFixed(2)} ${co2Unit}`}
            </Text>
            <Text style={[styles.co2Label, rtl && styles.textRight]}>{tr.co2Label}</Text>
          </View>
          <View style={styles.co2Equiv}>
            <Feather name="navigation" size={12} color="#6b7280" />
            <Text style={[styles.co2EquivText, rtl && styles.textRight]}>
              {tr.equivalent.replace("{km}", kmNotDriven)}
            </Text>
          </View>
        </View>

        {/* Chips row: money + points */}
        <View style={[styles.chipsRow, rtl && styles.rowReverse]}>
          {moneySaved > 0 && (
            <View style={[styles.chip, styles.chipGreen]}>
              <Feather name="dollar-sign" size={13} color="#10b981" />
              <Text style={[styles.chipText, { color: "#10b981" }]}>
                {tr.moneySaved.replace("{amount}", moneySaved.toFixed(2))}
              </Text>
            </View>
          )}
          <Animated.View style={[styles.chip, styles.chipOrange, { opacity: pointsFade }]}>
            <Feather name="award" size={13} color={Colors.primaryOrange} />
            <Text style={[styles.chipText, { color: Colors.primaryOrange }]}>
              {tr.points.replace("{pts}", String(pointsEarned))}
            </Text>
          </Animated.View>
        </View>

        {/* Badge (if earned) */}
        {badge && (
          <Animated.View
            style={[styles.badgeCard, { transform: [{ scale: badgeScale }] }]}
          >
            <View style={[styles.badgeIcon, { backgroundColor: badge.bg }]}>
              <Feather name={badge.icon as "award"} size={22} color={badge.color} />
            </View>
            <View style={styles.badgeText}>
              <Text style={[styles.badgeEarned, { color: badge.color }]}>{tr.badgeEarned}</Text>
              <Text style={[styles.badgeName, rtl && styles.textRight]}>
                {rtl ? badge.labelAr : badge.labelEn}
              </Text>
            </View>
            <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
          </Animated.View>
        )}
      </Animated.View>

      {/* Buttons */}
      <Animated.View
        style={[styles.footer, { paddingBottom: botPad + 12, opacity: contentFade }]}
      >
        <TouchableOpacity
          style={[styles.detailsBtn, rtl && styles.rowReverse]}
          onPress={onViewDetails}
          activeOpacity={0.85}
        >
          <Text style={styles.detailsBtnText}>{tr.viewDetails}</Text>
          <Feather
            name={rtl ? "arrow-left" : "arrow-right"}
            size={16}
            color={Colors.primaryOrange}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.shareBtn, rtl && styles.rowReverse]}
          onPress={() => {
            const grams = Math.round(co2SavedKg * 1000);
            const km = (co2SavedKg * 4.6).toFixed(1);
            const msg = rtl
              ? `🌱 أنقذت وجبة مع LeftO اليوم!\nوفّرت ${grams > 1000 ? co2SavedKg + " كغ" : grams + " غ"} CO₂ — يعادل عدم قيادة ${km} كم 🇵🇸\n#LeftO #فلسطين`
              : `🌱 I rescued a meal with LeftO today!\nSaved ${grams > 1000 ? co2SavedKg + " kg" : grams + " g"} CO₂ — like skipping ${km} km of driving 🇵🇸\n#LeftO #Palestine`;
            Share.share({ message: msg }).catch(() => {});
          }}
          activeOpacity={0.85}
        >
          <Feather name="share-2" size={17} color={Colors.greenMain} />
          <Text style={styles.shareBtnText}>{rtl ? "شارك تأثيرك 🌱" : "Share your impact 🌱"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeBtn, rtl && styles.rowReverse]}
          onPress={onGoHome}
          activeOpacity={0.85}
        >
          <Feather name="home" size={17} color={Colors.white} />
          <Text style={styles.homeBtnText}>{tr.backHome}</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f0fdf4",
  },
  bgTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(240,253,244,0.55)",
  },
  textRight:  { textAlign: "right" },
  rowReverse: { flexDirection: "row-reverse" },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    gap: Spacing.md,
  },

  // Icon
  iconCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#10b981",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    marginBottom: Spacing.sm,
  },

  title:    { fontSize: 28, fontWeight: "800", color: Colors.grayDark, textAlign: "center", letterSpacing: -0.3 },
  subtitle: { fontSize: 15, color: Colors.grayMedium, textAlign: "center", lineHeight: 22 },

  // CO₂ card
  co2Card: {
    width: "100%",
    backgroundColor: Colors.white,
    borderRadius: 22,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    gap: 8,
  },
  co2IconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center", justifyContent: "center",
    alignSelf: "center",
    marginBottom: 2,
  },
  co2Text: { alignItems: "center" },
  co2Counter: {
    fontSize: 40,
    fontWeight: "800",
    color: "#10b981",
    lineHeight: 46,
    letterSpacing: -1,
  },
  co2Label: {
    fontSize: 13,
    color: Colors.grayMedium,
    fontWeight: "600",
    textAlign: "center",
  },
  co2Equiv: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  co2EquivText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },

  // Chips
  chipsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  chipGreen:  { backgroundColor: "#ecfdf5", borderWidth: 1, borderColor: "#bbf7d0" },
  chipOrange: { backgroundColor: Colors.orangeLight, borderWidth: 1, borderColor: "#fed7aa" },
  chipText:   { fontSize: 13, fontWeight: "700" },

  // Badge card
  badgeCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: Spacing.md,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
    position: "relative",
    overflow: "hidden",
  },
  badgeIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  badgeText: { flex: 1 },
  badgeEarned: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  badgeName:   { fontSize: 16, fontWeight: "800", color: Colors.grayDark, marginTop: 2 },
  badgeDot: {
    position: "absolute", top: 12, right: 12,
    width: 8, height: 8, borderRadius: 4,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: 10,
    backgroundColor: "transparent",
  },
  detailsBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 16, paddingVertical: 14,
    borderWidth: 2, borderColor: Colors.primaryOrange,
  },
  detailsBtnText: { fontSize: 15, fontWeight: "700", color: Colors.primaryOrange },
  homeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.primaryOrange,
    borderRadius: 16, paddingVertical: 14,
    shadowColor: Colors.primaryOrange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  homeBtnText: { fontSize: 16, fontWeight: "800", color: Colors.white },

  shareBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: Colors.greenLight,
    borderRadius: 16, paddingVertical: 14,
    borderWidth: 2, borderColor: Colors.greenMain,
  },
  shareBtnText: { fontSize: 15, fontWeight: "700", color: Colors.greenMain },
});
