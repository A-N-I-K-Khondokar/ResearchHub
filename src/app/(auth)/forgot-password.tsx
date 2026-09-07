import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react-native';
import { ScreenContainer, Button, AuthInput } from '@/components';
import { colors, radius, spacing, typography, shadows } from '@/constants';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendReset = () => {
    if (!email.trim()) {
      setEmailError('Please enter your institutional email');
      return;
    }
    if (!email.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/(auth)/forgot-password-success' as any);
    }, 600);
  };

  return (
    <ScreenContainer scrollable withKeyboardAvoidance>
      <View style={styles.container}>
        <View style={styles.card}>
          {/* Top Decorative Strip */}
          <View style={styles.accentBar} />

          {/* Icon Badge */}
          <View style={styles.iconCircle}>
            <KeyRound size={32} color={colors.primary} />
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your institutional email address and we'll send you a link to reset your password.
          </Text>

          {/* Input */}
          <AuthInput
            label="Email"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) setEmailError('');
            }}
            placeholder="researcher@university.edu"
            keyboardType="email-address"
            error={emailError}
            leftIcon={<Mail size={18} color={colors.textSecondary} />}
            style={styles.input}
          />

          {/* Submit Button */}
          <Button
            label="Send Reset Link"
            onPress={handleSendReset}
            loading={loading}
            fullWidth
            style={styles.button}
          />

          {/* Back to Login Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace('/(auth)/login' as any)}
              style={styles.backLink}
            >
              <ArrowLeft size={16} color={colors.primary} />
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
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
    padding: spacing.cardPadding * 1.2,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    ...shadows.card,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  input: {
    width: '100%',
  },
  button: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    width: '100%',
    alignItems: 'center',
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
});
