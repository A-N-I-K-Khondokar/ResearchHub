import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import { ScreenContainer, Button, OnboardingProgress } from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

export default function ReadyToExploreScreen() {
  const router = useRouter();

  const handleFinish = () => {
    Alert.alert(
      'Onboarding Complete 🎉',
      'Your CSE Research Hub profile has been set up successfully. Ready for Phase 2B (Home & Exploration).',
      [
        {
          text: 'Return to Hub Entry',
          onPress: () => router.replace('/' as any),
        },
      ]
    );
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Step Header */}
        <View style={styles.header}>
          <Text style={styles.stepText}>Step 5 of 5</Text>
        </View>

        {/* Success Icon Graphic */}
        <View style={styles.iconContainer}>
          <View style={styles.outerRing}>
            <View style={styles.innerCircle}>
              <CheckCircle2 size={54} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textBlock}>
          <Text style={styles.title}>You're ready to explore.</Text>
          <Text style={styles.body}>
            Start discovering researchers, exploring active momentum, and connecting with peers across the CSE department.
          </Text>
        </View>

        {/* Primary Action Button */}
        <View style={styles.actionContainer}>
          <Button
            label="Explore CSE Research Hub"
            onPress={handleFinish}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color={colors.textInverse} />}
            iconPosition="right"
            fullWidth
          />
        </View>

        {/* Progress Dots */}
        <OnboardingProgress currentStep={5} totalSteps={5} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    minHeight: 600,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  stepText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  innerCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.display,
    fontSize: 28,
    lineHeight: 36,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  actionContainer: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
});
