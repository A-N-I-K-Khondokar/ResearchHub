import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordSuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Success Icon */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primaryLight,
              },
            ]}
          >
            <CheckCircle2 size={44} color={colors.primary} />
          </View>

          {/* Title and Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>Link Sent</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            If an account exists for that email, you will receive a reset link shortly.
          </Text>

          {/* Primary Action Button */}
          <Button
            label="Back to Login"
            onPress={() => router.replace('/(auth)/login' as any)}
            variant="primary"
            fullWidth
            style={styles.button}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding * 1.5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  button: {
    width: '100%',
  },
});
