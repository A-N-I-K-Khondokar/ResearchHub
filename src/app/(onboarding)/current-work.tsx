import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Info, UploadCloud, Check } from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  TopicChip,
  OnboardingHeader,
  OnboardingProgress,
} from '@/components';
import { radius, spacing, typography, fontFamilies } from '@/constants';
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
  const { colors, isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStage, setSelectedStage] = useState('Experimentation');

  // Smart Autofill PDF State
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);

  const handleAutofillPDF = () => {
    if (isExtracting) return;

    setIsExtracting(true);
    setIsExtracted(false);

    // Simulated Extraction Process (1500ms)
    setTimeout(() => {
      setTitle('Optimizing Large Language Models for Low-Resource Bengali Dialects');
      setDescription(
        'This research focuses on cross-lingual transfer learning and parameter-efficient fine-tuning for Bengali dialectal texts, specifically low-resource Sylheti and Chittagonian varieties.'
      );
      setSelectedStage('Experimentation');
      setIsExtracting(false);
      setIsExtracted(true);
    }, 1500);
  };

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
              borderColor: isExtracted ? colors.secondary : colors.border,
              shadowOpacity: isDark ? 0 : 0.04,
              elevation: isDark ? 0 : 1,
            },
          ]}
        >
          {/* Smart Autofill from PDF Action */}
          <View style={styles.autofillContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAutofillPDF}
              disabled={isExtracting}
              style={[
                styles.autofillButton,
                {
                  backgroundColor: isExtracted
                    ? isDark
                      ? colors.surfaceSubtle
                      : colors.secondaryLight
                    : isDark
                    ? colors.surfaceSubtle
                    : colors.surface,
                  borderColor: isExtracted ? colors.secondary : colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Autofill from PDF"
            >
              {isExtracting ? (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                />
              ) : isExtracted ? (
                <Check
                  size={16}
                  strokeWidth={2.4}
                  color={colors.secondary}
                />
              ) : (
                <UploadCloud
                  size={16}
                  strokeWidth={2}
                  color={colors.primary}
                />
              )}

              <Text
                style={[
                  styles.autofillButtonText,
                  {
                    color: isExtracted
                      ? colors.secondary
                      : isExtracting
                      ? colors.primary
                      : colors.textPrimary,
                  },
                ]}
              >
                {isExtracting
                  ? 'Scanning document...'
                  : isExtracted
                  ? 'Autofilled from PDF'
                  : 'Autofill from PDF'}
              </Text>
            </TouchableOpacity>

            {/* Subtle Divider */}
            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]}
              />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                or enter details manually
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.borderSubtle }]}
              />
            </View>
          </View>

          {/* Project Title Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Project / Thesis Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Evaluating Transformer Models for Bangla NLP"
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? colors.surfaceSubtle : colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />
          </View>

          {/* Overview / Focus Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Short Overview / Focus
            </Text>
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
                  backgroundColor: isDark ? colors.surfaceSubtle : colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
            />
          </View>

          {/* Current Stage */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textPrimary }]}>
              Current Research Stage
            </Text>
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
              Sharing Current Work is temporary momentum, not a publication. It helps
              departmental peers collaborate with you early.
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
    shadowColor: '#071A3E',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  autofillContainer: {
    marginBottom: spacing.xs,
  },
  autofillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.2,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: spacing.md,
  },
  autofillButtonText: {
    fontSize: 13.5,
    fontFamily: fontFamilies.sansSemiBold,
    letterSpacing: 0.1,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11.5,
    fontFamily: fontFamilies.sansRegular,
    marginHorizontal: spacing.sm,
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
