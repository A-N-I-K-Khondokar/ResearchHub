import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react-native';
import { ScreenContainer, Button, AuthInput } from '@/components';
import { radius, spacing, typography } from '@/constants';
import { useTheme } from '@/context/ThemeContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Decorative Strip */}
          <View style={[styles.accentBar, { backgroundColor: colors.primary }]} />

          {/* Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.border,
              },
            ]}
          >
            <KeyRound size={32} color={colors.primary} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.replace('/(auth)/login' as any)}
              style={styles.backLink}
            >
              <ArrowLeft size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>Back to Login</Text>
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
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.cardPadding * 1.2,
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
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
    fontWeight: '600',
  },
});
