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
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

const STAGE_OPTIONS = [
  'Ideation',
  'Data Collection',
  'Experimentation',
  'Paper in Preparation',
  'In Review',
];

export default function CurrentWorkScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Current Work</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            What are you currently researching or developing?
          </Text>
        </View>

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Project / Thesis Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Evaluating Transformer Models for Bangla NLP"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Short Overview / Focus</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Briefly describe what you are testing, dataset progress, or research goals..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.textInput,
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />
          </View>

          {/* Current Stage */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>Current Research Stage</Text>
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
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryLight,
              },
            ]}
          >
            <Info size={18} color={colors.primary} style={styles.infoIcon} />
            <Text style={[styles.infoText, { color: colors.primaryDark }]}>
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
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs + 2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
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
    borderWidth: 1,
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
