export const colors = {
  // Primary
  orange: {
    light: '#FFE8D6',
    main: '#DE985A',
    dark: '#C2410C',
  },
  // Secondary
  green: {
    light: '#D1FAE5',
    main: '#16A34A',
    dark: '#14532D',
  },
  // Neutrals
  white: '#FFFFFF',
  background: '#FAFAF8',
  gray: {
    light: '#F3F4F6',
    medium: '#9CA3AF',
    dark: '#404040',
  },
  // Semantic
  error: '#EF4444',
  success: '#22C55E',
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};