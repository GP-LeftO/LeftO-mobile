import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing } from "../../../theme";
import { isRTL } from "../../../i18n";

// ─── Standard badge catalogue ─────────────────────────────────────────────────
// Shown to every user. Earned badges are unlocked; the rest appear locked
// so users know exactly what they're working toward.

interface BadgeDef {
  key: string;
  labelEn: string;
  labelAr: string;
  icon: string;
  color: string;
  bg: string;
}

const STANDARD_BADGES: BadgeDef[] = [
  {
    key: "first_purchase",
    labelEn: "First Bag",
    labelAr: "أول كيس",
    icon: "shopping-bag",
    color: "#f97316",
    bg: "#fff7ed",
  },
  {
    key: "eco_hero",
    labelEn: "Eco Hero",
    labelAr: "بطل البيئة",
    icon: "wind",
    color: "#10b981",
    bg: "#ecfdf5",
  },
  {
    key: "first_donation",
    labelEn: "Kind Heart",
    labelAr: "قلب طيب",
    icon: "heart",
    color: "#ec4899",
    bg: "#fdf2f8",
  },
  {
    key: "loyal_customer",
    labelEn: "Loyal Saver",
    labelAr: "مدخر وفيّ",
    icon: "star",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    key: "top_saver",
    labelEn: "Top Saver",
    labelAr: "أفضل مدخر",
    icon: "award",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    key: "community_hero",
    labelEn: "Community Hero",
    labelAr: "بطل المجتمع",
    icon: "users",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
];

// ─── Icon resolver for unknown badge keys returned by the backend ─────────────

function resolveBadge(key: string): BadgeDef {
  const lower = key.toLowerCase();
  if (lower.includes("eco") || lower.includes("green") || lower.includes("co2"))
    return { key, labelEn: key, labelAr: key, icon: "wind",         color: "#10b981", bg: "#ecfdf5" };
  if (lower.includes("donat") || lower.includes("charity") || lower.includes("heart"))
    return { key, labelEn: key, labelAr: key, icon: "heart",        color: "#ec4899", bg: "#fdf2f8" };
  if (lower.includes("buy") || lower.includes("bag") || lower.includes("purchase"))
    return { key, labelEn: key, labelAr: key, icon: "shopping-bag", color: "#f97316", bg: "#fff7ed" };
  if (lower.includes("loyal") || lower.includes("streak") || lower.includes("regular"))
    return { key, labelEn: key, labelAr: key, icon: "star",         color: "#8b5cf6", bg: "#f5f3ff" };
  if (lower.includes("sav") || lower.includes("money"))
    return { key, labelEn: key, labelAr: key, icon: "dollar-sign",  color: "#f59e0b", bg: "#fffbeb" };
  if (lower.includes("communit") || lower.includes("social"))
    return { key, labelEn: key, labelAr: key, icon: "users",        color: "#3b82f6", bg: "#eff6ff" };
  return   { key, labelEn: key, labelAr: key, icon: "award",        color: "#f59e0b", bg: "#fffbeb" };
}

// ─── Single badge card ────────────────────────────────────────────────────────

function BadgeCard({ def, unlocked }: { def: BadgeDef; unlocked: boolean }) {
  const rtl = isRTL();
  const label = rtl ? def.labelAr : def.labelEn;

  return (
    <View style={[styles.card, unlocked ? styles.cardUnlocked : styles.cardLocked]}>
      {/* Icon area */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: unlocked ? def.bg : "#f3f4f6" },
        ]}
      >
        <Feather
          name={def.icon as "award"}
          size={24}
          color={unlocked ? def.color : "#9ca3af"}
        />

        {/* Lock overlay */}
        {!unlocked && (
          <View style={styles.lockOverlay}>
            <Feather name="lock" size={11} color="#6b7280" />
          </View>
        )}

        {/* Earned glow ring */}
        {unlocked && (
          <View style={[styles.glowRing, { borderColor: def.color + "40" }]} />
        )}
      </View>

      {/* Label */}
      <Text
        style={[styles.label, unlocked ? { color: "#1f2937" } : styles.labelLocked]}
        numberOfLines={2}
      >
        {label}
      </Text>

      {unlocked && (
        <View style={[styles.earnedDot, { backgroundColor: def.color }]} />
      )}
    </View>
  );
}

// ─── BadgeGrid ────────────────────────────────────────────────────────────────

interface BadgeGridProps {
  /** Array of badge key strings returned by GET /api/users/me */
  earnedBadges: string[];
}

export default function BadgeGrid({ earnedBadges }: BadgeGridProps) {
  const rtl = isRTL();

  // Normalise earned keys to lowercase for matching
  const earnedSet = new Set(earnedBadges.map((b) => b.toLowerCase()));

  // Start from standard catalogue; add any extras the backend returned
  const catalogue: BadgeDef[] = [...STANDARD_BADGES];
  earnedBadges.forEach((key) => {
    const norm = key.toLowerCase();
    if (!STANDARD_BADGES.some((b) => b.key === norm)) {
      catalogue.push(resolveBadge(key));
    }
  });

  // Unlocked first, then locked
  const sorted = [
    ...catalogue.filter((b) => earnedSet.has(b.key)),
    ...catalogue.filter((b) => !earnedSet.has(b.key)),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.scroll,
        rtl && styles.scrollRTL,
      ]}
    >
      {sorted.map((def) => (
        <BadgeCard
          key={def.key}
          def={def}
          unlocked={earnedSet.has(def.key)}
        />
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = 78;
const CARD_H = 96;

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  scrollRTL: { flexDirection: "row-reverse" },

  card: {
    width: CARD_W,
    minHeight: CARD_H,
    borderRadius: 18,
    alignItems: "center",
    paddingBottom: 10,
    overflow: "hidden",
    position: "relative",
  },
  cardUnlocked: {
    backgroundColor: Colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLocked: {
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#e5e7eb",
  },

  iconWrap: {
    width: "100%",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    position: "relative",
  },

  glowRing: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },

  lockOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 6,
    paddingTop: 7,
    lineHeight: 14,
    color: "#1f2937",
  },
  labelLocked: { color: "#9ca3af" },

  earnedDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
