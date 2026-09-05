/**
 * CSE Research Hub — Centralized Color Tokens
 * Derived from the canonical Stitch design system and DESIGN.md.
 */

export const colors = {
  // Brand & Accents
  primary: '#3157C8',          // Academic Royal Blue (Primary actions, brand accents, active tabs)
  primaryDark: '#0A3DAF',      // Deep Academic Blue (Pressed states, high-contrast headers)
  primaryLight: '#DCE1FF',     // Tinted primary container
  primaryMuted: '#EEF2FF',     // Primary badge background / active item background

  secondary: '#159A9C',        // Research Teal (Topic chips, momentum tags, secondary badges)
  secondaryLight: '#E0F7F6',   // Soft Teal container
  secondaryDark: '#00696B',    // Dark teal for chip labels

  accent: '#B45309',           // Knowledge Amber / Warning (Highlights, awards, pending status)
  accentLight: '#FEF3C7',      // Light amber container

  // Canvas & Surfaces
  background: '#F6F8FC',       // Canvas background (soft scholarly cool gray)
  surface: '#FFFFFF',          // Card & container surface
  surfaceElevated: '#FFFFFF',  // Modals & sheets
  surfaceSubtle: '#F1F4F9',    // Input fields, inactive tabs, pill backgrounds

  // Typography
  textPrimary: '#172033',      // Deep navy/slate for titles & primary reading text
  textSecondary: '#667085',    // Slate gray for metadata, sub-labels, timestamps
  textMuted: '#94A3B8',        // Inactive icons, placeholder text
  textInverse: '#FFFFFF',      // Text on primary buttons

  // Structural & Borders
  border: '#E4E8F0',           // Standard 1px card/divider outline
  borderFocus: '#3157C8',      // Active input/filter border
  borderSubtle: '#EDF1F7',     // Secondary dividers

  // Feedback & Status
  success: '#16A34A',          // Success states & verified badges
  successLight: '#DCFCE7',
  error: '#DC2626',            // Error alerts & destructive actions
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',
} as const;

export type ColorToken = keyof typeof colors;
