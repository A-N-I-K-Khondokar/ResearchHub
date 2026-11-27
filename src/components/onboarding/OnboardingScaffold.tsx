/**
 * src/components/onboarding/OnboardingScaffold.tsx
 *
 * Clean, minimal layout for the first-run welcome: soft aurora background, a thin
 * progress line, a large title, generous spacing and a bottom-pinned action.
 */

import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { fontFamilies, spacing, typography } from '@/constants';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { OnboardingHeader, ONBOARDING_STEPS } from './OnboardingHeader';

export interface OnboardingScaffoldProps {
  step: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSkip?: () => void;
  /** Bottom-pinned actions (primary button, secondary link…). */
  footer: React.ReactNode;
  /** Animate the aurora / network background (welcome step); others are still. */
  animatedBackground?: boolean;
  children: React.ReactNode;
}

export const OnboardingScaffold: React.FC<OnboardingScaffoldProps> = ({ step, title, subtitle, onBack, onSkip, footer, animatedBackground = false, children }) => {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <AuthBackground animated={animatedBackground} />
      <View style={styles.header}>
        <OnboardingHeader step={step} onBack={onBack} onSkip={onSkip} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.overline, { color: colors.primary }]}>
          Step {step} of {ONBOARDING_STEPS.length}
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
      <View style={styles.footer}>{footer}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: spacing.screenHorizontal },
  content: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  overline: { ...typography.overline },
  title: { ...typography.title, fontFamily: fontFamilies.sansBold, fontSize: 30, lineHeight: 36, letterSpacing: -0.6, marginTop: spacing.sm },
  subtitle: { ...typography.body, marginTop: spacing.sm },
  body: { marginTop: spacing.xl },
  footer: { paddingHorizontal: spacing.screenHorizontal, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.sm },
});
