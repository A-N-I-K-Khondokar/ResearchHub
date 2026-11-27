/**
 * src/components/onboarding/OnboardingHeader.tsx
 *
 * Minimal header for the welcome steps: Back · Skip, and one thin progress line.
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export const ONBOARDING_STEPS = ['Welcome', 'Your topics', 'Contact', 'Get started'] as const;

export interface OnboardingHeaderProps {
  /** 1-based step index. */
  step: number;
  onBack?: () => void;
  onSkip?: () => void;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({ step, onBack, onSkip }) => {
  const { colors } = useTheme();
  const total = ONBOARDING_STEPS.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} hitSlop={10} style={styles.side} accessibilityRole="button" accessibilityLabel="Back">
            <ArrowLeft size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
        {onSkip ? (
          <TouchableOpacity onPress={onSkip} hitSlop={10} style={[styles.side, styles.right]} accessibilityRole="button" accessibilityLabel="Skip setup">
            <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.skip, { color: colors.textSecondary }]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.side} />
        )}
      </View>
      <View
        style={[styles.track, { backgroundColor: colors.borderSubtle }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: step }}
        accessibilityLabel={`Step ${step} of ${total}`}
      >
        <View style={[styles.fill, { backgroundColor: colors.primary, width: `${(step / total) * 100}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 44 },
  side: { minWidth: 44, height: 44, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  skip: { ...typography.buttonSmall, fontSize: 14 },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
});
