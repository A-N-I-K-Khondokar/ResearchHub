/**
 * CSE Research Hub — Centralized Corner Radius Tokens
 * Defines shape rounding scales aligned with DESIGN.md.
 */

export const radius = {
  none: 0,
  xs: 4,      // Small inputs, badges, checkboxes
  sm: 8,      // Standard buttons, text inputs, small cards
  md: 12,     // Standard research cards, container surfaces
  lg: 16,     // Prominent highlight cards, bottom sheets, modal cards
  xl: 24,     // Large hero cards, drawer rounded tops
  full: 9999, // Pill buttons, topic chips, circular avatars
} as const;

export type RadiusToken = keyof typeof radius;
