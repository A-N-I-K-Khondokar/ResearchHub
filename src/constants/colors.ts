/**
 * CSE Research Hub — Centralized Color Tokens
 * Derived from the Luminous Scientific / Atmospheric Academic Design System reference.
 * Supports both Light (Atmospheric Sky Azure) and Dark (Deep Oceanic Slate) themes.
 */

export type ColorToken =
  | 'primary'
  | 'primaryHover'
  | 'primaryPressed'
  | 'primaryDark'
  | 'primaryLight'
  | 'primaryMuted'
  | 'primaryContainer'
  | 'onPrimaryContainer'
  | 'secondary'
  | 'secondaryLight'
  | 'secondaryDark'
  | 'secondaryContainer'
  | 'onSecondaryContainer'
  | 'accent'
  | 'accentLight'
  | 'tertiary'
  | 'tertiaryContainer'
  | 'background'
  | 'surface'
  | 'surfaceElevated'
  | 'surfaceSubtle'
  | 'surfaceHover'
  | 'surfaceDim'
  | 'surfaceBright'
  | 'surfaceContainerLowest'
  | 'surfaceContainerLow'
  | 'surfaceContainer'
  | 'surfaceContainerHigh'
  | 'surfaceContainerHighest'
  | 'textPrimary'
  | 'textSecondary'
  | 'textMuted'
  | 'textInverse'
  | 'onSurface'
  | 'onSurfaceVariant'
  | 'border'
  | 'borderFocus'
  | 'borderSubtle'
  | 'outline'
  | 'outlineVariant'
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
  // Brand & Accents (Vibrant Sky Azure #2471E7 / #0058C2)
  primary: '#2471E7',                // Vibrant Sky Azure (Primary CTAs, active indicators, focus rings)
  primaryHover: '#3D85EF',           // Ambient hover glow
  primaryPressed: '#1B5ECC',         // Deep kinetic pressed state
  primaryDark: '#0058C2',            // Authoritative deep azure
  primaryLight: '#D8E2FF',           // Tinted primary container / primary-fixed
  primaryMuted: '#EAEDFF',           // Pill background / surface-container
  primaryContainer: '#2471E7',
  onPrimaryContainer: '#FFFEFF',

  // Secondary & Validations (Soft Mint Sage #71E07E / #006E27)
  secondary: '#006E27',              // Deep Mint Green for accessible text/icons
  secondaryLight: '#EAF9EC',         // Soft mint container
  secondaryDark: '#00531B',          // Contrast mint for chip labels
  secondaryContainer: '#8BFB95',     // Mint badge container
  onSecondaryContainer: '#00752A',

  // Tertiary & Critical Highlights (Radiant Coral #FF7145 / #CB4C23 / #A9340A)
  accent: '#FF7145',                 // Radiant Coral Accent
  accentLight: '#FFDBD1',            // Soft coral container (tertiary-fixed)
  tertiary: '#A9340A',
  tertiaryContainer: '#CB4C23',

  // Canvas & Surfaces (Atmospheric Luminous Canvas)
  background: '#FAF8FF',             // Luminous atmospheric pale canvas
  surface: '#FFFFFF',                // Solid pristine white cards (surface-container-lowest)
  surfaceElevated: '#FFFFFF',        // Modals & floating trays
  surfaceSubtle: '#F2F3FF',          // Search bars, inactive capsule pills (surface-container-low)
  surfaceHover: '#EAEDFF',           // Interactive surface hover (surface-container)
  surfaceDim: '#CDD9FF',
  surfaceBright: '#FAF8FF',
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#F2F3FF',
  surfaceContainer: '#EAEDFF',
  surfaceContainerHigh: '#E2E7FF',
  surfaceContainerHighest: '#D9E2FF',

  // Typography (Deep Ocean Navy replacing pure black)
  textPrimary: '#071A3E',            // Deep Ocean Navy (on-surface / high optical weight)
  textSecondary: '#424754',          // Slate navy for metadata & subheads (on-surface-variant)
  textMuted: '#727785',              // Outline / placeholder text
  textInverse: '#FFFFFF',            // Crisp white text on primary buttons
  onSurface: '#071A3E',
  onSurfaceVariant: '#424754',

  // Structural Borders & Outlines
  border: '#D9E2FF',                 // Refined atmospheric card outline
  borderFocus: '#2471E7',            // Sky Azure focus ring
  borderSubtle: '#E2E7FF',           // Hairline module dividers (surface-container-high)
  outline: '#727785',
  outlineVariant: '#C2C6D6',

  // Feedback & Telemetry Statuses
  success: '#006E27',
  successLight: '#DCFCE7',
  error: '#BA1A1A',
  errorLight: '#FFDAD6',
  warning: '#CB4C23',
  warningLight: '#FFDBD1',
  info: '#0058C2',
  infoLight: '#D8E2FF',
};

export const darkColors: ThemeColors = {
  // Brand & Accents (Adjusted for Deep Oceanic Slate readability)
  primary: '#82B1FF',                // Sky Azure adjusted for dark legibility
  primaryHover: '#AEC6FF',
  primaryPressed: '#6897E8',
  primaryDark: '#3B6FD0',
  primaryLight: '#152A54',
  primaryMuted: '#112040',
  primaryContainer: '#004397',
  onPrimaryContainer: '#D8E2FF',

  // Secondary (Vibrant Mint)
  secondary: '#8BFB95',              // Mint Sage highlight
  secondaryLight: '#0C2B14',         // Deep forest container
  secondaryDark: '#A6FFAD',          // Bright mint text
  secondaryContainer: '#00531B',
  onSecondaryContainer: '#8BFB95',

  // Tertiary (Radiant Coral)
  accent: '#FFB59F',                 // Coral glow for dark backgrounds
  accentLight: '#3A0A00',            // Deep coral container
  tertiary: '#FF7145',
  tertiaryContainer: '#862300',

  // Canvas & Surfaces (Deep Oceanic Slate)
  background: '#070F1E',             // Deep oceanic night base canvas
  surface: '#0F1A30',                // Pristine dark card surface
  surfaceElevated: '#172542',        // Modals, sheets & popovers
  surfaceSubtle: '#13203A',          // Capsule search bars, inactive pills
  surfaceHover: '#1C2E52',           // Hover state for dark mode surfaces
  surfaceDim: '#070F1E',
  surfaceBright: '#172542',
  surfaceContainerLowest: '#0A1324',
  surfaceContainerLow: '#0F1A30',
  surfaceContainer: '#13203A',
  surfaceContainerHigh: '#1A2A4A',
  surfaceContainerHighest: '#223458',

  // Typography
  textPrimary: '#EEF0FF',            // Inverse-on-surface high contrast readability
  textSecondary: '#A5B0C8',          // Clean slate metadata
  textMuted: '#727785',              // Outline / placeholder text
  textInverse: '#071A3E',            // Deep navy text on bright buttons
  onSurface: '#EEF0FF',
  onSurfaceVariant: '#A5B0C8',

  // Structural & Borders
  border: '#1E2D4A',                 // Subtle card boundary
  borderFocus: '#82B1FF',            // Focused active border
  borderSubtle: '#16233B',           // Module dividers
  outline: '#8C92A4',
  outlineVariant: '#2A3B5C',

  // Feedback & Telemetry Statuses
  success: '#6EDD7C',
  successLight: '#052E16',
  error: '#FFB4AB',
  errorLight: '#450A0A',
  warning: '#FFB59F',
  warningLight: '#451A03',
  info: '#AEC6FF',
  infoLight: '#0F2650',
};

// Default colors exported for backward compatibility
export const colors = lightColors;
