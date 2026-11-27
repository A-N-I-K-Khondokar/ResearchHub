/**
 * First-run welcome · step 4 of 4 — pick where to start.
 * Finishing marks the welcome done and opens Home (plus the chosen screen).
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Home, Users, UserPlus, type LucideIcon } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { useTheme } from '@/context/ThemeContext';
import { useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { card } from '@/constants/cards';
import { fontFamilies, spacing, typography } from '@/constants';

type Choice = { key: string; icon: LucideIcon; title: string; text: string; next?: { pathname: string; params?: Record<string, string> } };

const CHOICES: Choice[] = [
  { key: 'share', icon: BookOpen, title: 'Share what you’re working on', text: 'Post your current research or ask for collaborators.', next: { pathname: '/(tabs)/share' } },
  { key: 'collabs', icon: Users, title: 'Browse open collaborations', text: 'Find projects that need your skills and apply.', next: { pathname: '/(explore)/search', params: { category: 'collaborations' } } },
  { key: 'people', icon: UserPlus, title: 'Find people with your interests', text: 'Discover researchers and connect.', next: { pathname: '/(tabs)/explore' } },
];

export default function OnboardingStart() {
  const router = useRouter();
  const { colors } = useTheme();
  const finish = useFinishOnboarding();
  const [busy, setBusy] = useState<string | null>(null);

  const go = async (key: string, next?: Choice['next']) => {
    if (busy) return;
    setBusy(key);
    await finish(next);
  };

  return (
    <OnboardingScaffold
      step={4}
      title="Where would you like to start?"
      subtitle="You can do all of these later from Home."
      onBack={() => router.back()}
      footer={
        <Button
          label="Go to Home"
          variant="secondary"
          size="lg"
          fullWidth
          loading={busy === 'home'}
          icon={<Home size={17} color={colors.textPrimary} />}
          onPress={() => go('home')}
        />
      }
    >
      {CHOICES.map(({ key, icon: Icon, title, text, next }, i) => (
        <TouchableOpacity
          key={key}
          activeOpacity={card.pressOpacity}
          disabled={Boolean(busy)}
          onPress={() => go(key, next)}
          style={[styles.choice, i < CHOICES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, busy === key && { opacity: 0.6 }]}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${text}`}
        >
          <Icon size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  choice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  title: { ...typography.title, fontFamily: fontFamilies.sansSemiBold, fontSize: 16, lineHeight: 22 },
  text: { ...typography.body, marginTop: 2 },
});
