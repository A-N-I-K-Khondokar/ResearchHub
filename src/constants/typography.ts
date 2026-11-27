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

/** Even-width digits for counts, badges and percentages. */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

/** Compact UI (buttons, chips, badges, tab labels) may grow with the system font, but only this far. */
export const COMPACT_FONT_SCALE = 1.3;

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

  // Sans-Serif UI & Body Scale
  sectionHeader: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
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
    lineHeight: 23,
    fontWeight: '400',
  },
  bodyMedium: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '500',
  },
  bodySmall: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '400',
  },
  bodyCompact: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '400',
  },
  label: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  micro: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  /** Metadata: dates, departments, counts. Regular weight so it never competes with titles. */
  caption: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  /** Alias of caption, for readability at call sites. */
  meta: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  /** Title of a stack screen header (back arrow + title). */
  screenTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
  },
  /** Heading of a content section: "About", "Team & roles", "People like you". */
  sectionTitle: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  /** Small uppercase group label: TODAY, APPLICANTS. Store text normally; this uppercases it. */
  overline: {
    fontFamily: fontFamilies.sansSemiBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  /** Post title in rows and compact cards (serif, like the feed and details page). */
  cardTitle: {
    fontFamily: fontFamilies.serif,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  /** Post title on the feed card. */
  feedTitle: {
    fontFamily: fontFamilies.serifBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
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
