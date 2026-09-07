import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { colors, spacing, typography } from '@/constants';

export interface OnboardingHeaderProps {
  step: number;
  totalSteps?: number;
  onBack?: () => void;
  showBack?: boolean;
  style?: ViewStyle;
}

export const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  step,
  totalSteps = 5,
  onBack,
  showBack = true,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {showBack && onBack ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}

      <Text style={styles.stepText}>
        Step {step} of {totalSteps}
      </Text>

      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenHorizontal,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 36,
  },
  stepText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
