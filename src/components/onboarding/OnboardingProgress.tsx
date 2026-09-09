import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { radius, spacing } from '@/constants';
import { useTheme } from '@/hooks/useTheme';

export interface OnboardingProgressProps {
  currentStep: number;
  totalSteps?: number;
  style?: ViewStyle;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  currentStep,
  totalSteps = 5,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }, (_, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <View
            key={stepNum}
            style={[
              styles.dot,
              { backgroundColor: colors.border },
              isActive && [styles.activePill, { backgroundColor: colors.primary }],
              isCompleted && { backgroundColor: colors.secondary },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    marginVertical: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  activePill: {
    width: 24,
    height: 6,
    borderRadius: radius.full,
  },
});
