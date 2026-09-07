import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Info } from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  TopicChip,
  OnboardingHeader,
  OnboardingProgress,
} from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

const STAGE_OPTIONS = [
  'Ideation',
  'Data Collection',
  'Experimentation',
  'Paper in Preparation',
  'In Review',
];

export default function CurrentWorkScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStage, setSelectedStage] = useState('Experimentation');

  const handleNext = () => {
    router.push('/(onboarding)/external-profiles' as any);
  };

  const handleSkip = () => {
    router.push('/(onboarding)/external-profiles' as any);
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoidance>
      <View style={styles.container}>
        <OnboardingHeader
          step={3}
          totalSteps={5}
          onBack={() => router.back()}
        />

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Current Work</Text>
          <Text style={styles.subtitle}>
            What are you currently researching or developing?
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Project / Thesis Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Evaluating Transformer Models for Bangla NLP"
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Short Overview / Focus</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Briefly describe what you are testing, dataset progress, or research goals..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.textInput, styles.textArea]}
            />
          </View>

          {/* Current Stage */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Research Stage</Text>
            <View style={styles.stageRow}>
              {STAGE_OPTIONS.map((stage) => (
                <TopicChip
                  key={stage}
                  label={stage}
                  selected={selectedStage === stage}
                  onPress={() => setSelectedStage(stage)}
                  variant={selectedStage === stage ? 'primary' : 'outline'}
                />
              ))}
            </View>
          </View>

          {/* Info Callout */}
          <View style={styles.infoBox}>
            <Info size={18} color={colors.primary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              Sharing Current Work is temporary momentum, not a publication. It helps departmental peers collaborate with you early.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            label="Next"
            onPress={handleNext}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color={colors.textInverse} />}
            iconPosition="right"
            fullWidth
          />

          <Button
            label="Skip for now"
            onPress={handleSkip}
            variant="ghost"
            fullWidth
            style={styles.skipButton}
          />
        </View>

        <OnboardingProgress currentStep={3} totalSteps={5} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  titleBlock: {
    alignItems: 'center',
    marginVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  title: {
    ...typography.display,
    fontSize: 26,
    lineHeight: 34,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: spacing.xs + 2,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  textArea: {
    height: 96,
    paddingTop: spacing.sm,
  },
  stageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs + 2,
    marginTop: spacing.xs,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    ...typography.caption,
    color: colors.primaryDark,
    lineHeight: 18,
  },
  actionContainer: {
    width: '100%',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  skipButton: {
    marginTop: spacing.xs,
  },
});
