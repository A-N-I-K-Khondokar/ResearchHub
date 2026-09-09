import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';
import { ScreenContainer, Button, OnboardingProgress } from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function ReadyToExploreScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const handleFinish = () => {
    router.replace('/(tabs)' as any);
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Step Header */}
        <View style={styles.header}>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>Step 5 of 5</Text>
        </View>

        {/* Success Icon Graphic */}
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.outerRing,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.innerCircle,
                {
                  backgroundColor: colors.primaryMuted,
                  borderColor: colors.primaryLight,
                },
              ]}
            >
              <CheckCircle2 size={54} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>You're ready to explore.</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  innerCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 1,
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
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  actionContainer: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
});
