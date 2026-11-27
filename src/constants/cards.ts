/**
 * src/constants/cards.ts
 *
 * One card standard for the whole app:
 *   - radius 16, 1px subtle border, 16px padding (list rows: 12px)
 *   - a very light shadow in light mode only (none in dark mode)
 *   - pressed cards fade to 0.9
 */

import type { ViewStyle } from 'react-native';
import { radius } from './radius';
import { spacing } from './spacing';

export const card = {
  radius: radius.md,
  padding: spacing.md,
  rowPadding: 12,
  borderWidth: 1,
  pressOpacity: 0.9,
} as const;

export const cardShadow = (isDark: boolean): ViewStyle =>
  isDark
    ? { shadowOpacity: 0, elevation: 0 }
    : {
        shadowColor: '#071A3E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      };
