import { TextStyle, Platform } from 'react-native';

/**
 * CSE Research Hub — Centralized Typography Tokens
 * Dual-font strategy:
 * - Source Serif 4 for major headings and academic authority
 * - Inter for general UI, body text, form fields, and metadata
 */

export const fontFamilies = {
  // Serif for authoritative academic titles & paper headings
  serif: Platform.select({
    ios: 'SourceSerif4-SemiBold',
    android: 'SourceSerif4_600SemiBold',
    default: 'serif',
  }),
  serifBold: Platform.select({
    ios: 'SourceSerif4-Bold',
    android: 'SourceSerif4_700Bold',
    default: 'serif',
  }),

  // Sans-serif for clean UI controls, metadata, and reading body
  sansRegular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter_400Regular',
    default: 'System',
  }),
  sansMedium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter_500Medium',
    default: 'System',
  }),
  sansSemiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter_600SemiBold',
    default: 'System',
  }),
  sansBold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter_700Bold',
    default: 'System',
  }),
};

export const typography: Record<string, TextStyle> = {
  // Editorial Display & Major Headers (Serif)
  display: {
    fontFamily: fontFamilies.serifBold,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: fontFamilies.serif,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headlineSmall: {
    fontFamily: fontFamilies.serif,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },

  // Sans-Serif UI & Body Scale
  title: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
  },
  titleSmall: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  body: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  bodySmall: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  subhead: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  caption: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  buttonSmall: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
};
