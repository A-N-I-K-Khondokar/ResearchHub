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
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
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
          <Text style={[styles.title, { color: colors.textPrimary }]}>Research Interests</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Select topics that interest you to personalize your research feed and suggested collaborators.
          </Text>
        </View>

        {/* Topic Grid Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.cardHeaderTitle, { color: colors.primary }]}>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  cardHeaderTitle: {
    ...typography.caption,
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
