import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  TopicChip,
  OnboardingHeader,
  OnboardingProgress,
} from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

const TOPIC_OPTIONS = [
  'Machine Learning',
  'Computer Vision',
  'Bangla NLP',
  'Artificial Intelligence',
  'Cybersecurity',
  'Cloud Computing',
  'Internet of Things (IoT)',
  'Data Science & Analytics',
  'Human-Computer Interaction',
  'Software Engineering',
  'Robotics & Automation',
  'Bioinformatics',
  'Distributed Systems',
  'Blockchain & Web3',
];

export default function ResearchInterestsScreen() {
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Machine Learning',
    'Bangla NLP',
    'Computer Vision',
  ]);

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter((t) => t !== topic));
    } else {
      setSelectedTopics([...selectedTopics, topic]);
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        <OnboardingHeader
          step={2}
          totalSteps={5}
          onBack={() => router.back()}
        />

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Research Interests</Text>
          <Text style={styles.subtitle}>
            Select topics that interest you to personalize your research feed and suggested collaborators.
          </Text>
        </View>

        {/* Topic Grid Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={styles.cardHeaderTitle}>
              {selectedTopics.length > 0
                ? `${selectedTopics.length} topics selected`
                : 'Tap to select research topics'}
            </Text>
          </View>

          <View style={styles.chipContainer}>
            {TOPIC_OPTIONS.map((topic) => {
              const isSelected = selectedTopics.includes(topic);
              return (
                <TopicChip
                  key={topic}
                  label={topic}
                  selected={isSelected}
                  onPress={() => toggleTopic(topic)}
                  variant={isSelected ? 'primary' : 'default'}
                />
              );
            })}
          </View>
        </View>

        {/* Next Button */}
        <View style={styles.actionContainer}>
          <Button
            label="Next Step"
            onPress={() => router.push('/(onboarding)/current-work' as any)}
            variant="primary"
            size="lg"
            icon={<ArrowRight size={18} color={colors.textInverse} />}
            iconPosition="right"
            disabled={selectedTopics.length === 0}
            fullWidth
          />
        </View>

        <OnboardingProgress currentStep={2} totalSteps={5} />
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderTitle: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionContainer: {
    width: '100%',
    marginBottom: spacing.sm,
  },
});
