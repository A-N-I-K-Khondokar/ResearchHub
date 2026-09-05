/**
 * CSE Research Hub — Centralized Spacing Tokens
 * Based on the 8pt geometric grid system defined in DESIGN.md.
 */

export const spacing = {
  none: 0,
  xs: 4,      // Micro gaps, chip internal padding, badge margin
  sm: 8,      // Compact row gaps, icon-to-text spacing
  md: 16,     // Standard screen margin, card internal padding, item gap
  lg: 24,     // Section separation, form group spacing
  xl: 32,     // Major block margin, header bottom spacing
  xxl: 48,    // Top of screen banner padding, hero spacing

  // Semantic layout aliases
  screenHorizontal: 16,
  screenVertical: 16,
  cardPadding: 16,
  inputHeight: 48,
  buttonHeight: 48,
  compactButtonHeight: 36,
} as const;

export type SpacingToken = keyof typeof spacing;
