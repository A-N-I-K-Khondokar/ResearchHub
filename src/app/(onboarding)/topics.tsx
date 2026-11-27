/**
 * First-run welcome · step 2 of 4 — confirm research topics.
 * Pre-filled from the interests given in account setup; saving updates the
 * profile (and its public directory mirror) via updateUserProfile.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { TopicIcon } from '@/components/common/TopicIcon';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { updateUserProfile } from '@/services/user.service';
import { TOPIC_TAXONOMY } from '@/utils/search';
import { tagMatchKey } from '@/utils/researchWork';
import { COMPACT_FONT_SCALE } from '@/constants/typography';
import { fontFamilies, radius, spacing, typography } from '@/constants';

const MAX_INTERESTS = 30;

export default function OnboardingTopics() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const { userProfile } = useAuth();
  const finish = useFinishOnboarding();

  const existing = userProfile?.researchInterests ?? [];
  const taxonomyKeys = useMemo(() => new Map(TOPIC_TAXONOMY.map((t) => [tagMatchKey(t.name), t.name] as const)), []);
  // Interests that aren't standard topics are kept as they are.
  const custom = useMemo(() => existing.filter((i) => !taxonomyKeys.has(tagMatchKey(i))), [existing, taxonomyKeys]);
  const initial = useMemo(
    () => new Set(existing.map((i) => taxonomyKeys.get(tagMatchKey(i))).filter(Boolean) as string[]),
    [existing, taxonomyKeys],
  );
  const [selected, setSelected] = useState<Set<string>>(initial);
  const [saving, setSaving] = useState(false);

  const changed = selected.size !== initial.size || [...selected].some((s) => !initial.has(s));
  const total = custom.length + selected.size;

  const toggle = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else if (custom.length + next.size < MAX_INTERESTS) next.add(name);
      return next;
    });

  const next = async () => {
    if (!changed || !userProfile) {
      router.push('/(onboarding)/contact' as any);
      return;
    }
    setSaving(true);
    try {
      const researchInterests = [...custom, ...TOPIC_TAXONOMY.map((t) => t.name).filter((n) => selected.has(n))];
      await updateUserProfile(userProfile, { researchInterests });
      router.push('/(onboarding)/contact' as any);
    } catch (err) {
      console.error('[Onboarding] Save topics failed:', err);
      toast.show('Could not save your topics. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScaffold
      step={2}
      title="Your research topics"
      subtitle="We use these to suggest posts, collaborations and people. You can change them anytime in your profile."
      onBack={() => router.back()}
      onSkip={() => finish()}
      footer={
        <>
          <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.count, { color: colors.textSecondary }]}>
            {selected.size === 0 ? 'Pick at least one for better suggestions' : `${selected.size} selected`}
            {custom.length ? ` · ${custom.length} more on your profile` : ''}
          </Text>
          <Button
            label={changed ? 'Save & continue' : 'Continue'}
            size="lg"
            fullWidth
            loading={saving}
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            iconPosition="right"
            onPress={next}
          />
        </>
      }
    >
      <View>
        {TOPIC_TAXONOMY.map((t, i) => {
          const on = selected.has(t.name);
          return (
            <TouchableOpacity
              key={t.id}
              activeOpacity={0.7}
              onPress={() => toggle(t.name)}
              style={[styles.row, i < TOPIC_TAXONOMY.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={t.name}
            >
              <TopicIcon iconName={t.iconName} name={t.name} size={20} color={on ? colors.primary : colors.textSecondary} />
              <Text maxFontSizeMultiplier={COMPACT_FONT_SCALE} style={[styles.rowText, { color: colors.textPrimary }, on && styles.rowTextOn]} numberOfLines={1}>
                {t.name}
              </Text>
              <View
                style={[
                  styles.check,
                  on ? { backgroundColor: colors.primary, borderColor: colors.primary } : { borderColor: colors.border },
                ]}
              >
                {on ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {total >= MAX_INTERESTS ? (
        <Text style={[styles.count, { color: colors.warning }]}>You've reached the limit of {MAX_INTERESTS} interests.</Text>
      ) : null}
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56, paddingVertical: 12 },
  rowText: { ...typography.body, flex: 1 },
  rowTextOn: { fontFamily: fontFamilies.sansSemiBold },
  check: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  count: { ...typography.caption, textAlign: 'center' },
});
