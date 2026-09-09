/**
 * CSE Research Hub — Centralized Corner Radius Tokens
 * Defines shape rounding scales aligned with the design system reference.
 */

export const radius = {
  none: 0,
  xs: 4,      // Micro indicators, badges, checkboxes
  sm: 8,      // Standard compact buttons, inputs, small tags
  md: 16,     // Standard research cards, container surfaces (1rem / DEFAULT)
  lg: 24,     // Cards & data modules (1.5rem / rounded-2xl)
  xl: 32,     // Prominent hero cards, modals & floating trays (2rem)
  xxl: 48,    // Large modal surfaces (3rem)
  full: 9999, // Full capsule pill buttons, topic chips, circular avatars
} as const;

export type RadiusToken = keyof typeof radius;

