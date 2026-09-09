import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  GraduationCap,
  FlaskConical,
  Cpu,
  Code2,
  Globe,
  ArrowRight,
} from 'lucide-react-native';
import {
  ScreenContainer,
  Button,
  AuthInput,
  OnboardingHeader,
  OnboardingProgress,
} from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function ExternalProfilesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [googleScholar, setGoogleScholar] = useState('');
  const [researchGate, setResearchGate] = useState('');
  const [ieee, setIeee] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');

  const handleNext = () => {
    router.push('/(onboarding)/ready' as any);
  };

  const handleSkip = () => {
    router.push('/(onboarding)/ready' as any);
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoidance>
      <View style={styles.container}>
        <OnboardingHeader
          step={4}
          totalSteps={5}
          onBack={() => router.back()}
        />

        {/* Title Block */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Connect External Profiles</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Link your existing research profiles to build your academic identity.
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
          <AuthInput
            label="Google Scholar"
            value={googleScholar}
            onChangeText={setGoogleScholar}
            placeholder="https://scholar.google.com/citations?user=..."
            keyboardType="url"
            leftIcon={<GraduationCap size={18} color={colors.primary} />}
          />

          <AuthInput
            label="ResearchGate"
            value={researchGate}
            onChangeText={setResearchGate}
            placeholder="https://www.researchgate.net/profile/..."
            keyboardType="url"
            leftIcon={<FlaskConical size={18} color={colors.secondaryDark} />}
          />

          <AuthInput
            label="IEEE Xplore"
            value={ieee}
            onChangeText={setIeee}
            placeholder="https://ieeexplore.ieee.org/author/..."
            keyboardType="url"
            leftIcon={<Cpu size={18} color={colors.primary} />}
          />

          <AuthInput
            label="GitHub"
            value={github}
            onChangeText={setGithub}
            placeholder="https://github.com/username"
            keyboardType="url"
            leftIcon={<Code2 size={18} color={colors.textPrimary} />}
          />

          <AuthInput
            label="Personal Website / Portfolio"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://www.yourdomain.edu"
            keyboardType="url"
            leftIcon={<Globe size={18} color={colors.textSecondary} />}
            style={{ marginBottom: 0 }}
          />
        </View>

        {/* Actions */}
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

        <OnboardingProgress currentStep={4} totalSteps={5} />
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
  actionContainer: {
    width: '100%',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  skipButton: {
    marginTop: spacing.xs,
  },
});
