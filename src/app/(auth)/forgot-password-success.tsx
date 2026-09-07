import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { ScreenContainer, Button } from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

export default function ForgotPasswordSuccessScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Success Icon */}
          <View style={styles.iconCircle}>
            <CheckCircle2 size={44} color={colors.primary} />
          </View>

          {/* Title and Message */}
          <Text style={styles.title}>Link Sent</Text>
          <Text style={styles.body}>
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
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding * 1.5,
    alignItems: 'center',
    ...shadows.card,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  button: {
    width: '100%',
  },
});
