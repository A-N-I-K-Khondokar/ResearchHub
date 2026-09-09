import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, FlaskConical, Network, BookOpen, Sparkles } from 'lucide-react-native';
import { ScreenContainer, Button, OnboardingProgress } from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Step Header */}
        <View style={styles.header}>
          <Text style={[styles.stepText, { color: colors.textSecondary }]}>Step 1 of 5</Text>
        </View>

        {/* Hero Graphic */}
        <View style={styles.heroContainer}>
          <View
            style={[
              styles.mainCircle,
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
              <Sparkles size={48} color={colors.primary} />
            </View>
          </View>

          {/* Floating Academic Badges */}
          <View
            style={[
              styles.floatingBadge,
              styles.badgeTopRight,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <FlaskConical size={20} color={colors.primary} />
          </View>

          <View
            style={[
              styles.floatingBadge,
              styles.badgeBottomLeft,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Network size={20} color={colors.secondaryDark} />
          </View>

          <View
            style={[
              styles.floatingBadge,
              styles.badgeRight,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <BookOpen size={18} color={colors.textSecondary} />
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textBlock}>
          <Text style={[styles.tagline, { color: colors.primary }]}>Welcome to CSE Research Hub</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Discover what your CSE research community is working on.
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Connect with peers, access latest publications, and collaborate with people who share your intellectual interests.
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <Button
            label="Get Started"
            onPress={() => router.push('/(onboarding)/interests' as any)}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color={colors.textInverse} />}
            iconPosition="right"
            fullWidth
          />
        </View>

        {/* Progress */}
        <OnboardingProgress currentStep={1} totalSteps={5} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    minHeight: 620,
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
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
    position: 'relative',
  },
  mainCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
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
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingBadge: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: radius.full,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeTopRight: {
    top: 0,
    right: '22%',
  },
  badgeBottomLeft: {
    bottom: 10,
    left: '20%',
  },
  badgeRight: {
    top: '40%',
    right: '12%',
  },
  textBlock: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  tagline: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 34,
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
    marginTop: spacing.sm,
  },
});
