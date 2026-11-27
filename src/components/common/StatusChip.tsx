/**
 * src/components/common/StatusChip.tsx
 *
 * Small status / type chip used on cards (Collaboration · Open, stage,
 * Your post, Draft, Connected …). Tones map to theme colours.
 */

import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { fontFamilies, radius, typography } from '@/constants';

export type ChipTone = 'primary' | 'success' | 'neutral' | 'warning';

export const StatusChip: React.FC<{
  label: string;
  tone?: ChipTone;
  icon?: LucideIcon;
  outlined?: boolean;
  style?: ViewStyle;
}> = ({ label, tone = 'neutral', icon: Icon, outlined = false, style }) => {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.primaryMuted, fg: colors.primary },
    success: { bg: colors.successLight, fg: colors.success },
    warning: { bg: colors.warningLight, fg: colors.warning },
    neutral: { bg: colors.surfaceSubtle, fg: colors.textSecondary },
  }[tone];
  return (
    <View
      style={[
        styles.chip,
        outlined
          ? { backgroundColor: 'transparent', borderColor: palette.fg, borderStyle: 'dashed' }
          : { backgroundColor: palette.bg, borderColor: 'transparent' },
        style,
      ]}
    >
      {Icon ? <Icon size={12} color={palette.fg} /> : null}
      <Text style={[styles.text, { color: palette.fg }]} numberOfLines={1} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    maxWidth: 200,
  },
  text: { ...typography.micro, fontFamily: fontFamilies.sansSemiBold },
});
