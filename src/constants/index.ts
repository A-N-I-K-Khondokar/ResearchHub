import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography, fontFamilies } from './typography';

/**
 * CSE Research Hub — Centralized Elevation / Shadow Styles
 * Clean low-contrast shadows conforming to DESIGN.md.
 */
export const shadows: Record<'subtle' | 'card' | 'elevated' | 'none', ViewStyle> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export { colors, lightColors, darkColors, type ThemeColors, type ColorToken } from './colors';
export { spacing } from './spacing';
export { radius } from './radius';
export { typography, fontFamilies } from './typography';

