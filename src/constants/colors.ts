/**
 * CSE Research Hub — Centralized Color Tokens
 * Derived from the canonical Stitch design system and DESIGN.md.
 * Supports both Light (Scholarly Crisp) and Dark (Deep Scholar Slate) themes.
 */

export type ColorToken =
  | 'primary'
  | 'primaryHover'
  | 'primaryPressed'
  | 'primaryDark'
  | 'primaryLight'
  | 'primaryMuted'
  | 'secondary'
  | 'secondaryLight'
  | 'secondaryDark'
  | 'accent'
  | 'accentLight'
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'surfaceSubtle'
  | 'surfaceHover'
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'border'
  | 'borderFocus'
  | 'borderSubtle'
  | 'success'
  | 'successLight'
  | 'error'
  | 'errorLight'
  | 'warning'
  | 'warningLight'
  | 'info'
  | 'infoLight';

export type ThemeColors = Record<ColorToken, string>;

export const lightColors: ThemeColors = {
  // Brand & Accents
  primary: '#3B65DF',          // Softer, modern Academic Royal Blue
  primaryHover: '#4A72E6',     // Slightly lighter for hover states
  primaryPressed: '#2E51B8',   // Deeper for pressed states
  primaryDark: '#0A3DAF',      // Deep Academic Blue
  primaryLight: '#E8EDFF',     // Tinted primary container
  primaryMuted: '#F0F4FF',     // Primary badge background / active item background

  secondary: '#159A9C',        // Research Teal
  secondaryLight: '#E0F7F6',   // Soft Teal container
  secondaryDark: '#00696B',    // Dark teal for chip labels

  accent: '#B45309',           // Knowledge Amber / Warning
  accentLight: '#FEF3C7',      // Light amber container

  // Canvas & Surfaces
  background: '#F6F8FC',       // Canvas background (soft scholarly cool gray)
  surface: '#FFFFFF',          // Card & container surface
  surfaceElevated: '#FFFFFF',  // Modals & sheets
  surfaceSubtle: '#F8FAFC',    // Input fields, inactive tabs, pill backgrounds
  surfaceHover: '#F1F5F9',     // Hover state for interactive surface elements

  // Typography
  textPrimary: '#172033',      // Deep navy/slate for titles & primary reading text
  textSecondary: '#475467',    // Refined slate gray for metadata, sub-labels
  textMuted: '#94A3B8',        // Inactive icons, placeholder text
  textInverse: '#FFFFFF',      // Text on primary buttons

  // Structural & Borders
  border: '#E2E8F0',           // Cleaner standard 1px card/divider outline
  borderFocus: '#3B65DF',      // Active input/filter border
  borderSubtle: '#F1F5F9',     // Secondary dividers

  // Feedback & Status
  success: '#16A34A',          
  successLight: '#DCFCE7',
  error: '#DC2626',            
  errorLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',
};

export const darkColors: ThemeColors = {
  // Brand & Accents
  primary: '#5B82F6',          // Royal Blue adjusted for dark background legibility
  primaryHover: '#6D91F7',
  primaryPressed: '#466CE0',
  primaryDark: '#3B66D4',      // Deepened pressed state
  primaryLight: '#1E294A',     // Dark tinted primary container
  primaryMuted: '#162038',     // Dark primary badge background

  secondary: '#2DD4BF',        // Vibrant Research Teal
  secondaryLight: '#0C2B2C',   // Deep teal badge container
  secondaryDark: '#5EEAD4',    // Bright teal text

  accent: '#F59E0B',           // Knowledge Amber
  accentLight: '#3A2707',      // Deep amber container

  // Canvas & Surfaces (Deep Scholarly Slate)
  background: '#0B0F19',       // Deep scholarly canvas
  surface: '#131B2E',          // Card surface
  surfaceElevated: '#1E293B',  // Modals, sheets & popovers
  surfaceSubtle: '#1A2438',    // Search bars, pill backgrounds, inactive states
  surfaceHover: '#1E2A44',     // Hover state for dark mode surfaces

  // Typography
  textPrimary: '#F8FAFC',      // Slate 50 - high contrast readability
  textSecondary: '#94A3B8',    // Slate 400 - clean metadata & secondary info
  textMuted: '#64748B',        // Slate 500 - placeholder text & subtle icons
  textInverse: '#0B0F19',      // Dark text on bright buttons

  // Structural & Borders
  border: '#243048',           // Subtle card boundary
  borderFocus: '#5B82F6',      // Focused active border
  borderSubtle: '#182236',     // Dividers

  // Feedback & Status
  success: '#22C55E',
  successLight: '#052E16',
  error: '#EF4444',
  errorLight: '#450A0A',
  warning: '#F59E0B',
  warningLight: '#451A03',
  info: '#38BDF8',
  infoLight: '#082F49',
};

// Default colors exported for backward compatibility
export const colors = lightColors;
