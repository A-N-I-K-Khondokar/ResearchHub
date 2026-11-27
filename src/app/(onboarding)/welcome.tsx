/**
 * First-run welcome · step 1 of 4 — shown once after the account is approved.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, BookOpen, Users, UserPlus, type LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { fontFamilies, spacing, typography } from '@/constants';

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BookOpen, title: 'Share your research', text: 'Post what you’re working on so others can follow it and help.' },
  { icon: Users, title: 'Find collaborators', text: 'Join open projects, or post the roles your project needs.' },
  { icon: UserPlus, title: 'Grow your network', text: 'Connect with CSE researchers and reach teammates through contact cards.' },
];

export default function OnboardingWelcome() {
  const router = useRouter();
  const { colors } = useTheme();
  const { userProfile } = useAuth();
  const finish = useFinishOnboarding();
  const firstName = (userProfile?.displayName || '').split(' ')[0] || 'there';

  return (
    <OnboardingScaffold
      step={1}
      animatedBackground
      title={`You’re in, ${firstName}!`}
      subtitle="Your account is approved. Here’s what you can do on CSE Research Hub."
      onSkip={() => finish()}
      footer={
        <Button
          label="Set up in 1 minute"
          size="lg"
          fullWidth
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          iconPosition="right"
          onPress={() => router.push('/(onboarding)/topics' as any)}
        />
      }
    >
      {FEATURES.map(({ icon: Icon, title, text }, i) => (
        <View
          key={title}
          style={[styles.row, i < FEATURES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
        >
          <Icon size={22} color={colors.primary} style={styles.icon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]}>{text}</Text>
          </View>
        </View>
      ))}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.lg },
  icon: { marginTop: 1 },
  cardTitle: { ...typography.title, fontFamily: fontFamilies.sansSemiBold, fontSize: 16, lineHeight: 22 },
  cardText: { ...typography.body, marginTop: 2 },
});
