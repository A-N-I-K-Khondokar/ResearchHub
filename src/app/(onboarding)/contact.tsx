/**
 * First-run welcome · step 3 of 4 — contact card (optional).
 * Opens the existing guided contact editor (ContactCardContext).
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, IdCard, Lock, Pencil, Users } from 'lucide-react-native';
import { Button } from '@/components/common/Button';
import { OnboardingScaffold } from '@/components/onboarding/OnboardingScaffold';
import { useContactCard } from '@/context/ContactCardContext';
import { useTheme } from '@/context/ThemeContext';
import { useFinishOnboarding } from '@/hooks/useFinishOnboarding';
import { contactValueFor } from '@/utils/contact';
import { fontFamilies, radius, spacing, typography } from '@/constants';

export default function OnboardingContact() {
  const router = useRouter();
  const { colors } = useTheme();
  const { myCard, hasMyCard, openContactEditor } = useContactCard();
  const finish = useFinishOnboarding();
  const hasCard = Boolean(hasMyCard && myCard && (myCard.email || myCard.preferredContact));

  const point = (Icon: typeof Users, text: string) => (
    <View style={styles.point}>
      <Icon size={16} color={colors.primary} />
      <Text style={[styles.pointText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );

  return (
    <OnboardingScaffold
      step={3}
      title="How teammates reach you"
      subtitle="There’s no chat in the app. When you join a project, teammates use your contact card to get in touch."
      onBack={() => router.back()}
      onSkip={() => finish()}
      footer={
        <Button
          label={hasCard ? 'Continue' : 'Not now'}
          variant={hasCard ? 'primary' : 'secondary'}
          size="lg"
          fullWidth
          icon={hasCard ? <ArrowRight size={18} color="#FFFFFF" /> : undefined}
          iconPosition="right"
          onPress={() => router.push('/(onboarding)/start' as any)}
        />
      }
    >
      <View style={styles.section}>
        <View style={styles.cardHead}>
          {hasCard ? <CheckCircle2 size={24} color={colors.success} /> : <IdCard size={24} color={colors.primary} />}
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {hasCard ? 'Your contact card is ready' : 'Add your contact card'}
            </Text>
            <Text style={[styles.cardText, { color: colors.textSecondary }]} numberOfLines={2}>
              {hasCard
                ? [myCard?.preferredContact ? contactValueFor(myCard.preferredContact) : null, myCard?.email ? 'email shared' : null]
                    .filter(Boolean)
                    .join(' · ')
                : 'WhatsApp, Telegram, phone, LinkedIn or your verified email.'}
            </Text>
          </View>
        </View>
        <Button
          label={hasCard ? 'Edit contact card' : 'Add contact details'}
          variant={hasCard ? 'secondary' : 'primary'}
          size="lg"
          icon={hasCard ? <Pencil size={14} color={colors.textPrimary} /> : <IdCard size={15} color="#FFFFFF" />}
          onPress={openContactEditor}
          style={styles.cardBtn}
        />
      </View>

      <View style={[styles.points, { borderTopColor: colors.border }]}>
        {point(Lock, 'Only your connections can see it, never the public.')}
        {point(Users, 'Joining a team connects you with its lead automatically.')}
      </View>
    </OnboardingScaffold>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { ...typography.title, fontFamily: fontFamilies.sansSemiBold, fontSize: 17, lineHeight: 23 },
  cardText: { ...typography.body, marginTop: 2 },
  cardBtn: { height: spacing.buttonHeight },
  points: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: spacing.xl, paddingTop: spacing.lg, gap: spacing.md },
  point: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  pointText: { ...typography.bodySmall, flex: 1 },
});
