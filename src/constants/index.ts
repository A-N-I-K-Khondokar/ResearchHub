import { Platform, ViewStyle } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { radius } from './radius';
import { typography, fontFamilies } from './typography';

/**
 * CSE Research Hub — Centralized Elevation / Shadow Styles
 * Clean low-contrast ambient shadows conforming to the design system reference.
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  card: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  elevated: {
    shadowColor: colors.textPrimary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 4,
  },
};

export const academicCobalt = {
  start: '#2563EB',
  end: '#1D4ED8',
  shadow: 'rgba(37, 99, 235, 0.35)',
  gradientCss: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  gradientCssPressed: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
} as const;

export const floatingButtonTokens = {
  primary: {
    backgroundColor: academicCobalt.start,
    ...Platform.select({
      web: {
        backgroundImage: academicCobalt.gradientCss,
        boxShadow: `0 4px 14px ${academicCobalt.shadow}`,
      } as ViewStyle,
      default: {
        shadowColor: academicCobalt.start,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  } as ViewStyle,
  primaryPressed: {
    backgroundColor: academicCobalt.end,
    ...Platform.select({
      web: {
        backgroundImage: academicCobalt.gradientCssPressed,
        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
      } as ViewStyle,
      default: {
        shadowColor: academicCobalt.start,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.22,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  } as ViewStyle,
  secondary: {
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
      } as ViewStyle,
      default: {
        shadowColor: '#071A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  } as ViewStyle,
};

export { colors, lightColors, darkColors, type ThemeColors, type ColorToken } from './colors';
export { spacing } from './spacing';
export { radius } from './radius';
export { typography, fontFamilies } from './typography';

