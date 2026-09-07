import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Play,
  ShieldCheck,
  Compass,
  ArrowRight,
  GraduationCap,
  Sparkles,
} from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

export default function EntryScreen() {
  const router = useRouter();

  const authRoutes = [
    { name: 'Splash (Brand Entry)', path: '/(auth)/splash' },
    { name: 'Login Screen', path: '/(auth)/login' },
    { name: 'Create Account / Sign Up', path: '/(auth)/sign-up' },
    { name: 'Verify Email', path: '/(auth)/verify-email' },
    { name: 'Forgot Password', path: '/(auth)/forgot-password' },
    { name: 'Password Reset Success', path: '/(auth)/forgot-password-success' },
  ];

  const onboardingRoutes = [
    { name: 'Step 1: Welcome', path: '/(onboarding)/welcome' },
    { name: 'Step 2: Research Interests', path: '/(onboarding)/interests' },
    { name: 'Step 3: Current Work', path: '/(onboarding)/current-work' },
    { name: 'Step 4: External Profiles', path: '/(onboarding)/external-profiles' },
    { name: 'Step 5: Ready to Explore', path: '/(onboarding)/ready' },
  ];

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        {/* Header Banner */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <GraduationCap size={28} color={colors.primary} />
          </View>
          <Text style={styles.appTitle}>CSE Research Hub</Text>
          <Text style={styles.subtitle}>
            Phase 2A — Authentication & Onboarding Flow
          </Text>
        </View>

        {/* Primary Interactive Flow Launcher */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={styles.heroBadgeText}>Canonical User Flow</Text>
          </View>
          <Text style={styles.heroTitle}>Start Full Authentication Journey</Text>
          <Text style={styles.heroDescription}>
            Experience the complete linear flow from Splash &rarr; Login &rarr; Verify &rarr; 5-Step Onboarding.
          </Text>
          <Button
            label="Launch Splash & Auth Flow"
            onPress={() => router.push('/(auth)/splash' as any)}
            variant="primary"
            size="lg"
            icon={<Play size={18} color={colors.textInverse} fill={colors.textInverse} />}
            fullWidth
            style={styles.heroButton}
          />
        </View>

        {/* Auth Screens Direct Jump */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Authentication Screens (6)</Text>
          </View>
          <View style={styles.cardList}>
            {authRoutes.map((route, idx) => (
              <TouchableOpacity
                key={route.path}
                activeOpacity={0.7}
                onPress={() => router.push(route.path as any)}
                style={[
                  styles.navItem,
                  idx === authRoutes.length - 1 && styles.navItemLast,
                ]}
              >
                <Text style={styles.navItemText}>{route.name}</Text>
                <ArrowRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Onboarding Screens Direct Jump */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Compass size={18} color={colors.secondaryDark} />
            <Text style={styles.sectionTitle}>Onboarding Wizard Screens (5)</Text>
          </View>
          <View style={styles.cardList}>
            {onboardingRoutes.map((route, idx) => (
              <TouchableOpacity
                key={route.path}
                activeOpacity={0.7}
                onPress={() => router.push(route.path as any)}
                style={[
                  styles.navItem,
                  idx === onboardingRoutes.length - 1 && styles.navItemLast,
                ]}
              >
                <Text style={styles.navItemText}>{route.name}</Text>
                <ArrowRight size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  appTitle: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subhead,
    color: colors.textSecondary,
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primaryLight,
    padding: spacing.cardPadding,
    marginBottom: spacing.xl,
    ...shadows.elevated,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  heroBadgeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  heroDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  heroButton: {
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 16,
    color: colors.textPrimary,
  },
  cardList: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navItemLast: {
    borderBottomWidth: 0,
  },
  navItemText: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
  },
});
