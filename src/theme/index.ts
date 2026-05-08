import { StyleSheet } from "react-native";

// ─── Color Palette ─────────────────────────────────────────────────────────────
export const Colors = {
  primaryOrange: "#DE985A",
  orangeLight: "#FFE8D6",
  orangeDark: "#C2410C",

  greenMain: "#16A34A",
  greenLight: "#D1FAE5",
  greenDark: "#14532D",

  background: "#FAFAF8",
  white: "#FFFFFF",

  grayLight: "#F3F4F6",
  grayMedium: "#9CA3AF",
  grayDark: "#404040",

  black: "#000000",
} as const;

// ─── Semantic tokens (used by useColors hook) ─────────────────────────────────
export const lightTokens = {
  text: Colors.grayDark,
  tint: Colors.primaryOrange,

  background: Colors.background,
  foreground: Colors.grayDark,

  card: Colors.white,
  cardForeground: Colors.grayDark,

  primary: Colors.primaryOrange,
  primaryForeground: Colors.white,

  primaryLight: Colors.orangeLight,
  primaryDark: Colors.orangeDark,

  green: Colors.greenMain,
  greenLight: Colors.greenLight,
  greenDark: Colors.greenDark,

  secondary: Colors.grayLight,
  secondaryForeground: Colors.grayDark,

  muted: Colors.grayLight,
  mutedForeground: Colors.grayMedium,

  accent: Colors.orangeLight,
  accentForeground: Colors.orangeDark,

  destructive: "#ef4444",
  destructiveForeground: Colors.white,

  border: "#E5E7EB",
  input: "#E5E7EB",
};

export const colorTokens = {
  light: lightTokens,
  radius: 16,
};

// ─── Spacing ──────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────
export const Typography = StyleSheet.create({
  display: {
    fontSize: 32,
    fontWeight: "800" as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 30,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 18,
  },
});
